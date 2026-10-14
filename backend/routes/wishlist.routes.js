import express from "express";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
} from "../controllers/wishlist.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

router.route("/").get(getWishlist);
router.route("/:productId").post(addToWishlist).delete(removeFromWishlist);
router.route("/:productId/toggle").patch(toggleWishlist);

export default router;
