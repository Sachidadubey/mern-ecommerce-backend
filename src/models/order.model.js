const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true, // snapshot
    },
    price: {
      type: Number,
      required: true, // snapshot
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    /* =====================
       USER
    ===================== */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* =====================
       ITEMS
    ===================== */
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "Order must have at least one item",
      },
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
        "PAYMENT_PENDING",
        "PAID",
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

    /* =====================
       PAYMENT METADATA
    ===================== */
    paymentProvider: {
      type: String,
      enum: ["razorpay", "stripe"],
    },

    paymentOrderId: {
      type: String, // razorpay_order_id / stripe_session_id
      index: true,
    },

    paymentId: {
      type: String, // gateway payment id
    },

    paymentMethod: {
      type: String, // upi / card / netbanking
    },

    paidAt: Date,
    refundedAt: Date,

    /* =====================
       ADDRESS (SNAPSHOT)
    ===================== */
    address: {
      name: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: "India",
      },
    },

    /* =====================
       AUDIT
    ===================== */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* =====================
   INDEXES
===================== */
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ paymentOrderId: 1 }, { sparse: true });

module.exports = mongoose.model("Order", orderSchema);
