const crypto = require("crypto");

const razorpay_order_id = "order_S7EDwdSYCKQIrb";
const razorpay_payment_id = "pay_test_001";

const signature = crypto
  .createHmac("sha256", "qjn5PMGRtO1RuZFmzVO6kzbp")
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest("hex");

console.log(signature);
