const { z } = require("zod");
const { objectId } = require("./common.schema");

const createPaymentSchema = z.object({
  orderId: objectId,
});

module.exports = { createPaymentSchema };
