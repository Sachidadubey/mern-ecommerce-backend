const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    gatewayPaymentId: {
      type: String,
    },
  },
  { timestamps: true }
);

/**
 * =========================
 * INDEXES (PRODUCTION)
 * =========================
 */
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });

/**
 * Prevent duplicate gateway callbacks
 */
paymentSchema.index(
  { gatewayPaymentId: 1 },
  { unique: true, sparse: true }
);

/**
 * Allow ONLY ONE pending payment per order (race-condition fix)
 */
paymentSchema.index(
  { order: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "PENDING" },
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
