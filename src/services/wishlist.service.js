const Wishlist = require("../models/wishlist.model");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError");

/**
 * =========================
 * ADD TO WISHLIST (IDEMPOTENT)
 * =========================
 */
exports.addToWishlistService = async (userId, productId) => {
  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    throw new AppError("Product not available", 404);
  }

  try {
    return await Wishlist.create({
      user: userId,
      product: productId,
    });
  } catch (err) {
    // Duplicate add → idempotent behavior
    if (err.code === 11000) {
      return null;
    }
    throw err;
  }
};

/**
 * =========================
 * REMOVE FROM WISHLIST
 * =========================
 */
exports.removeFromWishlistService = async (userId, productId) => {
  const deleted = await Wishlist.findOneAndDelete({
    user: userId,
    product: productId,
  });

  if (!deleted) {
    throw new AppError("Product not found in wishlist", 404);
  }
};

/**
 * =========================
 * GET MY WISHLIST
 * =========================
 */
exports.getMyWishlistService = async (userId) => {
  return Wishlist.find({ user: userId })
    .populate(
      "product",
      "name price images averageRating isActive"
    )
    .sort({ createdAt: -1 });
};
