import express from "express";
import {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All cart endpoints require user authentication (Lab 05 - Section 5 & Acceptance Criteria)
router.use(protect);

router.route("/")
  .get(getCart)
  .delete(clearCart);

router.route("/:productId")
  .post(addToCart)
  .patch(updateCartQuantity)
  .delete(removeFromCart);

export default router;
