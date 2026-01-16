const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError");
const cancelOrderAndRestoreStock = require("./orderRecovery.service");

/*
 * =========================
 * CREATE ORDER 
 * =========================
 */
exports.createOrderService = async (userId, address) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = await Product.findOne({
        _id: item.product._id,
        isActive: true,
      }).session(session);

      if (!product) {
        throw new AppError(
          `Product unavailable: ${item.product.name}`,
          400
        );
      }

      if (product.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name}`,
          400
        );
      }

      // 🔒 Lock inventory
      product.stock -= item.quantity;
      await product.save({ session });

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price, // ✅ DB price only
        quantity: item.quantity,
      });

      totalAmount += product.price * item.quantity;
    }

    const [order] = await Order.create(
      [
        {
          user: userId,
          items: orderItems,
          totalAmount,
          address,
          orderStatus: "PLACED",
          paymentStatus: "PENDING",
        },
      ],
      { session }
    );

    // 🧹 Remove cart completely
    // await Cart.deleteOne({ user: userId }).session(session);

    await session.commitTransaction();
    session.endSession();

    return order;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * =========================
 * GET MY ORDERS
 * =========================
 */
exports.getMyOrdersService = async (userId) => {
  return Order.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * =========================
 * GET SINGLE ORDER
 * =========================
 */
exports.getSingleOrderService = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("user", "name email")
    .populate("items.product", "name price");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return order;
};

/**
 * =========================
 * CANCEL ORDER
 * =========================
 */
exports.cancelOrderService = async (orderId, user) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  if (order.user.toString() !== user._id.toString()) {
    throw new AppError("Not authorized", 403);
  }

  if (order.paymentStatus === "PAID") {
    throw new AppError("Paid orders cannot be cancelled", 400);
  }

  await cancelOrderAndRestoreStock(order._id);
};

