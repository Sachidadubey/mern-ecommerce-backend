const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");

const adminController = require("../controllers/admin.controller");

router.use(protect);
router.use(authorizeRoles("admin"));

/**
 * =========================
 * DASHBOARD
 * =========================
 */

// Get dashboard stats
router.get("/dashboard/stats", adminController.getDashboardStats);

// Get revenue stats
router.get("/analytics/revenue", adminController.getRevenueStats);

/**
 * =========================
 * ORDERS
 * =========================
 */

// Get all orders
router.get("/orders", adminController.getOrders);

// Get single order
router.get(
  "/orders/:id",
  validateObjectId,
  adminController.getSingleOrder
);

// Update order status
router.patch(
  "/orders/:id/status",
  validateObjectId,
  adminController.updateOrderStatus
);

// Ship order
router.patch(
  "/orders/:id/ship",
  validateObjectId,
  adminController.shipOrder
);

// Deliver order
router.patch(
  "/orders/:id/deliver",
  validateObjectId,
  adminController.deliverOrder
);

module.exports = router;
