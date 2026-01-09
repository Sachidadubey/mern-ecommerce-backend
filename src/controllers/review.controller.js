const mongoose = require("mongoose");
const Review = require("../models/review.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * =========================
 * ADD / UPDATE REVIEW (USER)
 * =========================
 */
exports.addOrUpdateReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  /**
   * User must have DELIVERED order for this product
   */
  const hasPurchased = await Order.exists({
    user: req.user._id,
    orderStatus: "DELIVERED",
    "items.product": productId,
  });

  if (!hasPurchased) {
    throw new AppError(
      "You can review only products you have purchased",
      403
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /**
     * Create or update review
     */
    const review = await Review.findOneAndUpdate(
      { user: req.user._id, product: productId },
      { rating, comment, isDeleted: false },
      {
        new: true,
        upsert: true,
        runValidators: true,
        session,
      }
    );

    /**
     * Recalculate product rating
     */
    const stats = await Review.aggregate([
      {
        $match: {
          product: review.product,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    await Product.findByIdAndUpdate(
      review.product,
      {
        averageRating: stats[0]?.avgRating || 0,
        reviewCount: stats[0]?.count || 0,
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Review saved successfully",
      data: review,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

/**
 * =========================
 * GET PRODUCT REVIEWS (PUBLIC)
 * =========================
 */
exports.getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const reviews = await Review.find({
    product: productId,
    isDeleted: false,
  })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});

/**
 * =========================
 * DELETE REVIEW (OWNER / ADMIN)
 * =========================
 */
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review || review.isDeleted) {
    throw new AppError("Review not found", 404);
  }

  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new AppError("Not authorized", 403);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    review.isDeleted = true;
    await review.save({ session });

    const stats = await Review.aggregate([
      {
        $match: {
          product: review.product,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    await Product.findByIdAndUpdate(
      review.product,
      {
        averageRating: stats[0]?.avgRating || 0,
        reviewCount: stats[0]?.count || 0,
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});
