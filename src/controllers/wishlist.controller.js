const asyncHandler = require("../utils/asyncHandler");
const wishlistService = require("../services/wishlist.service");

/**
 * =========================
 * ADD TO WISHLIST
 * =========================
 */
exports.addToWishlist = asyncHandler(async (req, res) => {
  await wishlistService.addToWishlistService(
    req.user._id,
    req.params.productId
  );

  res.status(200).json({
    success: true,
    message: "Added to wishlist",
  });
});

/**
 * =========================
 * REMOVE FROM WISHLIST
 * =========================
 */
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  await wishlistService.removeFromWishlistService(
    req.user._id,
    req.params.productId
  );

  res.status(200).json({
    success: true,
    message: "Removed from wishlist",
  });
});

/**
 * =========================
 * GET MY WISHLIST
 * =========================
 */
exports.getMyWishlist = asyncHandler(async (req, res) => {
  const wishlist =
    await wishlistService.getMyWishlistService(req.user._id);

  res.status(200).json({
    success: true,
    count: wishlist.length,
    data: wishlist,
  });
});
