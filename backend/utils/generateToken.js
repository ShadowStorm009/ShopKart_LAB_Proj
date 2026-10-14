import jwt from "jsonwebtoken";

/**
 * Generate a JWT token for the customer
 * @param {string} id - Customer MongoDB ID
 * @returns {string} - Signed JWT
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "shopkart_super_secret_jwt_key_2026", {
    expiresIn: "7d",
  });
};

/**
 * Generate JWT and set it in HttpOnly cookie
 * @param {object} res - Express response object
 * @param {string} id - Customer MongoDB ID
 * @returns {string} - The token
 */
const sendTokenCookie = (res, id) => {
  const token = generateToken(id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };

  res.cookie("token", token, cookieOptions);
  return token;
};

export {
  generateToken,
  sendTokenCookie,
};
