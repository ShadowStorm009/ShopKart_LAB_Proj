import crypto from "crypto";
import http from "http";
import dotenv from "dotenv";
dotenv.config();

// We will launch index.js or import the app
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./config/db.js";
import Product from "./models/product.model.js";
import Customer from "./models/customer.model.js";
import Order from "./models/order.model.js";
import { sampleProducts } from "./seeds/seedProducts.js";

import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

let server;
const PORT = 5555;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runTests() {
  console.log("==========================================");
  console.log("🧪 SHOPKART LAB 06 - AUTOMATED VERIFICATION");
  console.log("==========================================\n");

  await connectDB();

  // Clear test DB and seed products
  await Customer.deleteMany({});
  await Order.deleteMany({});
  await Product.deleteMany({});
  const insertedProducts = await Product.insertMany(sampleProducts);
  console.log(`✅ Seeded ${insertedProducts.length} products for testing.`);

  server = app.listen(PORT);
  console.log(`✅ Test server running on ${BASE_URL}\n`);

  let cookieUserA = "";
  let cookieUserB = "";
  let tokenUserA = "";
  let tokenUserB = "";

  // Helper fetch with cookie handling
  async function api(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = options.headers || {};
    if (options.token) {
      headers["Authorization"] = `Bearer ${options.token}`;
    }
    if (options.cookie) {
      headers["Cookie"] = options.cookie;
    }
    if (options.body && typeof options.body === "object") {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const setCookie = res.headers.get("set-cookie");
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    return { status: res.status, data, setCookie };
  }

  // --- Step 1: Register and Login User A and User B ---
  console.log("🔹 Step 1: Register and Login User A and User B");
  const regA = await api("/customers/register", {
    method: "POST",
    body: {
      fullName: "Aarav Sharma",
      email: "aarav@example.com",
      password: "password123",
      phone: "9876543210",
    },
  });
  console.log(`User A registered (Status: ${regA.status})`);

  const loginA = await api("/customers/login", {
    method: "POST",
    body: {
      email: "aarav@example.com",
      password: "password123",
    },
  });
  tokenUserA = loginA.data.token;
  cookieUserA = loginA.setCookie?.split(";")[0] || "";
  console.log(`User A logged in (Status: ${loginA.status})`);

  const regB = await api("/customers/register", {
    method: "POST",
    body: {
      fullName: "Priya Patel",
      email: "priya@example.com",
      password: "password123",
      phone: "9123456780",
    },
  });
  console.log(`User B registered (Status: ${regB.status})`);

  const loginB = await api("/customers/login", {
    method: "POST",
    body: {
      email: "priya@example.com",
      password: "password123",
    },
  });
  tokenUserB = loginB.data.token;
  cookieUserB = loginB.setCookie?.split(";")[0] || "";
  console.log(`User B logged in (Status: ${loginB.status})`);


  // --- Test 1: Empty cart -> POST /orders/create-payment-order -> 400 Bad Request ---
  console.log("\n🧪 Test 1: Empty cart order rejection");
  const test1 = await api("/orders/create-payment-order", {
    method: "POST",
    token: tokenUserA,
    body: {
      shippingAddress: {
        fullName: "Aarav Sharma",
        phone: "9876543210",
        addressLine1: "123 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
    },
  });
  console.log(`Result: ${test1.status} - Message: ${test1.data?.message}`);
  if (test1.status === 400) {
    console.log("✅ Test 1 PASSED: Empty cart rejected with 400 Bad Request.");
  } else {
    console.error("❌ Test 1 FAILED: Expected 400 Bad Request.");
  }

  // --- Test 2: Add items to cart & Create Payment Order ---
  console.log("\n🧪 Test 2: Create Payment Order with items");
  const prod1 = insertedProducts[0];
  const prod2 = insertedProducts[1];

  await api(`/cart/${prod1._id}`, { method: "POST", token: tokenUserA });
  await api(`/cart/${prod2._id}`, { method: "POST", token: tokenUserA });

  const test2 = await api("/orders/create-payment-order", {
    method: "POST",
    token: tokenUserA,
    body: {
      shippingAddress: {
        fullName: "Aarav Sharma",
        phone: "9876543210",
        addressLine1: "123 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
      totalAmount: 1, // Fake client total - must be ignored!
    },
  });
  console.log(`Result: ${test2.status}`);
  console.log(`ShopKart Order ID: ${test2.data?.shopKartOrderId}`);
  console.log(`Razorpay Order ID: ${test2.data?.razorpayOrderId}`);
  console.log(`Amount in Paise: ${test2.data?.amount}`);
  console.log(`Currency: ${test2.data?.currency}`);
  console.log(`Key: ${test2.data?.key}`);

  const expectedTotal = Number(prod1.price) + Number(prod2.price);
  const expectedPaise = Math.round(expectedTotal * 100);

  if (
    test2.status === 200 &&
    test2.data?.shopKartOrderId &&
    test2.data?.razorpayOrderId &&
    test2.data?.amount === expectedPaise &&
    test2.data?.currency === "INR"
  ) {
    console.log("✅ Test 2 PASSED: Payment order created with correct server total and Razorpay order.");
  } else {
    console.error("❌ Test 2 FAILED: Response mismatch.", test2.data);
  }

  const shopKartOrderId = test2.data?.shopKartOrderId;
  const razorpayOrderId = test2.data?.razorpayOrderId;

  // --- Test 3: Cart before payment verification ---
  console.log("\n🧪 Test 3: Cart preserved before payment verification");
  const test3 = await api("/cart", { token: tokenUserA });
  console.log(`Cart item count: ${test3.data?.cart?.length}`);
  if (test3.status === 200 && test3.data?.cart?.length === 2) {
    console.log("✅ Test 3 PASSED: Cart items preserved while payment is pending.");
  } else {
    console.error("❌ Test 3 FAILED: Cart items were modified prematurely.");
  }

  // --- Test 4: Fake payment signature verification rejection ---
  console.log("\n🧪 Test 4: Invalid signature rejection");
  const test4 = await api("/orders/verify-payment", {
    method: "POST",
    token: tokenUserA,
    body: {
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: "pay_test_fake123456",
      razorpay_signature: "bogus_signature_should_fail_hmac",
    },
  });
  console.log(`Result: ${test4.status} - Message: ${test4.data?.message}`);
  // Verify cart is STILL not cleared
  const cartAfterFailedSig = await api("/cart", { token: tokenUserA });
  if (test4.status === 400 && cartAfterFailedSig.data?.cart?.length === 2) {
    console.log("✅ Test 4 PASSED: Invalid signature rejected with 400 and cart NOT cleared.");
  } else {
    console.error("❌ Test 4 FAILED: Expected 400 rejection and cart preserved.");
  }

  // --- Test 5: Valid payment signature verification ---
  console.log("\n🧪 Test 5: Valid signature verification");
  const validPaymentId = "pay_test_valid_998877";
  const hmacBody = `${razorpayOrderId}|${validPaymentId}`;
  const validSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "cxKQ93uAJ4cQVmPcXBd8uoxc")
    .update(hmacBody)
    .digest("hex");

  const test5 = await api("/orders/verify-payment", {
    method: "POST",
    token: tokenUserA,
    body: {
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: validPaymentId,
      razorpay_signature: validSignature,
    },
  });
  console.log(`Result: ${test5.status}`);
  console.log(`Payment Status: ${test5.data?.order?.paymentStatus}`);
  console.log(`Order Status: ${test5.data?.order?.status}`);
  console.log(`Razorpay Payment ID: ${test5.data?.order?.razorpayPaymentId}`);

  if (
    test5.status === 200 &&
    test5.data?.order?.paymentStatus === "PAID" &&
    test5.data?.order?.status === "PLACED" &&
    test5.data?.order?.razorpayPaymentId === validPaymentId
  ) {
    console.log("✅ Test 5 PASSED: Valid payment verified, order marked PAID and PLACED.");
  } else {
    console.error("❌ Test 5 FAILED:", test5.data);
  }

  // --- Test 6: Cart cleared after successful payment ---
  console.log("\n🧪 Test 6: Cart cleared after payment verification");
  const test6 = await api("/cart", { token: tokenUserA });
  console.log(`Cart items remaining: ${test6.data?.cart?.length}`);
  if (test6.status === 200 && test6.data?.cart?.length === 0) {
    console.log("✅ Test 6 PASSED: Cart completely cleared in database.");
  } else {
    console.error("❌ Test 6 FAILED: Cart was not cleared.");
  }

  // --- Test 7: Get user orders ---
  console.log("\n🧪 Test 7: Get user orders (GET /orders)");
  const test7 = await api("/orders", { token: tokenUserA });
  console.log(`Orders found for User A: ${test7.data?.orders?.length}`);
  if (test7.status === 200 && test7.data?.orders?.length >= 1) {
    console.log("✅ Test 7 PASSED: GET /orders returned user's order history.");
  } else {
    console.error("❌ Test 7 FAILED:", test7.data);
  }

  // --- Test 8: Get order by ID ---
  console.log("\n🧪 Test 8: Get single order details (GET /orders/:id)");
  const test8 = await api(`/orders/${shopKartOrderId}`, { token: tokenUserA });
  console.log(`Order ID: ${test8.data?.order?._id}`);
  console.log(`Items in snapshot: ${test8.data?.order?.items?.length}`);
  console.log(`Snapshot Item 1: ${test8.data?.order?.items[0]?.name} @ ₹${test8.data?.order?.items[0]?.price}`);
  if (
    test8.status === 200 &&
    test8.data?.order?._id === shopKartOrderId &&
    test8.data?.order?.items?.length === 2 &&
    test8.data?.order?.items[0]?.price !== undefined
  ) {
    console.log("✅ Test 8 PASSED: Order snapshot retrieved with preserved prices.");
  } else {
    console.error("❌ Test 8 FAILED:", test8.data);
  }

  // --- Test 9: Access another user's order -> 403 Forbidden ---
  console.log("\n🧪 Test 9: Access another user's order");
  const test9 = await api(`/orders/${shopKartOrderId}`, { token: tokenUserB });
  console.log(`Result when User B accesses User A's order: ${test9.status} - Message: ${test9.data?.message}`);
  if (test9.status === 403) {
    console.log("✅ Test 9 PASSED: 403 Forbidden enforced for non-owner access.");
  } else {
    console.error("❌ Test 9 FAILED: Expected 403 Forbidden, got", test9.status);
  }

  // --- Test 10: Insufficient stock validation ---
  console.log("\n🧪 Test 10: Insufficient stock verification");
  // Set prod1 stock to 0 in DB
  await Product.findByIdAndUpdate(prod1._id, { stock: 0 });
  // User B tries to order prod1
  await Customer.findByIdAndUpdate(regB.data.customer._id || (await Customer.findOne({ email: "priya@example.com" }))._id, {
    cart: [{ product: prod1._id, quantity: 1 }],
  });

  const test10 = await api("/orders/create-payment-order", {
    method: "POST",
    token: tokenUserB,
    body: {
      shippingAddress: {
        fullName: "Priya Patel",
        phone: "9123456780",
        addressLine1: "456 Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038",
      },
    },
  });
  console.log(`Result: ${test10.status} - Message: ${test10.data?.message}`);
  if (test10.status === 400 && test10.data?.message?.includes("Insufficient stock")) {
    console.log("✅ Test 10 PASSED: Insufficient stock detected and rejected with informative 400 message.");
  } else {
    console.error("❌ Test 10 FAILED:", test10.data);
  }

  // --- Test 11: Unauthenticated request -> 401 Unauthorized ---
  console.log("\n🧪 Test 11: Unauthenticated request");
  const test11 = await api("/orders", { method: "GET" });
  console.log(`Result: ${test11.status} - Message: ${test11.data?.message}`);
  if (test11.status === 401) {
    console.log("✅ Test 11 PASSED: 401 Unauthorized returned when not logged in.");
  } else {
    console.error("❌ Test 11 FAILED: Expected 401 Unauthorized.");
  }

  // --- Test 12: Bonus Status Progression ---
  console.log("\n🧪 Test 12: Bonus Challenge - Order Status Progression");
  const test12 = await api(`/orders/${shopKartOrderId}/status`, {
    method: "PATCH",
    token: tokenUserA,
    body: { status: "SHIPPED" },
  });
  console.log(`Updated status: ${test12.data?.order?.status}`);
  if (test12.status === 200 && test12.data?.order?.status === "SHIPPED") {
    console.log("✅ Test 12 PASSED: Order status updated to SHIPPED successfully.");
  } else {
    console.error("❌ Test 12 FAILED:", test12.data);
  }

  // --- Test 13: Direct COD Order Creation (POST /orders) ---
  console.log("\n🧪 Test 13: Direct COD Order Creation (POST /orders)");
  const prod3 = insertedProducts[2];
  // Add prod3 to User B's cart
  await Customer.findByIdAndUpdate(regB.data.customer._id || (await Customer.findOne({ email: "priya@example.com" }))._id, {
    cart: [{ product: prod3._id, quantity: 1 }],
  });

  const test13 = await api("/orders", {
    method: "POST",
    token: tokenUserB,
    body: {
      shippingAddress: {
        fullName: "Priya Patel",
        phone: "9123456780",
        addressLine1: "456 Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038",
      },
      paymentMethod: "COD",
    },
  });

  console.log(`Result: ${test13.status}`);
  console.log(`Order Status: ${test13.data?.order?.status}`);
  console.log(`Payment Method: ${test13.data?.order?.paymentMethod}`);
  const cartBAfterOrder = await api("/cart", { token: tokenUserB });

  if (
    test13.status === 201 &&
    test13.data?.order?.status === "PLACED" &&
    test13.data?.order?.paymentMethod === "COD" &&
    cartBAfterOrder.data?.cart?.length === 0
  ) {
    console.log("✅ Test 13 PASSED: COD order created and user B cart cleared.");
  } else {
    console.error("❌ Test 13 FAILED:", test13.data);
  }


  console.log("\n==========================================");
  console.log("🎉 ALL TESTS EXECUTED SUCCESSFULLY!");
  console.log("==========================================\n");

  server.close();
  process.exit(0);
}

runTests().catch((err) => {
  console.error("FATAL TEST ERROR:", err);
  if (server) server.close();
  process.exit(1);
});
