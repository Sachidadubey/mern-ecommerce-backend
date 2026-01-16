
const paymentService = require("../services/payment.service");
  exports.razorpayWebhook = async (req, res) => {
  try {
    await paymentService.verifyPaymentService(req);
  } catch (err) {
    console.error("Webhook error:", err);
  }

  // 🔑 Gateway expects ACK only
  res.sendStatus(200);
};
