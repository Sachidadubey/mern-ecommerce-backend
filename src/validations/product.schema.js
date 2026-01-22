const { z } = require("zod");

/* ================= CREATE PRODUCT ================= */
exports.createProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Product name must be at least 3 characters"),

    price: z.coerce
      .number()
      .positive("Price must be greater than 0"),

    stock: z.coerce
      .number()
      .int("Stock must be an integer")
      .nonnegative("Stock cannot be negative"),

    description: z.string().optional(),

    category: z
      .string()
      .length(24, "Invalid category id"),
  }),
});

/* ================= UPDATE PRODUCT ================= */
exports.updateProductSchema = z.object({
  params: z.object({
    productId: z.string().length(24, "Invalid product id"),
  }),

  body: z
    .object({
      name: z.string().min(3).optional(),

      price: z.coerce
        .number()
        .positive()
        .optional(),

      stock: z.coerce
        .number()
        .int()
        .nonnegative()
        .optional(),

      description: z.string().optional(),

      category: z.string().length(24).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required to update",
    }),
});
