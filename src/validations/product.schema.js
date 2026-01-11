const { z } = require("zod");

exports.createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    price: z.number().positive(),
    stock: z.number().int().nonnegative(),
    description: z.string().optional(),
  }),
});
