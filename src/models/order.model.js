const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    /* =====================
       ORDER (FULFILLMENT)
       ===================== */
    orderStatus: {
      type: String,
      enum: [
        "CREATED",
        "PAYMENT_INITIATED",// order placed
        "PROCESSING",   // payment done, preparing
        "SHIPPED",      // shipped
        "DELIVERED",
        "RETURNED_APPROVED", 
        "CANCELLED",    // cancelled before shipping
      ],
      default: "CREATED",
      index: true,
    },

    /* =====================
       PAYMENT (FINANCIAL)
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
      required:true,
    },

    paymentIntentId: {
      type: String, // stripe payment_intent OR razorpay_order_id
    },

    paymentId: {
      type: String, // razorpay_payment_id
    },

    paidAt: Date,
    refundedAt: Date,

    address: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
orderSchema.index(
  { paymentIntentId: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("Order", orderSchema);
