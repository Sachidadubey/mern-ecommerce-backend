const mongoose = require("mongoose");
const Review = require("../models/review.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const AppError = require("../utils/AppError");

/**
 * =========================
 * ADD OR UPDATE REVIEW
 * =========================
 */
exports.addOrUpdateReviewService = async (
  userId,
  productId,
  rating,
  comment
) => {
  // User must have DELIVERED order for this product
  const hasPurchased = await Order.exists({
    user: userId,
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
    // Upsert review
    const review = await Review.findOneAndUpdate(
      { user: userId, product: productId },
      { rating, comment, isDeleted: false },
      {
        new: true,
        upsert: true,
        runValidators: true,
        session,
      }
    );

    // Recalculate rating
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

    return review;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * =========================
 * GET PRODUCT REVIEWS (PUBLIC)
 * =========================
 */
exports.getProductReviewsService = async (productId) => {
  return Review.find({
    product: productId,
    isDeleted: false,
  })
    .populate("user", "name")
    .sort({ createdAt: -1 });
};

/**
 * =========================
 * GET MY REVIEW FOR PRODUCT
 * =========================
 */
exports.getMyReviewForProductService = async (userId, productId) => {
  return Review.findOne({
    user: userId,
    product: productId,
    isDeleted: false,
  });
};

/**
 * =========================
 * DELETE REVIEW (OWNER / ADMIN)
 * =========================
 */
exports.deleteReviewService = async (reviewId, user) => {
  const review = await Review.findById(reviewId);

  if (!review || review.isDeleted) {
    throw new AppError("Review not found", 404);
  }

  if (
    review.user.toString() !== user._id.toString() &&
    user.role !== "admin"
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
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * =========================
 * GET ALL REVIEWS (ADMIN)
 * =========================
 */
exports.getAllReviewsAdminService = async () => {
  return Review.find()
    .populate("user", "name email")
    .populate("product", "name")
    .sort({ createdAt: -1 });
};
