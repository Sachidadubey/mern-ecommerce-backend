const asyncHandler = require("../utils/asyncHandler");
const adminService = require("../services/admin.service");

/**
 * GET DASHBOARD STATS
 */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStatsService();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

/**
 * GET ORDERS (Admin View)
 */
exports.getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await adminService.getAdminOrdersService(
    req.query,
    page,
    limit
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * GET SINGLE ORDER (Admin View)
 */
exports.getSingleOrder = asyncHandler(async (req, res) => {
  const order = await adminService.getAdminSingleOrderService(req.params.id);

  res.status(200).json({
    success: true,
    data: order,
  });
});

/**
 * UPDATE ORDER STATUS
 */
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const order = await adminService.updateOrderStatusService(
    req.params.id,
    status,
    req.user._id,
    notes
  );

  res.status(200).json({
    success: true,
    message: "Order status updated",
    data: order,
  });
});

/**
 * SHIP ORDER
 */
exports.shipOrder = asyncHandler(async (req, res) => {
  const { trackingNumber } = req.body;

  const order = await adminService.shipOrderService(
    req.params.id,
    trackingNumber,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: "Order shipped successfully",
    data: order,
  });
});

/**
 * DELIVER ORDER
 */
exports.deliverOrder = asyncHandler(async (req, res) => {
  const order = await adminService.deliverOrderService(
    req.params.id,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: "Order marked as delivered",
    data: order,
  });
});

/**
 * GET REVENUE STATS
 */
exports.getRevenueStats = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;

  const stats = await adminService.getRevenueStatsService(days);

  res.status(200).json({
    success: true,
    data: stats,
  });
});
