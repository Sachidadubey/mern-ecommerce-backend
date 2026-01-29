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
    receipt: `order_${order._id}`,
  });


  await Payment.create({
    user: userId,
    order: order._id,
    amount: order.totalAmount,
    paymentProvider: "razorpay",
    paymentMethod: "upi",
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
/**
 * =========================
 * RAZORPAY WEBHOOK
 * =========================
 */

exports.verifyPaymentService = async (req) => {
  /* =========================
     1️⃣ RAW BODY & SIGNATURE
  ========================= */
  const rawBody = req.body.toString();
  const signature = req.headers["x-razorpay-signature"];

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  const isValidSignature = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValidSignature) {
    throw new Error("Invalid Razorpay signature");
  }

  /* =========================
     2️⃣ PARSE EVENT
  ========================= */
  const event = JSON.parse(rawBody);
  const entity = event.payload?.payment?.entity;
  if (!entity) return;

  /* =========================
     3️⃣ FIND PAYMENT
  ========================= */
  const payment = await Payment.findOne({
    gatewayOrderId: entity.order_id,
  });

  if (!payment) return;

  // Idempotency guard
  if (["SUCCESS", "FAILED", "REFUNDED"].includes(payment.status)) {
    return;
  }

  /* =========================
     4️⃣ PAYMENT FAILED
  ========================= */
  if (event.event === "payment.failed") {
    payment.status = "FAILED";
    payment.failureReason = "Gateway failure";
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, {
     paymentStatus: "FAILED",
    orderStatus: "PAYMENT_FAILED", // ✅ allow retry
    });

    return;
  }

  /* =========================
     5️⃣ PAYMENT SUCCESS
  ========================= */
  if (event.event === "payment.captured") {
    const order = await Order.findById(payment.order);
    if (!order) return;

    // 🔐 Amount & currency validation (MANDATORY)
    if (entity.amount !== order.totalAmount * 100) {
      throw new Error("Payment amount mismatch");
    }
    if (entity.currency !== "INR") {
      throw new Error("Invalid currency");
    }

    /* =========================
       6️⃣ TRANSACTION (SAFE)
    ========================= */
    const canUseTxn =
      mongoose.connection.client?.topology?.description?.type ===
      "ReplicaSetWithPrimary";

    const session = canUseTxn ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
      let hasNegativeStock = false;

      // 🔥 STOCK REDUCTION
      for (const item of order.items) {
        const product = await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity, totalSold: +item.quantity } },
          { new: true, session }
        );

        if (product.stock < 0) {
          hasNegativeStock = true;
          console.warn(
            `❌ OVERSELLING: ${product.name} | stock: ${product.stock}`
          );
        }
      }

      /* =========================
         7️⃣ AUTO REFUND (OVERSOLD)
      ========================= */
      if (hasNegativeStock) {
        // Restore stock
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { session }
          );
        }

        payment.status = "REFUNDED";
        payment.refundReason = "Overselling - Auto refund";
        payment.refundedAt = new Date();
        await payment.save({ session });

        order.paymentStatus = "REFUNDED";
        order.orderStatus = "CANCELLED";
        order.cancelReason = "Out of stock at payment time";
        order.cancelledAt = new Date();
        await order.save({ session });

        if (session) {
          await session.commitTransaction();
          session.endSession();
        }

        // 🔥 Trigger gateway refund (async)
        razorpay.payments.refund(
          entity.id,
          { speed: "optimum" },
          (err, refund) => {
            if (err) console.error("❌ Refund failed:", err);
            else console.log("✅ Auto-refund:", refund.id);
          }
        );

        return;
      }

      /* =========================
         8️⃣ NORMAL SUCCESS FLOW
      ========================= */
      payment.status = "SUCCESS";
      payment.gatewayPaymentId = entity.id;
      payment.paidAt = new Date();
      await payment.save({ session });

      order.paymentStatus = "PAID";
      order.orderStatus = "CONFIRMED";
      order.paidAt = new Date();
      await order.save({ session });

      // 🔥 CLEAR CART
      await Cart.findOneAndUpdate(
        { user: order.user },
        { items: [] },
        { session }
      );

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }
    } catch (err) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw err;
    }
  }
};


exports.manualVerifyPaymentService = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {

  /* =========================
     1️⃣ VERIFY SIGNATURE
  ========================= */
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new AppError("Invalid payment signature", 400);
  }

  /* =========================
     2️⃣ FIND PAYMENT
  ========================= */
  const payment = await Payment.findOne({
    gatewayOrderId: razorpay_order_id,
    status: "PENDING",
  });

  if (!payment) {
    throw new AppError("Payment not found or already processed", 404);
  }

  /* =========================
     3️⃣ FIND ORDER
  ========================= */
  const order = await Order.findById(payment.order);
  if (!order) throw new AppError("Order not found", 404);

  /* =========================
     4️⃣ AMOUNT VALIDATION
  ========================= */
  if (payment.amount !== order.totalAmount) {
    throw new AppError("Payment amount mismatch", 400);
  }

  /* =========================
     5️⃣ TRANSACTION
  ========================= */
  const canUseTxn =
    mongoose.connection.client?.topology?.description?.type ===
    "ReplicaSetWithPrimary";

  const session = canUseTxn ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    /* =========================
       6️⃣ STOCK CHECK (NO OVERSALE)
    ========================= */
    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session);

      if (!product || product.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for product ${item.product}`,
          400
        );
      }
    }

    /* =========================
       7️⃣ STOCK REDUCTION
    ========================= */
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity, totalSold: item.quantity } },
        { session }
      );
    }

    /* =========================
       8️⃣ UPDATE PAYMENT
    ========================= */
    payment.status = "SUCCESS";
    payment.gatewayPaymentId = razorpay_payment_id;
    payment.paidAt = new Date();
    await payment.save({ session });

    /* =========================
       9️⃣ UPDATE ORDER
    ========================= */
    order.paymentStatus = "PAID";
    order.orderStatus = "CONFIRMED";
    order.paidAt = new Date();
    await order.save({ session });

    /* =========================
       🔟 CLEAR CART
    ========================= */
    await Cart.findOneAndUpdate(
      { user: order.user },
      { items: [] },
      { session }
    );

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    return { success: true };

  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw err;
  }
};

/**
 * =========================
 * REFUND PAYMENT (ADMIN)
 * =========================
 */
exports.refundPaymentService = async (paymentId) => {
  const payment = await Payment.findById(paymentId).populate("order");
  if (!payment || payment.status !== "SUCCESS") {
    throw new AppError("Refund not allowed", 400);
  }

  // 🔥 Gateway refund (outside transaction)
  await new Promise((resolve, reject) => {
    razorpay.payments.refund(payment.gatewayPaymentId, (err, refund) => {
      if (err) return reject(err);
      resolve(refund);
    });
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of payment.order.items) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        product.stock += item.quantity;
        await product.save({ session });
      }
    }

    payment.status = "REFUNDED";
    payment.refundedAt = new Date();
    await payment.save({ session });

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


