const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    description: String,

    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: 0,
    },

    maxDiscountAmount: {
      type: Number,
      default: null, // For percentage discounts, cap the maximum discount
    },

    minOrderAmount: {
      type: Number,
      default: 0,
    },

    maxUses: {
      type: Number,
      default: null, // Null = unlimited
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    usagePerUser: {
      type: Number,
      default: 1, // How many times one user can use this coupon
    },

    validFrom: {
      type: Date,
      required: true,
    },

    validTo: {
      type: Date,
      required: true,
    },

    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    applicableUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
      index: true,
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
  },
  { timestamps: true }
);

// Indexes
couponSchema.index({ validFrom: 1, validTo: 1 });
couponSchema.index({ isActive: 1, validTo: 1 });

module.exports = mongoose.model("Coupon", couponSchema);
