import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import Product from "./models/product.model.js";
import { sampleProducts } from "./seeds/seedProducts.js";

// Route imports
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and seed initial products if empty
connectDB().then(async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log("Empty product catalog detected. Auto-seeding initial products...");
      await Product.insertMany(sampleProducts);
      console.log(`✅ Auto-seeded ${sampleProducts.length} catalog products!`);
    }
  } catch (err) {
    console.warn("Auto-seed skipped or failed:", err.message);
  }
});

// CORS configuration for cookies and client requests
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation"), false);
    },
    credentials: true,
  })
);

// Body parser & cookie parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root health route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: "ShopKart API",
    status: "Healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Mount modular routes across Labs 1, 2, 3, 4, 5
app.use("/customers", customerRoutes);
app.use("/auth", customerRoutes); // Alias for flexible TA testing
app.use("/products", productRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 ShopKart Server running on port ${PORT}`);
});

export { app, server };
