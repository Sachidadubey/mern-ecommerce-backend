const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");
const validate = require("../middlewares/validate.middleware");
const { createOrderSchema } = require("../validations/order.schema");

const {
  createOrder,
  getMyOrders,
  getSingleOrder,
  cancelOrder,
} = require("../controllers/order.controller");

/**
 * =========================
 * USER ROUTES
 * =========================
 */

router.use(protect);

// Create order from cart
router.post("/", validate(createOrderSchema), createOrder);

// Get my orders
router.get("/my", getMyOrders);

// Get single order
router.get("/:id", validateObjectId(), getSingleOrder);

// Cancel order
router.patch("/:id/cancel", validateObjectId(), cancelOrder);

module.exports = router;
