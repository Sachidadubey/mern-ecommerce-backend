const asyncHandler = require("../utils/asyncHandler");
const categoryService = require("../services/category.service");
const AppError = require("../utils/AppError");

/**
 * CREATE CATEGORY (Admin)
 */
exports.createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategoryService(
    req.body,
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

/**
 * GET ALL CATEGORIES
 */
exports.getAllCategories = asyncHandler(async (req, res) => {
  const withSubcategories = req.query.subcategories === "true";

  const categories = await categoryService.getAllCategoriesService({
    withSubcategories,
    parentCategory: req.query.parentOnly === "true" ? null : undefined,
  });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

/**
 * GET SINGLE CATEGORY
 */
exports.getSingleCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.getSingleCategoryService(
    req.params.id
  );

  res.status(200).json({
    success: true,
    data: category,
  });
});

/**
 * UPDATE CATEGORY (Admin)
 */
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategoryService(
    req.params.id,
    req.body,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
});

/**
 * DELETE CATEGORY (Admin)
 */
exports.deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategoryService(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});
