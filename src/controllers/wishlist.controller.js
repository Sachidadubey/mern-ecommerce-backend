const asyncHandler = require("../utils/asyncHandler");
const wishlistService = require("../services/wishlist.service");

/**
 * ADD TO WISHLIST
 */
exports.addToWishlist = asyncHandler(async (req, res) => {
  const result = await wishlistService.addToWishlistService(
    req.user._id,
    req.params.productId
  );

  if (!result) {
    return res.status(200).json({
      success: true,
      message: "Product already in wishlist",
    });
  }

  res.status(201).json({
    success: true,
    message: "Product added to wishlist",
    data: result,
  });
});

/**
 * REMOVE FROM WISHLIST
 */
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  await wishlistService.removeFromWishlistService(
    req.user._id,
    req.params.productId
  );

  res.status(200).json({
    success: true,
    message: "Product removed from wishlist",
  });
});

/**
 * GET MY WISHLIST
 */
exports.getMyWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getMyWishlistService(
    req.user._id
  );

  res.status(200).json({
    success: true,
    count: wishlist.length,
    data: wishlist,
  });
});
