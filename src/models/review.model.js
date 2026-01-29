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

    // 🔥 Soft delete (never hard delete reviews)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    // 🔥 Optional but very useful
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   INDEXES (VERY IMPORTANT)
========================= */

// ✅ One active review per user per product
reviewSchema.index(
  { user: 1, product: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// ✅ Fast lookup for product reviews
reviewSchema.index({ product: 1, isDeleted: 1 });

// ✅ Useful for admin moderation / analytics
reviewSchema.index({ rating: 1 });

module.exports = mongoose.model("Review", reviewSchema);
