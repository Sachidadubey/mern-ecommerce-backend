const { z } = require("zod");
const { objectId } = require("./common.schema");

const createPaymentSchema = z.object({
  body: z.object({
    orderId: objectId,
  }),
});

module.exports = { createPaymentSchema };
