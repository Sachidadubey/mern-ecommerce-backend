const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    /* =========================
       RELATIONS
    ========================= */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    /* =========================
       AMOUNT
    ========================= */
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =========================
       PAYMENT META
    ========================= */
    paymentProvider: {
      type: String,
      enum: ["razorpay", "stripe", "cod"],
      
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["upi", "card", "netbanking", "wallet", "cod"],
      required: true,
    },

    /* =========================
       STATUS
    ========================= */
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },

    /* =========================
       GATEWAY REFERENCES
    ========================= */
    gatewayOrderId: {
      type: String, // razorpay_order_id / stripe_intent_id
      index: true,
    },

    gatewayPaymentId: {
      type: String, // razorpay_payment_id / stripe_charge_id
    },

    failureReason: {
      type: String,
    },

    /* =========================
       TIMESTAMPS
    ========================= */
    paidAt: Date,
    refundedAt: Date,
  },
  { timestamps: true }
);

/* =========================
   INDEXES (PRODUCTION SAFE)
========================= */

// Prevent duplicate webhook processing
paymentSchema.index(
  { gatewayPaymentId: 1 },
  { unique: true, sparse: true }
);

// Allow only ONE pending payment per order
paymentSchema.index(
  { order: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "PENDING" },
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
