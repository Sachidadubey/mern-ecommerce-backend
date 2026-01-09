const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

/**
 * =========================
 * INDEXES (PRODUCTION)
 * =========================
 */

// Prevent duplicate wishlist items
wishlistSchema.index(
  { user: 1, product: 1 },
  { unique: true }
);

// Fast user wishlist fetch
wishlistSchema.index({ user: 1 });

module.exports = mongoose.model("Wishlist", wishlistSchema);
