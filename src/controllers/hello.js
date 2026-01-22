const crypto = require("crypto");

const razorpay_order_id = "order_S74DezpdgBJL5t";
const razorpay_payment_id = "pay_test_001";

const signature = crypto
  .createHmac("sha256", "1234567890abcdef")
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest("hex");

console.log(signature);
