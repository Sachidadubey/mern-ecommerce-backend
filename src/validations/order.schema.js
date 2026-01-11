const { z } = require("zod");

const createOrderSchema = z.object({
  address: z.string().min(10),
  paymentProvider: z.enum(["razorpay", "stripe"]),
});

module.exports = { createOrderSchema };
