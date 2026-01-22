const mongoose = require("mongoose");

const inventoryLogSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    oldStock: {
      type: Number,
      required: true,
    },

    newStock: {
      type: Number,
      required: true,
    },

    quantityChanged: {
      type: Number,
      required: true, // Can be negative (reduction) or positive (increase)
    },

    action: {
      type: String,
      enum: [
        "ORDER_PLACED",
        "PAYMENT_RECEIVED",
        "PAYMENT_FAILED",
        "REFUND",
        "MANUAL_ADJUSTMENT",
        "STOCK_CORRECTION",
        "INITIAL_STOCK",
      ],
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    reason: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    notes: String,
  },
  { timestamps: true }
);

// Indexes for reporting
inventoryLogSchema.index({ product: 1, createdAt: -1 });
inventoryLogSchema.index({ action: 1, createdAt: -1 });
inventoryLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("InventoryLog", inventoryLogSchema);
