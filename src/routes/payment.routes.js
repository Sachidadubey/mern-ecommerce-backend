const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");
const validate = require("../middlewares/validate.middleware");
const { createPaymentSchema,verifyPaymentSchema } = require("../validations/payment.schema");

/**
 * =========================
 * USER
 * =========================
 */
router.post(
  "/",
  protect,
  validate(createPaymentSchema),
  paymentController.createPayment
);



router.post(
  "/verify",
  protect,
  validate(verifyPaymentSchema),
  paymentController.verifyPayment
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
  validateObjectId(),
  paymentController.refundPayment
);

module.exports = router;
