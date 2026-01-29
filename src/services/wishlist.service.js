const Wishlist = require("../models/wishlist.model");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError");

/* =========================
   ADD TO WISHLIST (IDEMPOTENT)
========================= */
exports.addToWishlistService = async (userId, productId) => {
  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  }).select("_id");

  if (!product) {
    throw new AppError("Product not available", 404);
  }

  try {
    const item = await Wishlist.create({
      user: userId,
      product: productId,
    });
    return { action: "added", item };
  } catch (err) {
    if (err.code === 11000) {
      return { action: "exists" };
    }
    throw err;
  }
};

/* =========================
   REMOVE FROM WISHLIST
========================= */
exports.removeFromWishlistService = async (userId, productId) => {
  const deleted = await Wishlist.findOneAndDelete({
    user: userId,
    product: productId,
  });

  if (!deleted) {
    throw new AppError("Product not found in wishlist", 404);
  }

  return { action: "removed" };
};

/* =========================
   GET MY WISHLIST
========================= */
exports.getMyWishlistService = async (userId) => {
  const wishlist = await Wishlist.find({ user: userId })
    .populate({
      path: "product",
      match: { isActive: true },
      select: "name price images averageRating",
    })
    .sort({ createdAt: -1 })
    .lean();

  return wishlist.filter(item => item.product);
};

/* =========================
   CLEAR WISHLIST
========================= */
exports.clearWishlistService = async (userId) => {
  const result = await Wishlist.deleteMany({ user: userId });

  return {
    clearedCount: result.deletedCount,
  };
};