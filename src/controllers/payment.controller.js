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
  const { orderId } = req.body;
  const payment = await paymentService.createPaymentService(
    req.user._id,
    orderId,
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
// exports.verifyPayment = async (req, res) => {
//   try {
//     const result = await paymentService.verifyPaymentService(req);

//     // Webhook must ALWAYS respond 200
//     return res.status(200).json({
//       received: true,
//       alreadyProcessed: result?.alreadyProcessed || false,
//     });
//   } catch (error) {
//     // ❗ Still return 200 to stop gateway retries
//     return res.status(200).json({
//       received: false,
//     });
//   }
// };

exports.razorpayWebhook = async (req, res) => {
  try {
    await paymentService.verifyPaymentService(req);
  } catch (err) {
    console.error("Webhook error:", err.message);
  }

  res.sendStatus(200); // MUST
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
