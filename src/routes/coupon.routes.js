const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");
const validate = require("../middlewares/validate.middleware");

const couponController = require("../controllers/coupon.controller");
const { createCouponSchema, validateCouponSchema, applyCouponSchema } = require("../validations/coupon.schema");

/**
 * =========================
 * USER ROUTES
 * =========================
 */
router.post("/apply", protect, validate(applyCouponSchema), couponController.applyCoupon);

// Validate coupon
router.post(
  "/validate",
  protect,
  validate(validateCouponSchema),
  couponController.validateCoupon
);

/**
 * =========================
 * ADMIN ROUTES
 * =========================
 */

router.use(protect);
router.use(authorizeRoles("admin"));

// Create coupon
router.post(
  "/",
  validate(createCouponSchema),
  couponController.createCoupon
);

// Get all coupons
router.get("/", couponController.getAllCoupons);

// Get single coupon
router.get("/:id", validateObjectId(), couponController.getSingleCoupon);

// Update coupon
router.put(
  "/:id",
  validateObjectId,
  validate(createCouponSchema),
  couponController.updateCoupon
);

// Delete coupon
router.delete("/:id", validateObjectId(), couponController.deleteCoupon);

module.exports = router;
