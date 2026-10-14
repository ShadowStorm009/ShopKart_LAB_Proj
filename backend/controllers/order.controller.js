import crypto from "crypto";
import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Customer from "../models/customer.model.js";
import razorpay from "../config/razorpay.js";

/**
 * Validate shipping address helper
 */
const validateShippingAddress = (address) => {
  if (!address || typeof address !== "object") {
    return "Shipping address is required";
  }

  const { fullName, phone, addressLine1, street, city, state, pincode, postalCode } = address;

  if (!fullName || !fullName.trim()) return "Full name is required";
  if (!phone || !phone.trim()) return "Phone number is required";

  const phoneRegex = /^[0-9+ -]{10,15}$/;
  if (!phoneRegex.test(phone.trim())) {
    return "Please enter a valid phone number (10 digits)";
  }

  const line1 = addressLine1 || street;
  if (!line1 || !line1.trim()) return "Address line 1 is required";
  if (!city || !city.trim()) return "City is required";
  if (!state || !state.trim()) return "State is required";

  const pin = pincode || postalCode;
  if (!pin || !pin.trim()) return "Pincode is required";

  const pinRegex = /^\d{6}$/;
  if (!pinRegex.test(pin.trim())) {
    return "Pincode must contain 6 digits";
  }

  return null;
};

/**
 * @desc    Validate cart and create pending ShopKart order + Razorpay Order
 * @route   POST /orders/create-payment-order
 * @access  Protected
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    // 1. Validate shipping address
    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) {
      return res.status(400).json({
        success: false,
        message: addressError,
      });
    }

    // 2. Load authenticated user with cart
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    const cart = customer.cart || [];
    if (cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Please add items to your cart before proceeding.",
      });
    }

    // 3. Load latest product data and verify stock & calculate server total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "Cart contains invalid product references",
        });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart is no longer available in catalog",
        });
      }

      // Revalidate stock
      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available stock: ${product.stock}, requested: ${item.quantity}.`,
        });
      }

      const itemTotal = Number(product.price) * Number(item.quantity);
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price, // Frozen price snapshot
        quantity: item.quantity,
        image: product.image,
      });
    }

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Order total amount must be greater than zero",
      });
    }

    const line1 = (shippingAddress.addressLine1 || shippingAddress.street).trim();
    const pin = (shippingAddress.pincode || shippingAddress.postalCode).trim();

    // 4. Create pending ShopKart order in MongoDB
    const shopKartOrder = new Order({
      user: customer._id,
      customer: customer._id,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        addressLine1: line1,
        street: line1,
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        pincode: pin,
        postalCode: pin,
        country: shippingAddress.country?.trim() || "India",
      },
      totalAmount,
      subtotal: totalAmount,
      shippingFee: 0,
      paymentMethod: "Razorpay",
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    await shopKartOrder.save();

    // 5. Create Razorpay Order in Paise (1 INR = 100 paise)
    const amountInPaise = Math.round(totalAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: shopKartOrder._id.toString(),
      notes: {
        shopKartOrderId: shopKartOrder._id.toString(),
        customerEmail: customer.email,
      },
    });

    // 6. Save Razorpay Order ID to the pending ShopKart order
    shopKartOrder.razorpayOrderId = razorpayOrder.id;
    await shopKartOrder.save();

    // 7. Return checkout data (Never expose key secret!)
    return res.status(200).json({
      success: true,
      message: "Razorpay order initiated successfully",
      shopKartOrderId: shopKartOrder._id,
      orderId: shopKartOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // in paise
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_TlKLl5a62W2IgV",
    });
  } catch (error) {
    console.error("Create Payment Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initialize payment order",
      error: error.message,
    });
  }
};

/**
 * @desc    Verify Razorpay HMAC SHA256 payment signature and confirm order
 * @route   POST /orders/verify-payment
 * @access  Protected
 */
export const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!shopKartOrderId || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification parameters",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ShopKart order ID",
      });
    }

    // 1. Fetch order from MongoDB
    const order = await Order.findById(shopKartOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 2. Ownership check
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        order,
      });
    }

    // 3. Verify HMAC SHA256 signature using database razorpayOrderId
    const trustedRazorpayOrderId = order.razorpayOrderId || razorpay_order_id;
    const body = `${trustedRazorpayOrderId}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "cxKQ93uAJ4cQVmPcXBd8uoxc")
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      order.paymentStatus = "FAILED";
      await order.save();
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // 4. Deduct catalog stock for each item
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // 5. Update order status to PAID and PLACED
    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // 6. Clear user cart in database
    const customer = await Customer.findById(req.user._id);
    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully and order placed",
      order,
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

/**
 * @desc    Direct Order / COD Order creation (also handles POST /orders)
 * @route   POST /orders
 * @access  Protected
 */
export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = "COD" } = req.body;

    if (paymentMethod === "Razorpay" || paymentMethod === "Online") {
      return createPaymentOrder(req, res);
    }

    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) {
      return res.status(400).json({
        success: false,
        message: addressError,
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    const cart = customer.cart || [];
    if (cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Please add items to proceed.",
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "Invalid product in cart",
        });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Product not found in catalog",
        });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      totalAmount += Number(product.price) * Number(item.quantity);
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      });
    }

    // Deduct stock for COD / Direct orders
    for (const item of cart) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    const line1 = (shippingAddress.addressLine1 || shippingAddress.street).trim();
    const pin = (shippingAddress.pincode || shippingAddress.postalCode).trim();

    const order = new Order({
      user: customer._id,
      customer: customer._id,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        addressLine1: line1,
        street: line1,
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        pincode: pin,
        postalCode: pin,
        country: shippingAddress.country?.trim() || "India",
      },
      totalAmount,
      subtotal: totalAmount,
      shippingFee: 0,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentMethod === "COD" ? "PENDING" : "PAID",
      status: "PLACED",
    });

    await order.save();

    customer.cart = [];
    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error creating order",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all orders belonging to authenticated user
 * @route   GET /orders
 * @access  Protected
 */
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get Orders Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single order details by ID
 * @route   GET /orders/:id
 * @access  Protected
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID format",
      });
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: you do not have permission to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order details",
      error: error.message,
    });
  }
};

/**
 * @desc    Update order status (Bonus Challenge: status progression)
 * @route   PATCH /orders/:id/status
 * @access  Protected
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID format",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden",
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};
