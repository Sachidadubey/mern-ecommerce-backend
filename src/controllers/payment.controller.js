const mongoose = require("mongoose");
const Payment = require("../models/payment.model");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const Order = require("../models/order.model");

exports.createPayement = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod } = req.body;

  //  automatically lock order for payment --

  const order = await Order.findOneAndUpdate({ _id: orderId, orderStatus: "CREATED" }, { orderStatus: "PAYMENT_INITIATED" }, { new: true }

  );
  if (!order) {
    throw new AppError("Payment already in progress or invalid order", 400);
  }
  if (order.user.toString() !== req.user.id.toString()) {
    throw new AppError("Not authorized", 403);
  }
  const payment = await Payment.create({
    user: req.user._id,
    order: order._id,
    amount: order.totalAmount,
    paymentMethod,
  });

  res.status(201).json({
    success: true,
    message: "Payment initiated",
    data: payment,
  });

});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, gatewayPaymentId, success } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findById(paymentId).populate("order").session(session);
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }
    if (payment.status != "PENDING") {
      throw new AppError("payment already processed", 400);
    }

    // if failure
    if (!success) {
      payment.status = "FAILED",
        await payment.save({ session });
      
      payment.order.orderStatus = "CREATED"// unlock order---
      await payment.order.save({ session });
      await session.commitTransaction();
      session.endSession();


      return res.status(200).json({
        success: false,
        message: "Payment failed",
      });
    }

    // if success--
    payment.status = "SUCCESS";
    payment.gatewayPaymentId = gatewayPaymentId;
    await payment.save({ session });

    payment.order.orderStatus = "PAID";
    await payment.order.save({ session });

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });
    
    
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
    
  }
});

exports.refundPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const session = await mongoose.session();
  session.startTransaction();

  try {

    const payment = await findById(paymentId).populate("order").session(session);

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }
    if (payment.status !== "SUCCESS")// without success payment cant be refunded ---
    {
      throw new AppError("Refund is not allowed ", 400);
    }
    const refundableStatus = ["CANCELLED", "RETURN_APPROVED"];
    if (!refundableStatus.includes(payment.order.orderStatus))
    {
      throw new AppError(`refund not allowed for order status${payment.order.orderStatus}`);
    }

    // gateway refund api call would happen here -----
    payment.status = "REFUNDED",
      await payment.save({ session });
    
    payment.order.orderStatus = "REFUNDED";
    await payment.order.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
    });
    
  }
  catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
})
