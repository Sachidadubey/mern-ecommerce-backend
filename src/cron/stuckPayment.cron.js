const mongoose = require("mongoose");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");

const STUCK_TIME_MINUTES = 30;

exports.handleStuckPayments = async () => {
  try {
    const cutoffTime = new Date(
      Date.now() - STUCK_TIME_MINUTES * 60 * 1000
    );

    // 1️⃣ Find stuck payments (no transaction needed for read)
    const stuckPayments = await Payment.find({
      status: "PENDING",
      createdAt: { $lte: cutoffTime },
    });

    if (stuckPayments.length === 0) {
      console.log("✅ No stuck payments found");
      return;
    }

    console.log(`🔄 Processing ${stuckPayments.length} stuck payments...`);

    for (const payment of stuckPayments) {
      try {
        const order = await Order.findById(payment.order);
        if (!order) continue;

        // Idempotency guard
        if (order.orderStatus === "CANCELLED") continue;

        // 🔄 Restore stock (synchronously without transaction)
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock += item.quantity;
            await product.save();  // No session
          }
        }

        // Update payment
        payment.status = "FAILED";
        payment.failureReason = "Payment timeout (cron)";
        await payment.save();  // No session

        // Update order
        order.orderStatus = "CANCELLED";
        order.paymentStatus = "FAILED";
        await order.save();  // No session

        console.log(`✅ Cancelled order: ${order._id}`);
      } catch (innerErr) {
        console.error(`❌ Error processing payment ${payment._id}:`, innerErr.message);
        // Continue with next payment
      }
    }

    console.log("✅ Stuck payment cron completed");
  } catch (err) {
    console.error("❌ Stuck payment cron failed:", err.message);
  }
};
