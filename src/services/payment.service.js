const mongoose = require("mongoose");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError");

/**
 * =========================
 * CREATE PAYMENT (LOCK ORDER)
 * =========================
 */
exports.createPaymentService = async (userId, orderId, paymentMethod) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);

    if (!order) throw new AppError("Order not found", 404);

    if (order.user.toString() !== userId.toString()) {
      throw new AppError("Not authorized", 403);
    }

    if (order.orderStatus !== "PLACED") {
      throw new AppError("Order not eligible for payment", 400);
    }

    if (order.paymentStatus === "PAID") {
      throw new AppError("Order already paid", 400);
    }

    order.orderStatus = "PAYMENT_PENDING";
    await order.save({ session });

    const payment = await Payment.create(
      [
        {
          user: userId,
          order: order._id,
          amount: order.totalAmount,
          paymentMethod,
          status: "PENDING",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return payment[0];
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * =========================
 * VERIFY PAYMENT (GATEWAY / WEBHOOK ONLY)
 * =========================
 */
exports.verifyPaymentService = async ({
  paymentId,
  gatewayPaymentId,
  gatewayStatus,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findById(paymentId)
      .populate("order")
      .session(session);

    if (!payment) throw new AppError("Payment not found", 404);

    // 🔐 Idempotency
    if (payment.status === "SUCCESS") {
      await session.commitTransaction();
      session.endSession();
      return { alreadyProcessed: true };
    }

    // ❌ PAYMENT FAILED
    if (gatewayStatus !== "SUCCESS") {
      payment.status = "FAILED";
      await payment.save({ session });

      // Restore inventory
      for (const item of payment.order.items) {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          product.stock += item.quantity;
          await product.save({ session });
        }
      }

      payment.order.orderStatus = "CANCELLED";
      await payment.order.save({ session });

      await session.commitTransaction();
      session.endSession();
      return { success: false };
    }

    // ✅ PAYMENT SUCCESS
    payment.status = "SUCCESS";
    payment.gatewayPaymentId = gatewayPaymentId;
    await payment.save({ session });

    payment.order.paymentStatus = "PAID";
    payment.order.orderStatus = "PAID";
    await payment.order.save({ session });

    await session.commitTransaction();
    session.endSession();
    return { success: true };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * =========================
 * REFUND PAYMENT (ADMIN)
 * =========================
 */
exports.refundPaymentService = async (paymentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findById(paymentId)
      .populate("order")
      .session(session);

    if (!payment) throw new AppError("Payment not found", 404);

    if (payment.status !== "SUCCESS") {
      throw new AppError("Refund not allowed", 400);
    }

    // Restore inventory
    for (const item of payment.order.items) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        product.stock += item.quantity;
        await product.save({ session });
      }
    }

    payment.status = "REFUNDED";
    await payment.save({ session });

    payment.order.orderStatus = "REFUNDED";
    await payment.order.save({ session });

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};
