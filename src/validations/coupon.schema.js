const { z } = require("zod");

const createCouponSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(3, "Coupon code must be at least 3 characters")
      .max(50, "Coupon code must not exceed 50 characters")
      .toUpperCase(),

    description: z.string().optional(),

    discountType: z.enum(["PERCENTAGE", "FIXED"]),

    discountValue: z
      .number()
      .min(0, "Discount value must be positive"),

    maxDiscountAmount: z.number().optional(),

    minOrderAmount: z.number().min(0).optional(),

    maxUses: z.number().optional(),

    usagePerUser: z.number().min(1).optional(),

    validFrom: z.string().datetime(),

    validTo: z.string().datetime(),

    applicableCategories: z.array(z.string()).optional(),

    applicableProducts: z.array(z.string()).optional(),

    excludedProducts: z.array(z.string()).optional(),

    applicableUsers: z.array(z.string()).optional(),
  }),
});

const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().toUpperCase(),
    orderAmount: z.number().min(0),
  }),
});

module.exports = {
  createCouponSchema,
  validateCouponSchema,
};
