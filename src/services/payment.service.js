const mongoose = require("mongoose");
const Payment = require("../models/payment.model");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError");
const { createRazorpayOrder } = require("../gateway/razorpay.gateway");
const razorpay = require("../config/razorPay");

const crypto = require("crypto");
const { cancelOrderAndRestoreStock } = require("./orderRecovery.service");

/**
 * =========================
 * CREATE PAYMENT (LOCK ORDER)
 * =========================
 */
exports.createPaymentService = async (userId, orderId) => {
  // 1️⃣ Order check
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  // 2️⃣ Ownership check
  if (order.user.toString() !== userId.toString()) {
    throw new AppError("Unauthorized", 403);
  }

  // 3️⃣ Hard stops
  if (order.paymentStatus === "PAID") {
    throw new AppError("Order already paid", 400);
  }

  if (order.orderStatus === "CANCELLED") {
    throw new AppError("Order cancelled", 400);
  }

  // 4️⃣ Idempotency: reuse running payment
  const pendingPayment = await Payment.findOne({
    order: orderId,
    status: "PENDING",
  });

  if (pendingPayment) {
    return {
      key: process.env.RAZORPAY_KEY_ID,
      orderId: pendingPayment.gatewayOrderId,
      amount: order.totalAmount * 100,
      currency: "INR",
    };
  }

  // 5️⃣ No pending payment → create new one
  // (FIRST TIME OR RETRY — SAME PATH)
  const razorpayOrder = await createRazorpayOrder({
    amount: order.totalAmount,
    receipt: `order_${order._id}_${Date.now()}`,
  });


  await Payment.create({
    user: userId,
    order: order._id,
    amount: order.totalAmount,
    paymentProvider: "razorpay",
    gatewayOrderId: razorpayOrder.id,
    status: "PENDING",
  });

  return {
    key: process.env.RAZORPAY_KEY_ID,
    orderId: razorpayOrder.id,
    amount: order.totalAmount * 100,
    currency: "INR",
  };
};


/**
 * WEBHOOK VERIFICATION
 */
exports.verifyPaymentService = async (req) => {
  const signature = req.headers["x-razorpay-signature"];

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (signature !== expectedSignature) {
    throw new Error("Invalid Razorpay signature");
  }

  const event = JSON.parse(req.body.toString());
  const entity = event.payload?.payment?.entity;
  if (!entity) return;

  const payment = await Payment.findOne({
    gatewayOrderId: entity.order_id,
  });

  if (!payment) return;

  if (["SUCCESS", "FAILED"].includes(payment.status)) return;

  if (event.event === "payment.failed") {
    payment.status = "FAILED";
    await payment.save();
    await cancelOrderAndRestoreStock(payment.order);
    return;
  }

  if (event.event === "payment.captured") {
    payment.status = "SUCCESS";
    payment.gatewayPaymentId = entity.id;
    payment.paidAt = new Date();
    await payment.save();

   const order= await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: "PAID",
      orderStatus: "CONFIRMED",
    }, { new: true });
    
    //// 🔥 CLEAR CART HERE
  await Cart.findOneAndUpdate(
    { user: order.user },
    { items: [] }
  );
  }
};


/**
 * =========================
 * REFUND PAYMENT (ADMIN)
 * =========================
 */
exports.refundPaymentService = async (paymentId) => {
  // 1️⃣ Payment fetch (no transaction yet)
  const payment = await Payment.findById(paymentId).populate("order");
  if (!payment) throw new AppError("Payment not found", 404);

  if (payment.status !== "SUCCESS") {
    throw new AppError("Refund not allowed", 400);
  }

  /**
   * 2️⃣ REAL GATEWAY REFUND (OUTSIDE TRANSACTION)
   * ⚠️ External API should NEVER be inside DB transaction
   */
  // @ts-ignore
  await razorpay.payments.refund(payment.gatewayPaymentId);

  /**
   * 3️⃣ DB TRANSACTION (ONLY DB OPERATIONS)
   */
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 🔄 Restore stock
    for (const item of payment.order.items) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        product.stock += item.quantity;
        await product.save({ session });
      }
    }

    // Update payment
    payment.status = "REFUNDED";
    payment.refundedAt = new Date();
    await payment.save({ session });

    // Update order
    payment.order.orderStatus = "REFUNDED";
    payment.order.paymentStatus = "REFUNDED";
    await payment.order.save({ session });

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

