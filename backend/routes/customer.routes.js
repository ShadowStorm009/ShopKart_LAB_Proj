import express from "express";
import {
  registerCustomer,
  loginCustomer,
  getProfile,
  logoutCustomer,
  changePassword,
} from "../controllers/customer.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

// Protected routes
router.get("/me", protect, getProfile);
router.post("/logout", logoutCustomer);
router.patch("/change-password", protect, changePassword);

export default router;
