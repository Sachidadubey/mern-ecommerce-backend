const { z } = require("zod");
const { objectId } = require("./common.schema");

const createOrUpdateReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(1).optional(),
  }),
});

const getProductReviewsSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

const getMyReviewForProductSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
});

const deleteReviewSchema = z.object({
  params: z.object({
    reviewId: objectId,
  }),
});

const getAllReviewsAdminSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    productId: objectId.optional(),
    userId: objectId.optional(),
    rating: z.string().regex(/^[1-5]$/).optional(),
  }),
});

module.exports = {
  createOrUpdateReviewSchema,
  getProductReviewsSchema,
  getMyReviewForProductSchema,
  deleteReviewSchema,
  getAllReviewsAdminSchema,
};
