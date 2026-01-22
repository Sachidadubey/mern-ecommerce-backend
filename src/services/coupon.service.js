const Coupon = require("../models/coupon.model");
const AuditLog = require("../models/auditLog.model");
const AppError = require("../utils/AppError");

/**
 * CREATE COUPON (Admin)
 */
exports.createCouponService = async (couponData, userId) => {
  const coupon = await Coupon.create({
    ...couponData,
    createdBy: userId,
  });

  // Log audit
  await AuditLog.create({
    action: "COUPON_CREATED",
    resource: "COUPON",
    resourceId: coupon._id,
    userId,
    userRole: "admin",
    changes: { after: coupon.toObject() },
  });

  return coupon;
};

/**
 * GET ALL COUPONS (Admin)
 */
exports.getAllCouponsService = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const coupons = await Coupon.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Coupon.countDocuments();

  return {
    coupons,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * GET SINGLE COUPON
 */
exports.getSingleCouponService = async (couponId) => {
  const coupon = await Coupon.findById(couponId)
    .populate("createdBy", "name email")
    .lean();

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  return coupon;
};

/**
 * UPDATE COUPON (Admin)
 */
exports.updateCouponService = async (couponId, updateData, userId) => {
  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  const oldData = coupon.toObject();

  Object.assign(coupon, updateData);
  coupon.updatedBy = userId;

  await coupon.save();

  // Log audit
  await AuditLog.create({
    action: "COUPON_UPDATED",
    resource: "COUPON",
    resourceId: couponId,
    userId,
    userRole: "admin",
    changes: { before: oldData, after: coupon.toObject() },
  });

  return coupon;
};

/**
 * DELETE COUPON (Admin)
 */
exports.deleteCouponService = async (couponId, userId) => {
  const coupon = await Coupon.findByIdAndDelete(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  // Log audit
  await AuditLog.create({
    action: "COUPON_DELETED",
    resource: "COUPON",
    resourceId: couponId,
    userId,
    userRole: "admin",
    changes: { before: coupon.toObject() },
  });

  return coupon;
};

/**
 * VALIDATE COUPON (User)
 */
exports.validateCouponService = async (code, orderAmount, userId) => {
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    throw new AppError("Coupon code not found or inactive", 404);
  }

  // Check validity
  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validTo) {
    throw new AppError("Coupon is not valid at this time", 400);
  }

  // Check max uses
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new AppError("Coupon usage limit reached", 400);
  }

  // Check min order amount
  if (orderAmount < coupon.minOrderAmount) {
    throw new AppError(
      `Minimum order amount ${coupon.minOrderAmount} required`,
      400
    );
  }

  // Check usage per user
  if (coupon.applicableUsers && coupon.applicableUsers.length > 0) {
    if (!coupon.applicableUsers.includes(userId)) {
      throw new AppError("This coupon is not applicable to you", 400);
    }
  }

  // Calculate discount
  let discountAmount = 0;

  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = Math.floor((orderAmount * coupon.discountValue) / 100);

    if (coupon.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  } else {
    // FIXED
    discountAmount = coupon.discountValue;
  }

  return {
    valid: true,
    coupon,
    discountAmount,
    finalAmount: orderAmount - discountAmount,
  };
};

/**
 * APPLY COUPON (after order)
 */
exports.applyCouponService = async (code, orderId, userId) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  // Increment usage
  coupon.usedCount += 1;
  await coupon.save();

  // Log audit
  const AuditLog = require("../models/auditLog.model");
  await AuditLog.create({
    action: "COUPON_USED",
    resource: "COUPON",
    resourceId: coupon._id,
    userId,
    userRole: "user",
    metadata: { orderId },
  });

  return coupon;
};
