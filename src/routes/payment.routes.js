const express = require("express");
const router = express.Router();

const {
  createPayment,
  refundPayment,
} = require("../controllers/payment.controller");

const {
  paymentWebhook,
} = require("../controllers/payment.webhook");

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
 * PAYMENT GATEWAY WEBHOOK
 * =========================
 * ⚠️ NO AUTH
 * ⚠️ RAW BODY
 * ⚠️ ALWAYS 200 RESPONSE
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhook
);

/**
 * =========================
 * ADMIN
 * =========================
 */
router.post(
  "/:paymentId/refund",
  protect,
  authorizeRoles("admin"),
  validateObjectId,
  refundPayment
);

module.exports = router;
