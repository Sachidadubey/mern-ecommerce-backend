const asyncHandler = require("../utils/asyncHandler");
const couponService = require("../services/coupon.service");

/**
 * CREATE COUPON (Admin)
 */
exports.createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCouponService(req.body, req.user._id);

  res.status(201).json({
    success: true,
    message: "Coupon created successfully",
    data: coupon,
  });
});

/**
 * GET ALL COUPONS (Admin)
 */
exports.getAllCoupons = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await couponService.getAllCouponsService(page, limit);

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * GET SINGLE COUPON
 */
exports.getSingleCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.getSingleCouponService(req.params.id);

  res.status(200).json({
    success: true,
    data: coupon,
  });
});

/**
 * UPDATE COUPON (Admin)
 */
exports.updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCouponService(
    req.params.id,
    req.body,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: "Coupon updated successfully",
    data: coupon,
  });
});

/**
 * DELETE COUPON (Admin)
 */
exports.deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.deleteCouponService(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: "Coupon deleted successfully",
  });
});

/**
 * VALIDATE COUPON (User)
 */
exports.validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;

  const result = await couponService.validateCouponService(
    code,
    orderAmount,
    req.user._id
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});
