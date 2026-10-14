import mongoose from "mongoose";
import Product from "../models/product.model.js";

/**
 * @desc    Create a new product
 * @route   POST /products
 * @access  Public (Admin operation in future labs)
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // Validate required fields
    if (!name || !description || price === undefined || !category || !image || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (name, description, price, category, image, stock)",
      });
    }

    const numPrice = Number(price);
    const numStock = Number(stock);

    // Validate price > 0
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid number greater than 0",
      });
    }

    // Validate stock >= 0
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: numPrice,
      category: category.trim(),
      image: image.trim(),
      stock: numStock,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error creating product",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all products with search, category filtering & sorting
 * @route   GET /products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    // Build dynamic query object
    const query = {};

    // 1. Search filter: case-insensitive partial match on name
    if (search && search.trim() !== "") {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    // 2. Category filter (case-insensitive exact or trimmed match)
    if (category && category.trim() !== "" && category.toLowerCase() !== "all") {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, "i") };
    }

    // 3. Sorting logic (Lab 3 Bonus Challenge)
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === "price_asc") {
      sortOption = { price: 1 };
    } else if (sort === "price_desc") {
      sortOption = { price: -1 };
    } else if (sort === "name_asc") {
      sortOption = { name: 1 };
    }

    const products = await Product.find(query).sort(sortOption);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching products",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching product details",
      error: error.message,
    });
  }
};

export {
  createProduct,
  getProducts,
  getProductById,
};
