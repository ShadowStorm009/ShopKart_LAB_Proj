import Customer from "../models/customer.model.js";
import { sendTokenCookie } from "../utils/generateToken.js";

/**
 * @desc    Register a new customer
 * @route   POST /customers/register
 * @access  Public
 */
const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // 1. Validation: check for missing fields
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (fullName, email, password, phone)",
      });
    }

    // 2. Validation: password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // 3. Validation: email uniqueness
    const existingCustomer = await Customer.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // 4. Create customer (password hashed automatically in pre-save hook)
    const customer = await Customer.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
    });

    // 5. Success response (exclude password)
    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during registration",
      error: error.message,
    });
  }
};

/**
 * @desc    Authenticate customer & get token
 * @route   POST /customers/login
 * @access  Public
 */
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find customer by email
    const customer = await Customer.findOne({
      email: email.toLowerCase().trim(),
    });

    // Verify credentials without revealing whether email or password was wrong
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Set HttpOnly cookie with JWT
    const token = sendTokenCookie(res, customer._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token, // Also return token in JSON for optional Bearer usage
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login",
      error: error.message,
    });
  }
};

/**
 * @desc    Get currently authenticated customer profile
 * @route   GET /customers/me
 * @access  Protected
 */
const getProfile = async (req, res) => {
  try {
    // req.user is set by auth middleware
    return res.status(200).json({
      success: true,
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      createdAt: req.user.createdAt,
      customer: {
        _id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching profile",
      error: error.message,
    });
  }
};

/**
 * @desc    Logout customer / clear cookie
 * @route   POST /customers/logout
 * @access  Public / Protected
 */
const logoutCustomer = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during logout",
      error: error.message,
    });
  }
};

/**
 * @desc    Change password (Bonus Lab 1)
 * @route   PATCH /customers/change-password
 * @access  Protected
 */
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const isMatch = await customer.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password does not match",
      });
    }

    customer.password = newPassword;
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during password change",
      error: error.message,
    });
  }
};

export {
  registerCustomer,
  loginCustomer,
  getProfile,
  logoutCustomer,
  changePassword,
};
