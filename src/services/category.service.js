const Category = require("../models/category.model");
const AuditLog = require("../models/auditLog.model");
const AppError = require("../utils/AppError");

/**
 * CREATE CATEGORY
 */
exports.createCategoryService = async (categoryData, userId) => {
  const { name, description, parentCategory, displayOrder } = categoryData;

  // Check if parent category exists (if provided)
  if (parentCategory) {
    const parent = await Category.findById(parentCategory);
    if (!parent) {
      throw new AppError("Parent category not found", 404);
    }
  }

  // Create category
  const category = await Category.create({
    name,
    description,
    parentCategory: parentCategory || null,
    displayOrder,
    createdBy: userId,
  });

  // Log audit
  await AuditLog.create({
    action: "CATEGORY_CREATED",
    resource: "CATEGORY",
    resourceId: category._id,
    userId,
    userRole: "admin",
    changes: { after: category.toObject() },
  });

  return category;
};

/**
 * GET ALL CATEGORIES
 */
exports.getAllCategoriesService = async (filters = {}) => {
  const query = { isActive: true };

  if (filters.parentCategory === null) {
    query.parentCategory = null; // Only main categories
  }

  const categories = await Category.find(query)
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  // If main categories requested, fetch subcategories for each
  if (filters.withSubcategories) {
    const populatedCategories = await Promise.all(
      categories.map(async (cat) => {
        const subcategories = await Category.find({
          parentCategory: cat._id,
          isActive: true,
        }).lean();
        return { ...cat, subcategories };
      })
    );
    return populatedCategories;
  }

  return categories;
};

/**
 * GET SINGLE CATEGORY
 */
exports.getSingleCategoryService = async (categoryId) => {
  const category = await Category.findById(categoryId)
    .populate("parentCategory", "name slug")
    .lean();

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  // Get subcategories if this is a main category
  const subcategories = await Category.find({
    parentCategory: categoryId,
    isActive: true,
  }).lean();

  return { ...category, subcategories };
};

/**
 * UPDATE CATEGORY
 */
exports.updateCategoryService = async (categoryId, updateData, userId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  let isModified = false;

  // Check field-by-field changes
  Object.keys(updateData).forEach((key) => {
    if (
      updateData[key] !== undefined &&
      category[key] !== updateData[key]
    ) {
      category[key] = updateData[key];
      isModified = true;
    }
  });

  if (!isModified) {
    throw new AppError("No changes detected", 400);
  }

  category.updatedBy = userId;
  await category.save();

  // Audit log only if changed
  await AuditLog.create({
    action: "CATEGORY_UPDATED",
    resource: "CATEGORY",
    resourceId: categoryId,
    userId,
    userRole: "admin",
    changes: {
      after: updateData,
    },
  });

  return category;
};


/**
 * DELETE CATEGORY (Soft Delete)
 */
exports.deleteCategoryService = async (categoryId, userId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  // Check if has subcategories
  const subcategoriesCount = await Category.countDocuments({
    parentCategory: categoryId,
  });

  if (subcategoriesCount > 0) {
    throw new AppError(
      `Cannot delete category with ${subcategoriesCount} subcategories`,
      400
    );
  }

  category.isActive = false;
  category.updatedBy = userId;
  await category.save();

  // Log audit
  await AuditLog.create({
    action: "CATEGORY_DELETED",
    resource: "CATEGORY",
    resourceId: categoryId,
    userId,
    userRole: "admin",
    changes: { before: { isActive: true }, after: { isActive: false } },
  });

  return category;
};
