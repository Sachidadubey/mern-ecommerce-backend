const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const ApiFeatures = require("../utils/ApiFeatures");

/**
 * =========================
 * CREATE ORDER (USER)
 * =========================
 */
exports.createOrder = asyncHandler(async (req, res) => {
  const { address } = req.body;

  if (!address) {
    throw new AppError("Delivery address is required", 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /**
     * 1️⃣ Fetch cart
     */
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product", "name price stock isActive")
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    const orderItems = [];
    let totalAmount = 0;

    /**
     * 2️⃣ Validate products & stock
     */
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

      /**
       * 3️⃣ Reduce stock (atomic)
       */
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

    /**
     * 4️⃣ Create order
     */
    const order = await Order.create(
      [
        {
          user: req.user._id,
          items: orderItems,
          totalAmount,
          address,
          orderStatus: "CREATED",
          paymentStatus: "PENDING",
        },
      ],
      { session }
    );

    /**
     * 5️⃣ Clear cart
     */
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save({ session });

    /**
     * 6️⃣ Commit transaction
     */
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order[0],
    });

  } catch (error) {
    /**
     * 🔥 Rollback everything
     */
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

/**
 * =========================
 * GET MY ORDERS (USER)
 * =========================
 */
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

/**
 * =========================
 * GET SINGLE ORDER (USER / ADMIN)
 * =========================
 */
exports.getSingleOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate("user", "name email");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new AppError("Not authorized", 403);
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

/**
 * =========================
 * CANCEL ORDER (USER / ADMIN)
 * =========================
 */
exports.cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (
    order.user.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new AppError("Not authorized", 403);
  }

  if (order.orderStatus !== "CREATED") {
    throw new AppError("Order cannot be cancelled", 400);
  }

  order.orderStatus = "CANCELLED";
  await order.save();

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
  });
});

/**
 * =========================
 * GET ALL ORDERS (ADMIN)
 * =========================
 */
exports.getAllOrders = asyncHandler(async (req, res) => {
  const resultsPerPage = 10;

  const features = new ApiFeatures(
    Order.find().populate("user", "name email"),
    req.query
  )
    .filter()
    .sort();

  await features.countTotal(Order);
  features.paginate(resultsPerPage);

  const orders = await features.query;

  res.status(200).json({
    success: true,
    total: features.paginationResult.total,
    count: orders.length,
    data: orders,
    meta: features.paginationResult,
  });
});

/**
 * =========================
 * GET SINGLE ORDER (ADMIN)
 * =========================
 */
exports.getSingleOrderAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate("user", "name email");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

/**
 * =========================
 * UPDATE ORDER STATUS (ADMIN)
 * =========================
 */
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new AppError("Invalid order status", 400);
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.orderStatus === "DELIVERED") {
    throw new AppError("Delivered orders cannot be modified", 400);
  }

  if (
    order.orderStatus === "CANCELLED" &&
    status !== "REFUNDED"
  ) {
    throw new AppError("Cancelled order can only be refunded", 400);
  }

  order.orderStatus = status;
  await order.save();

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    data: order,
  });
});
