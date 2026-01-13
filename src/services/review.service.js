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
  if (rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ✅ Purchase check inside transaction
    const hasPurchased = await Order.exists({
      user: userId,
      orderStatus: "DELIVERED",
      "items.product": productId,
    }).session(session);

    if (!hasPurchased) {
      throw new AppError(
        "You can review only products you have purchased",
        403
      );
    }

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

    const stats = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
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
      productId,
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
exports.getProductReviewsService = async (productId, query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({
    product: productId,
    isDeleted: false,
  })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Review.countDocuments({
    product: productId,
    isDeleted: false,
  });

  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
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
  }).lean();
};

/**
 * =========================
 * DELETE REVIEW (OWNER / ADMIN)
 * =========================
 */
exports.deleteReviewService = async (reviewId, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const review = await Review.findById(reviewId).session(session);

    if (!review || review.isDeleted) {
      throw new AppError("Review not found", 404);
    }

    if (
      review.user.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      throw new AppError("Not authorized", 403);
    }

    review.isDeleted = true;
    await review.save({ session });

    const stats = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(review.product),
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
exports.getAllReviewsAdminService = async (query = {}) => {
  const filter = {};
  if (query.includeDeleted !== "true") {
    filter.isDeleted = false;
  }

  return Review.find(filter)
    .populate("user", "name email")
    .populate("product", "name")
    .sort({ createdAt: -1 })
    .lean();
};
