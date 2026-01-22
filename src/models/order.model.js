const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =====================
       ORDER STATUS
    ===================== */
    orderStatus: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED",
      ],
      default: "PLACED",
      index: true,
    },

    /* =====================
       PAYMENT STATUS
    ===================== */
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },

    paymentProvider: {
      type: String,
      enum: ["razorpay", "stripe"],
    },

    paymentOrderId: String,
    paymentId: String,

    paidAt: Date,
    refundedAt: Date,

    address: {
      name: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
    },

    /* ================= SHIPPING ================= */
    shippingStatus: {
      type: String,
      enum: ["NOT_SHIPPED", "SHIPPED", "DELIVERED"],
      default: "NOT_SHIPPED",
      index: true,
    },

    trackingNumber: String,

    shippedAt: Date,

    deliveredAt: Date,

    shippedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who shipped
    },

    /* ================= CANCELLATION & REFUND ================= */
    cancelReason: String,

    cancelledAt: Date,

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    /* ================= DISCOUNT ================= */
    couponCode: String,

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ================= NOTES ================= */
    adminNotes: String,

    customerNotes: String,
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
