const Order = require("../models/order.model");
const Payment = require("../models/payment.model");
const Product = require("../models/product.model");
const Coupon = require("../models/coupon.model");
const AppError = require("../utils/AppError");
const AuditLog = require("../models/auditLog.model");
const User = require("../models/User.model");
const { createShipment } = require("../gateway/shiprocket.gateway");


/**
 * GET ADMIN DASHBOARD STATS
 */
exports.getDashboardStatsService = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  // Total stats
  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);

  const totalUsers = await User.countDocuments({
    role: "user",
  });

  // Today's stats
  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: today },
  });

  const todayRevenue = await Order.aggregate([
    { $match: { createdAt: { $gte: today }, paymentStatus: "PAID" } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);

  // This month stats
  const monthOrders = await Order.countDocuments({
    createdAt: { $gte: thisMonth },
  });

  const monthRevenue = await Order.aggregate([
    { $match: { createdAt: { $gte: thisMonth }, paymentStatus: "PAID" } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);

  // Order status breakdown
  const orderStatus = await Order.aggregate([
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
  ]);

  // Payment status breakdown
  const paymentStatus = await Order.aggregate([
    { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
  ]);

  // Low stock products
  const lowStockProducts = await Product.find({
    $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    isActive: true,
  })
    .select("name stock lowStockThreshold")
    .limit(5)
    .lean();

  return {
    totalStats: {
      orders: totalOrders,
      revenue: totalRevenue[0]?.total || 0,
      users: totalUsers,
      products: await Product.countDocuments({ isActive: true }),
    },
    todayStats: {
      orders: todayOrders,
      revenue: todayRevenue[0]?.total || 0,
    },
    monthStats: {
      orders: monthOrders,
      revenue: monthRevenue[0]?.total || 0,
    },
    orderStatusBreakdown: orderStatus,
    paymentStatusBreakdown: paymentStatus,
    lowStockAlerts: lowStockProducts,
  };
};

/**
 * GET ADMIN ORDERS
 */
exports.getAdminOrdersService = async (filters = {}, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.orderStatus) query.orderStatus = filters.orderStatus;
  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters.searchTerm) {
    query.$or = [
      { "address.email": new RegExp(filters.searchTerm, "i") },
      { _id: filters.searchTerm },
    ];
  }

  const orders = await Order.find(query)
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Order.countDocuments(query);

  return {
    orders,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * GET SINGLE ORDER (ADMIN VIEW)
 */
exports.getAdminSingleOrderService = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("user", "name email phone")
    .populate("items.product", "name price images stock")
    .populate("shippedBy", "name email")
    .populate("cancelledBy", "name email")
    .lean();

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Get payment details
  const payment = await Payment.findOne({ order: orderId }).lean();

  return { ...order, payment };
};

/**
 * UPDATE ORDER STATUS (Admin)
 */
exports.updateOrderStatusService = async (orderId, status, userId, notes) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const validStatuses = [
    "PLACED",
    "PROCESSING",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ];

  if (!validStatuses.includes(status)) {
    throw new AppError("Invalid order status", 400);
  }

  const oldStatus = order.orderStatus;
  order.orderStatus = status;

  if (notes) {
    order.adminNotes = notes;
  }

  await order.save();

  // Log audit
  await AuditLog.create({
    action: "ORDER_STATUS_UPDATED",
    resource: "ORDER",
    resourceId: orderId,
    userId,
    userRole: "admin",
    changes: { before: { status: oldStatus }, after: { status } },
  });

  return order;
};

/**
 * SHIP ORDER (Admin)
 */
exports.shipOrderService = async (orderId,  adminId) => {
  const order = await Order.findById(orderId).populate("user");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.paymentStatus !== "PAID") {
    throw new AppError("Cannot ship unpaid order", 400);
  }
  if (order.shippingStatus === "SHIPPED") {
    throw new AppError("Order is already shipped", 400);
  }
  if (order.shippingStatus === "DELIVERED") {
    throw new AppError("Order is already delivered", 400);
  }
  // // 🔹 Call courier
  // let shipment;
  // try {
  //   shipment = await createShipment(order);
  //   }catch (error) {
  //   throw new AppError(
  //     `Failed to create shipment: ${error.response?.data?.message || error.message}`,
  //     500
  //   );
  // }
  const shipment = {
  tracking_id: "TEMP-TRACK-123",
};
  


  const trackingNumber = shipment.tracking_id;

  order.shippingStatus = "SHIPPED";
  order.trackingNumber = trackingNumber;
  order.shippedAt = new Date();
  order.shippedBy = adminId;
  order.orderStatus = "SHIPPED";

  await order.save();

  // Create notification
  const Notification = require("../models/notification.model");
  await Notification.create({
    user: order.user,
    type: "ORDER_SHIPPED",
    title: "Your order has been shipped",
    message: `Order #${orderId} has been shipped. Tracking: ${trackingNumber}`,
    resourceType: "ORDER",
    resourceId: orderId,
    link: `/orders/${orderId}`,
    metadata: { trackingNumber },
  });

  // Log audit
  await AuditLog.create({
    action: "ORDER_SHIPPED",
    resource: "ORDER",
    resourceId: orderId,
    userId: adminId,
    userRole: "admin",
    changes: { after: { trackingNumber, shippedAt: order.shippedAt } },
  });

  return order;
};

/**
 * DELIVER ORDER (Admin)
 */
exports.deliverOrderService = async (orderId, userId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.shippingStatus !== "SHIPPED") {
    throw new AppError("Order is not shipped yet", 400);
  }
  if( order.shippingStatus === "DELIVERED") {
    throw new AppError("Order is already delivered", 400);
  }

  order.shippingStatus = "DELIVERED";
  order.deliveredAt = new Date();
  order.orderStatus = "DELIVERED";

  await order.save();

  // Create notification
  const Notification = require("../models/notification.model");
  await Notification.create({
    user: order.user,
    type: "ORDER_DELIVERED",
    title: "Your order has been delivered",
    message: `Order #${orderId} has been delivered`,
    resourceType: "ORDER",
    resourceId: orderId,
    link: `/orders/${orderId}`,
  });

  // Log audit
  await AuditLog.create({
    action: "ORDER_DELIVERED",
    resource: "ORDER",
    resourceId: orderId,
    userId,
    userRole: "admin",
    changes: { after: { deliveredAt: order.deliveredAt } },
  });

  return order;
};

/**
 * GET REVENUE STATS
 */
exports.getRevenueStatsService = async (days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Daily revenue
  const dailyRevenue = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, paymentStatus: "PAID" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Top products by revenue
  const topProducts = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, paymentStatus: "PAID" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        units: { $sum: "$items.quantity" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
  ]);

  return { dailyRevenue, topProducts };
};


