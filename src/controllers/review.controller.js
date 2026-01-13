const asyncHandler = require("../utils/asyncHandler");
const reviewService = require("../services/review.service");

/**
 * =========================
 * ADD / UPDATE REVIEW
 * =========================
 * USER
 */
exports.addOrUpdateReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;

  const review = await reviewService.addOrUpdateReviewService(
    req.user._id,
    productId,
    rating,
    comment
  );

  res.status(201).json({
    success: true,
    message: "Review saved successfully",
    data: review,
  });
});

/**
 * =========================
 * GET PRODUCT REVIEWS
 * =========================
 * PUBLIC (PAGINATED)
 */
exports.getProductReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getProductReviewsService(
    req.params.productId,
    req.query
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * =========================
 * GET MY REVIEW FOR PRODUCT
 * =========================
 * USER
 */
exports.getMyReviewForProduct = asyncHandler(async (req, res) => {
  const review = await reviewService.getMyReviewForProductService(
    req.user._id,
    req.params.productId
  );

  res.status(200).json({
    success: true,
    data: review || null,
  });
});

/**
 * =========================
 * DELETE REVIEW
 * =========================
 * USER / ADMIN
 */
exports.deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReviewService(
    req.params.reviewId,
    req.user
  );

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

/**
 * =========================
 * GET ALL REVIEWS (ADMIN)
 * =========================
 */
exports.getAllReviewsAdmin = asyncHandler(async (req, res) => {
  const reviews =
    await reviewService.getAllReviewsAdminService(req.query);

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});
