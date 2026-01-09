const mongoose = require("mongoose");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

/**
 * =========================
 * CREATE PAYMENT (LOCK ORDER)
 * =========================
 * Creates a new payment attempt
 * Atomically locks order
 */
exports.createPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod } = req.body;

  const order = await Order.findOneAndUpdate(
    { _id: orderId, orderStatus: "CREATED" },
    { orderStatus: "PAYMENT_INITIATED" },
    { new: true }
  );

  if (!order) {
    throw new AppError("Order not eligible for payment", 400);
  }

  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized", 403);
  }

  const payment = await Payment.create({
    user: req.user._id,
    order: order._id,
    amount: order.totalAmount,
    paymentMethod,
    status: "PENDING",
  });

  res.status(201).json({
    success: true,
    message: "Payment initiated",
    data: payment,
  });
});

/**
 * =========================
 * VERIFY PAYMENT (IDEMPOTENT)
 * =========================
 */
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, gatewayPaymentId, success } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findById(paymentId)
      .populate("order")
      .session(session);

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    /**
     * 🔐 IDEMPOTENCY GUARD
     */
    if (payment.status === "SUCCESS") {
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Payment already verified",
      });
    }

    /**
     * ❌ FAILURE CASE
     */
    if (!success) {
      payment.status = "FAILED";
      await payment.save({ session });

      payment.order.orderStatus = "CREATED"; // unlock order
      await payment.order.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: false,
        message: "Payment failed",
      });
    }

    /**
     * ✅ SUCCESS CASE
     */
    payment.status = "SUCCESS";
    payment.gatewayPaymentId = gatewayPaymentId;
    await payment.save({ session });

    payment.order.orderStatus = "PAID";
    payment.order.paymentStatus = "PAID";
    await payment.order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

/**
 * =========================
 * RETRY PAYMENT
 * =========================
 */
exports.retryPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const lastPayment = await Payment.findOne({ order: orderId })
    .sort({ createdAt: -1 });

  if (!lastPayment || lastPayment.status !== "FAILED") {
    throw new AppError("Retry not allowed", 400);
  }

  const order = await Order.findOneAndUpdate(
    { _id: orderId, orderStatus: "CREATED" },
    { orderStatus: "PAYMENT_INITIATED" },
    { new: true }
  );

  if (!order) {
    throw new AppError("Order not eligible for retry", 400);
  }

  const newPayment = await Payment.create({
    user: req.user._id,
    order: order._id,
    amount: order.totalAmount,
    paymentMethod: lastPayment.paymentMethod,
    status: "PENDING",
  });

  res.status(201).json({
    success: true,
    message: "Payment retry initiated",
    data: newPayment,
  });
});

/**
 * =========================
 * REFUND PAYMENT
 * =========================
 */
exports.refundPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

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

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});
