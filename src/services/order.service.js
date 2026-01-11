const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const AppError = require("../utils/AppError");

/**
 * =========================
 * CREATE ORDER
 * =========================
 */
exports.createOrderService = async (userId, address) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Fetch cart
    const cart = await Cart.findOne({ user: userId })
      .populate("items.product", "name price stock isActive")
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    const orderItems = [];
    let totalAmount = 0;

    // 2️⃣ Validate products & reduce stock
    for (const item of cart.items) {
      const product = item.product;

      if (!product || !product.isActive) {
        throw new AppError(
          `Product unavailable: ${product?.name || "Unknown"}`,
          400
        );
      }

      if (product.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name}`,
          400
        );
      }

      product.stock -= item.quantity;
      await product.save({ session });

      orderItems.push({
        product: product._id,
        name: product.name,
        price: item.price,
        quantity: item.quantity,
      });

      totalAmount += item.price * item.quantity;
    }

    // 3️⃣ Create order
    const order = await Order.create(
      [
        {
          user: userId,
          items: orderItems,
          totalAmount,
          address,
          orderStatus: "CREATED",
          paymentStatus: "PENDING",
        },
      ],
      { session }
    );

    // 4️⃣ Clear cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return order[0];
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
  return Order.find({ user: userId }).sort({ createdAt: -1 });
};

/**
 * =========================
 * GET SINGLE ORDER
 * =========================
 */
exports.getSingleOrderService = async (orderId, user) => {
  const order = await Order.findById(orderId).populate(
    "user",
    "name email"
  );

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (
    order.user._id.toString() !== user._id.toString() &&
    user.role !== "admin"
  ) {
    throw new AppError("Not authorized", 403);
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

  if (
    order.user.toString() !== user._id.toString() &&
    user.role !== "admin"
  ) {
    throw new AppError("Not authorized", 403);
  }

  if (order.orderStatus !== "CREATED") {
    throw new AppError("Order cannot be cancelled", 400);
  }

  order.orderStatus = "CANCELLED";
  await order.save();
};
