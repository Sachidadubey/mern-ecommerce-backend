const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Product = require("../models/product.model");

exports.cancelOrderAndRestoreStock = async (orderId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) return;

    // idempotency
    if (order.orderStatus === "CANCELLED") {
      await session.commitTransaction();
      session.endSession();
      return;
    }

    // 🔄 Restore stock
       for (const item of order.items) {
         const product = await Product.findById(item.product)
         if (product) {
           product.stock += item.quantity;
           await product.save({ session });
         }
       }

    order.orderStatus = "CANCELLED";
    order.paymentStatus = "FAILED";
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};
