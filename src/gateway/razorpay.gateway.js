const razorpay = require("../config/razorPay");

// create razorpay order

exports.createRazorpayOrder = async ({
  amount,
  receipt,
}) => {
  return razorpay.orders.create({
    amount: amount * 100, // convert into paise
     currency : "INR",
    receipt,
  });
};



// create  razorpayorder -> and convert into paise ------