const { z } = require("zod");

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Category name must be at least 2 characters"),
    description: z.string().optional(),
    parentCategory: z.string().optional(), // ObjectId as string
    displayOrder: z.number().optional(),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    parentCategory: z.string().optional(),
    displayOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});
const getCategoriesQuerySchema = z.object({
  query: z.object({
    parentCategory: z.string().optional(),
    withSubcategories: z.enum(["true", "false"]).optional(),
  }),
});


module.exports = {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesQuerySchema,
};
