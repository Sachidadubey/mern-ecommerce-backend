const asyncHandler = require("../utils/asyncHandler");
const paymentService = require("../services/payment.service");
const AppError = require("../utils/AppError");

/**
 * =========================
 * CREATE PAYMENT
 * =========================
 * USER
 */
exports.createPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod } = req.body;

  if (!orderId || !paymentMethod) {
    throw new AppError("orderId and paymentMethod are required", 400);
  }

  const payment = await paymentService.createPaymentService(
    req.user._id,
    orderId,
    paymentMethod
  );

  res.status(201).json({
    success: true,
    message: "Payment initiated",
    data: payment,
  });
});

/**
 * =========================
 * VERIFY PAYMENT (WEBHOOK)
 * =========================
 * GATEWAY → BACKEND
 * ⚠️ NEVER wrap webhook in asyncHandler
 */
exports.verifyPayment = async (req, res) => {
  try {
    const result = await paymentService.verifyPaymentService(req.body);

    // Webhook must ALWAYS respond 200
    return res.status(200).json({
      received: true,
      alreadyProcessed: result?.alreadyProcessed || false,
    });
  } catch (error) {
    // ❗ Still return 200 to stop gateway retries
    return res.status(200).json({
      received: false,
    });
  }
};

/**
 * =========================
 * REFUND PAYMENT
 * =========================
 * ADMIN
 */
exports.refundPayment = asyncHandler(async (req, res) => {
  await paymentService.refundPaymentService(req.params.paymentId);

  res.status(200).json({
    success: true,
    message: "Refund processed successfully",
  });
});
