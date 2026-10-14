import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";

/**
 * @desc    Add a product to authenticated user's wishlist
 * @route   POST /wishlist/:productId
 * @access  Protected
 */
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId as a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // 2. Verify product exists in database
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 3. Find customer from authenticated token
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 4. Check for duplicate product in wishlist
    const isAlreadyWishlisted = customer.wishlist.some(
      (id) => id.toString() === productId
    );

    if (isAlreadyWishlisted) {
      return res.status(409).json({
        success: false,
        message: "Product already in wishlist",
      });
    }

    // 5. Append product ObjectId to wishlist & persist
    customer.wishlist.push(productId);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    console.error("Add To Wishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error adding to wishlist",
      error: error.message,
    });
  }
};

/**
 * @desc    Get current authenticated user's populated wishlist
 * @route   GET /wishlist
 * @access  Protected
 */
const getWishlist = async (req, res) => {
  try {
    // Current user loaded via auth middleware
    const customer = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price category image stock description",
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Filter out any potential nulls if a product was deleted from db
    const validWishlist = (customer.wishlist || []).filter(Boolean);

    return res.status(200).json({
      success: true,
      count: validWishlist.length,
      wishlist: validWishlist,
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching wishlist",
      error: error.message,
    });
  }
};

/**
 * @desc    Remove product from authenticated user's wishlist
 * @route   DELETE /wishlist/:productId
 * @access  Protected
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if product is currently in wishlist
    const productIndex = customer.wishlist.findIndex(
      (id) => id.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    // Remove from array & persist
    customer.wishlist.splice(productIndex, 1);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error("Remove From Wishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error removing from wishlist",
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle product in wishlist (Bonus Lab 4)
 * @route   PATCH /wishlist/:productId/toggle
 * @access  Protected
 */
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const customer = await Customer.findById(req.user._id);
    const existingIndex = customer.wishlist.findIndex(
      (id) => id.toString() === productId
    );

    let saved = false;
    let message = "";

    if (existingIndex > -1) {
      // Remove
      customer.wishlist.splice(existingIndex, 1);
      saved = false;
      message = "Product removed from wishlist";
    } else {
      // Add
      customer.wishlist.push(productId);
      saved = true;
      message = "Product added to wishlist";
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      saved,
      message,
    });
  } catch (error) {
    console.error("Toggle Wishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error toggling wishlist",
      error: error.message,
    });
  }
};

export {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
};
