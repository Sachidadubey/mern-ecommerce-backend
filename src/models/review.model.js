const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/**
 * =========================
 * INDEXES (PRODUCTION)
 * =========================
 */

// One review per user per product
reviewSchema.index(
  { user: 1, product: 1 },
  { unique: true }
);

// Fast product review queries
reviewSchema.index({ product: 1 });

module.exports = mongoose.model("Review", reviewSchema);
