const mongoose = require("mongoose");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");

const STUCK_TIME_MINUTES = 30;

exports.handleStuckPayments = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cutoffTime = new Date(
      Date.now() - STUCK_TIME_MINUTES * 60 * 1000
    );

    // 1️⃣ Find stuck payments
    const stuckPayments = await Payment.find({
      status: "PENDING",
      createdAt: { $lte: cutoffTime },
    }).session(session);

    if (stuckPayments.length === 0) {
      await session.commitTransaction();
      session.endSession();
      return;
    }

    for (const payment of stuckPayments) {
      const order = await Order.findById(payment.order).session(session);
      if (!order) continue;

      // Idempotency guard
      if (order.orderStatus === "CANCELLED") continue;

      // 🔄 Restore stock
      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          product.stock += item.quantity;
          await product.save({ session });
        }
      }

      // Update payment
      payment.status = "FAILED";
      payment.failureReason = "Payment timeout (cron)";
      await payment.save({ session });

      // Update order
      order.orderStatus = "CANCELLED";
      order.paymentStatus = "FAILED";
      await order.save({ session });
    }

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Stuck payment cron failed:", err.message);
  }
};
