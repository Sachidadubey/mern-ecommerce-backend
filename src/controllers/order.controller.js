const asyncHandler = require("../utils/asyncHandler");
const orderService = require("../services/order.service");

/**
 * CREATE ORDER
 */
exports.createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrderService(
    req.user._id,
    req.body.address
  );

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: order,
  });
});

/**
 * GET MY ORDERS
 */
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getMyOrdersService(
    req.user._id
  );

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

/**
 * GET SINGLE ORDER
 */
exports.getSingleOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getSingleOrderService(
    req.params.id,
    req.user
  );

  res.status(200).json({
    success: true,
    data: order,
  });
});

/**
 * CANCEL ORDER
 */
exports.cancelOrder = asyncHandler(async (req, res) => {
  await orderService.cancelOrderService(
    req.params.id,
    req.user
  );

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
  });
});
