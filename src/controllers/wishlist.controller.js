const asyncHandler = require("../utils/asyncHandler");
const wishlistService = require("../services/wishlist.service");

/* =========================
   ADD TO WISHLIST
========================= */
exports.addToWishlist = asyncHandler(async (req, res) => {
  const result = await wishlistService.addToWishlistService(
    req.user._id,
    req.params.productId
  );

  if (result?.action === "exists") {
    return res.status(200).json({
      success: true,
      message: "Product already in wishlist",
    });
  }

  res.status(201).json({
    success: true,
    message: "Added to wishlist",
  });
});

/* =========================
   REMOVE FROM WISHLIST
========================= */
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

/* =========================
   GET MY WISHLIST
========================= */
exports.getMyWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getMyWishlistService(req.user._id);

  res.status(200).json({
    success: true,
    count: wishlist.length,
    data: wishlist,
  });
});

/* =========================
   CLEAR WISHLIST
========================= */
exports.clearWishlist = asyncHandler(async (req, res) => {
  const result = await wishlistService.clearWishlistService(req.user._id);

  res.status(200).json({
    success: true,
    message: "Wishlist cleared successfully",
    clearedCount: result.clearedCount,
  });
});
