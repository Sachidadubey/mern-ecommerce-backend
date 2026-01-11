const express = require("express");
const router = express.Router();

const {
  createPayment,
  verifyPayment,
  refundPayment,
} = require("../controllers/payment.controller");

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");

const validate = require("../middlewares/validate.middleware");
const { createPaymentSchema } = require("../validations/payment.schema");

/**
 * =========================
 * USER
 * =========================
 */
router.post(
  "/",
  protect,
  validate(createPaymentSchema),
  createPayment
);

/**
 * =========================
 * PAYMENT GATEWAY / WEBHOOK
 * =========================
 */
router.post("/verify", verifyPayment);

/**
 * =========================
 * ADMIN
 * =========================
 */
router.post(
  "/:paymentId/refund",
  protect,
  validateObjectId,
  authorizeRoles("admin"),
  refundPayment
);

module.exports = router;
