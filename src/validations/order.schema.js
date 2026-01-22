const { z } = require("zod");

const createOrderSchema = z.object({
  body: z.object({
    address: z.object({
      name: z.string().min(2),
      phone: z.string().min(10),
      street: z.string().min(5),
      city: z.string().min(2),
      state: z.string().min(2),
      pincode: z.string().min(4),
      country: z.string().optional(),
    }),

    paymentProvider: z.enum(["razorpay", "stripe"]),
  }),
});

module.exports = { createOrderSchema };
