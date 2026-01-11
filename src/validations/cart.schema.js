const { z } = require("zod");
const { objectId } = require("./common.schema");

const addToCartSchema = z.object({
  body: z.object({
    productId: objectId,// comming from common schema validator --
    quantity: z.number().int().positive(),
  }),
});
module.exports = { addToCartSchema };
