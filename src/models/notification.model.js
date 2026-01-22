const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "ORDER_CONFIRMED",
        "PAYMENT_RECEIVED",
        "ORDER_SHIPPED",
        "ORDER_DELIVERED",
        "ORDER_CANCELLED",
        "REFUND_INITIATED",
        "REFUND_COMPLETED",
        "REVIEW_REPLY",
        "PRICE_DROP",
        "BACK_IN_STOCK",
        "WISHLIST_ITEM_ON_SALE",
      ],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    resourceType: {
      type: String,
      enum: ["ORDER", "PRODUCT", "REVIEW"],
    },

    resourceId: mongoose.Schema.Types.ObjectId,

    link: String, // URL to the relevant page

    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: Date,

    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Indexes
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
