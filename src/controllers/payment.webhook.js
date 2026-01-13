const paymentService = require("../services/payment.service");

exports.razorpayWebhook = async (req, res) => {
  try {
    await paymentService.verifyPaymentService(req.body);

    // ⚠️ Gateway expects 200 ALWAYS
    return res.status(200).json({ received: true });
  } catch (err) {
    // ❗ Still return 200 to stop retries
    return res.status(200).json({ received: false });
  }
};
