import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";

/**
 * @desc    Add a product to authenticated user's cart (or increment quantity)
 * @route   POST /cart/:productId
 * @access  Protected
 */
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId as a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // 2. Find product in database & verify stock availability
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    // 3. Find authenticated customer
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.cart = customer.cart || [];

    // 4. Check if product already exists in cart
    const existingIndex = customer.cart.findIndex(
      (item) => item.product && item.product.toString() === productId
    );

    if (existingIndex > -1) {
      const targetQuantity = customer.cart[existingIndex].quantity + 1;
      // Validate against stock
      if (targetQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more units. Available stock is ${product.stock}.`,
        });
      }
      customer.cart[existingIndex].quantity = targetQuantity;
    } else {
      // Add with quantity 1
      if (product.stock < 1) {
        return res.status(400).json({
          success: false,
          message: "Requested quantity exceeds available stock",
        });
      }
      customer.cart.push({
        product: productId,
        quantity: 1,
      });
    }

    // 5. Persist to MongoDB
    await customer.save();

    // 6. Populate product details and return
    await customer.populate({
      path: "cart.product",
      select: "name price category image stock description",
    });

    const validCart = (customer.cart || []).filter((item) => item.product);

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: validCart,
    });
  } catch (error) {
    console.error("Add To Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error adding to cart",
      error: error.message,
    });
  }
};

/**
 * @desc    Get current authenticated user's cart with populated product info
 * @route   GET /cart
 * @access  Protected
 */
const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "cart.product",
      select: "name price category image stock description",
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Filter out items where product may have been deleted from catalog
    const validCart = (customer.cart || []).filter((item) => item.product);

    return res.status(200).json({
      success: true,
      cart: validCart,
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching cart",
      error: error.message,
    });
  }
};

/**
 * @desc    Update quantity of a product in authenticated user's cart
 * @route   PATCH /cart/:productId
 * @access  Protected
 */
const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // 1. Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // 2. Validate quantity parameter
    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be an integer of at least 1",
      });
    }

    // 3. Find product to check latest stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 4. Validate quantity against product stock
    if (parsedQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Quantity exceeds available stock of ${product.stock}`,
      });
    }

    // 5. Find authenticated customer
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 6. Check if product is currently in user's cart
    const itemIndex = (customer.cart || []).findIndex(
      (item) => item.product && item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // 7. Update quantity and persist
    customer.cart[itemIndex].quantity = parsedQty;
    await customer.save();

    await customer.populate({
      path: "cart.product",
      select: "name price category image stock description",
    });

    const validCart = (customer.cart || []).filter((item) => item.product);

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart: validCart,
    });
  } catch (error) {
    console.error("Update Cart Quantity Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error updating cart quantity",
      error: error.message,
    });
  }
};

/**
 * @desc    Remove a product from authenticated user's cart
 * @route   DELETE /cart/:productId
 * @access  Protected
 */
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // 2. Find customer
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 3. Find product index in cart
    const itemIndex = (customer.cart || []).findIndex(
      (item) => item.product && item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // 4. Remove item and persist
    customer.cart.splice(itemIndex, 1);
    await customer.save();

    await customer.populate({
      path: "cart.product",
      select: "name price category image stock description",
    });

    const validCart = (customer.cart || []).filter((item) => item.product);

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: validCart,
    });
  } catch (error) {
    console.error("Remove From Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error removing from cart",
      error: error.message,
    });
  }
};

/**
 * @desc    Clear all items in authenticated user's cart
 * @route   DELETE /cart
 * @access  Protected
 */
const clearCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.cart = [];
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart: [],
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error clearing cart",
      error: error.message,
    });
  }
};

export {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
};
