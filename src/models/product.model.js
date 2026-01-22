const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
      index: true,
    },

    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },

    categoryName: String, // Denormalized for quick access

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ================= INVENTORY ================= */
    lowStockThreshold: {
      type: Number,
      default: 10,
    },

    reorderQuantity: {
      type: Number,
      default: 50,
    },

    /* ================= SALES & DISCOUNT ================= */
    originalPrice: {
      type: Number,
      min: 0,
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    isOnSale: {
      type: Boolean,
      default: false,
    },

    saleStartDate: Date,

    saleEndDate: Date,

    /* ================= SALES TRACKING ================= */
    totalSold: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastRestockDate: Date,
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */

// Prevent duplicate products
productSchema.index(
  { name: 1, category: 1 },
  { unique: true }
);

// Search & filtering
productSchema.index({
  name: "text",
  description: "text",
});

productSchema.index({ category: 1, price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model("Product", productSchema);
