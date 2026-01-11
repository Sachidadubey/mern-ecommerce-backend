const { z } = require("zod");
const { objectId } = require("./common.schema");

const createReviewSchema = z.object({
  productId: objectId,
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

module.exports = { createReviewSchema };
