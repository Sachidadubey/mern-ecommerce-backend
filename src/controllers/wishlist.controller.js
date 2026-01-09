const Wishlist = require("../models/wishlist.model");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * =========================
 * ADD TO WISHLIST (IDEMPOTENT)
 * =========================
 */
exports.addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Ensure product exists & is active
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new AppError("Product not available", 404);
  }

  try {
    const wishlistItem = await Wishlist.create({
      user: req.user._id,
      product: productId,
    });

    res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      data: wishlistItem,
    });
  } catch (err) {
    // 🔐 Handle duplicate wishlist add (idempotency)
    if (err.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Product already in wishlist",
      });
    }
    throw err;
  }
});

/**
 * =========================
 * REMOVE FROM WISHLIST
 * =========================
 */
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const deleted = await Wishlist.findOneAndDelete({
    user: req.user._id,
    product: productId,
  });

  if (!deleted) {
    throw new AppError("Product not found in wishlist", 404);
  }

  res.status(200).json({
    success: true,
    message: "Product removed from wishlist",
  });
});

/**
 * =========================
 * GET MY WISHLIST
 * =========================
 */
exports.getMyWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.find({ user: req.user._id })
    .populate("product", "name price images averageRating isActive")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: wishlist.length,
    data: wishlist,
  });
});
