import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  createPaymentOrder,
  verifyPayment,
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = express.Router();

// Apply protect middleware to all order routes
router.use(protect);

// Razorpay Payment Flow
router.post("/create-payment-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);

// Standard Order Endpoints
router.route("/")
  .post(createOrder)
  .get(getOrders);

router.route("/:id")
  .get(getOrderById);

// Bonus: Order status update
router.patch("/:id/status", updateOrderStatus);

export default router;
