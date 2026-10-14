import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
} from "../controllers/product.controller.js";

const router = express.Router();

router.route("/").post(createProduct).get(getProducts);
router.route("/:id").get(getProductById);

export default router;
