const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
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
      maxlength: 500,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

/* =========================
   INDEXES (IMPORTANT)
========================= */

// One review per user per product
reviewSchema.index(
  { user: 1, product: 1 },
  { unique: true }
);

// Fast product reviews lookup
reviewSchema.index({ product: 1, isDeleted: 1 });

module.exports = mongoose.model("Review", reviewSchema);
