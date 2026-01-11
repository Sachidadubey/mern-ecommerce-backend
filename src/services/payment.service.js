const mongoose = require("mongoose");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const AppError = require("../utils/AppError");

/**
 * =========================
 * CREATE PAYMENT (LOCK ORDER)
 * =========================
 */
exports.createPaymentService = async (userId, orderId, paymentMethod) => {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, orderStatus: "CREATED" },
    { orderStatus: "PAYMENT_INITIATED" },
    { new: true }
  );

  if (!order) {
    throw new AppError("Order not eligible for payment", 400);
  }

  if (order.user.toString() !== userId.toString()) {
    throw new AppError("Not authorized", 403);
  }

  const payment = await Payment.create({
    user: userId,
    order: order._id,
    amount: order.totalAmount,
    paymentMethod,
    status: "PENDING",
  });

  return payment;
};

/**
 * =========================
 * VERIFY PAYMENT (IDEMPOTENT)
 * =========================
 */
exports.verifyPaymentService = async ({
  paymentId,
  gatewayPaymentId,
  success,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findById(paymentId)
      .populate("order")
      .session(session);

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    // 🔐 Idempotency guard
    if (payment.status === "SUCCESS") {
      await session.commitTransaction();
      session.endSession();
      return { alreadyVerified: true };
    }

    // ❌ FAILURE CASE
    if (!success) {
      payment.status = "FAILED";
      await payment.save({ session });

      payment.order.orderStatus = "CREATED"; // unlock order
      await payment.order.save({ session });

      await session.commitTransaction();
      session.endSession();

      return { success: false };
    }

    // ✅ SUCCESS CASE
    payment.status = "SUCCESS";
    payment.gatewayPaymentId = gatewayPaymentId;
    await payment.save({ session });

    payment.order.orderStatus = "PAID";
    payment.order.paymentStatus = "PAID";
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

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    if (payment.status !== "SUCCESS") {
      throw new AppError("Refund not allowed", 400);
    }

    const refundableStatuses = ["CANCELLED", "RETURN_APPROVED"];
    if (!refundableStatuses.includes(payment.order.orderStatus)) {
      throw new AppError(
        `Refund not allowed for order status ${payment.order.orderStatus}`,
        400
      );
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
