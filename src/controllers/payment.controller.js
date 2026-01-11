const asyncHandler = require("../utils/asyncHandler");
const paymentService = require("../services/payment.service");

/**
 * CREATE PAYMENT
 */
exports.createPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.createPaymentService(
    req.user._id,
    req.body.orderId,
    req.body.paymentMethod
  );

  res.status(201).json({
    success: true,
    message: "Payment initiated",
    data: payment,
  });
});

/**
 * VERIFY PAYMENT (WEBHOOK / CALLBACK)
 */
exports.verifyPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyPaymentService(req.body);

  if (result?.alreadyVerified) {
    return res.status(200).json({
      success: true,
      message: "Payment already verified",
    });
  }

  if (result?.success === false) {
    return res.status(200).json({
      success: false,
      message: "Payment failed",
    });
  }

  res.status(200).json({
    success: true,
    message: "Payment verified successfully",
  });
});

/**
 * REFUND PAYMENT (ADMIN)
 */
exports.refundPayment = asyncHandler(async (req, res) => {
  await paymentService.refundPaymentService(req.params.paymentId);

  res.status(200).json({
    success: true,
    message: "Refund processed successfully",
  });
});
