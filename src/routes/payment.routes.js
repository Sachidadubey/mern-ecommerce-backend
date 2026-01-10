const express = require("express");
const router = express.Router();



const {
  createPayment,
  verifyPayment,
  refundPayment,
} = require("../controllers/payment.controller");

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const  validateObjectId  = require("../middlewares/validateObjectId.middleware"); 





/**
 * USER
 */
router.post("/", protect, createPayment);

/**
 * BACKEND / GATEWAY / WEBHOOK
 * (Protect later with signature)
 */
router.post("/verify", verifyPayment);

/**
 * ADMIN
 */
router.post(
  "/:paymentId/refund",
  protect,validateObjectId,
  authorizeRoles("admin"),
  refundPayment
);

module.exports = router;
