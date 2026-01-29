const { z } = require("zod");

const createCouponSchema = z.object({
  body: z
    .object({
      // COUPON CODE
      code: z
        .string()
        .min(3, "Coupon code must be at least 3 characters")
        .max(50, "Coupon code must not exceed 50 characters")
        .transform((val) => val.toUpperCase()),

      // OPTIONAL DESCRIPTION
      description: z.string().optional(),

      // DISCOUNT TYPE
      discountType: z.enum(["PERCENTAGE", "FIXED"]),

      // DISCOUNT VALUE
      discountValue: z
        .number()
        .positive("Discount value must be greater than 0"),

      // MAX DISCOUNT (FOR PERCENTAGE)
      maxDiscountAmount: z.number().positive().optional(),

      // ORDER LIMIT
      minOrderAmount: z.number().min(0).optional(),

      // USAGE LIMITS
      maxUses: z.number().int().positive().optional(),
      usagePerUser: z.number().int().positive().optional(),

      // DATE RANGE (FRONTEND FRIENDLY)
      validFrom: z.coerce.date(),
      validTo: z.coerce.date(),

      // APPLICABILITY
      applicableCategories: z.array(z.string()).optional(),
      applicableProducts: z.array(z.string()).optional(),
      excludedProducts: z.array(z.string()).optional(),
      applicableUsers: z.array(z.string()).optional(),
    })
    // DATE LOGIC VALIDATION
    .refine(
      (data) => data.validTo > data.validFrom,
      {
        message: "validTo must be greater than validFrom",
        path: ["validTo"],
      }
    ),
});

const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().transform((val) => val.toUpperCase()),
    orderAmount: z.number().positive("Order amount must be greater than 0"),
  }),
});
const applyCouponSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(3, "Coupon code must be at least 3 characters")
      .max(50, "Coupon code must not exceed 50 characters")
      .transform((val) => val.toUpperCase()),

    orderId: z
      .string()
      .length(24, "Invalid orderId"),
  }),
});



module.exports = {
  createCouponSchema,
  validateCouponSchema,
  applyCouponSchema,
};
