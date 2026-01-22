const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");
const validate = require("../middlewares/validate.middleware");

const categoryController = require("../controllers/category.controller");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../validations/category.schema");

/**
 * =========================
 * PUBLIC ROUTES
 * =========================
 */

// Get all categories
router.get("/", categoryController.getAllCategories);

// Get single category
router.get("/:id", validateObjectId, categoryController.getSingleCategory);

/**
 * =========================
 * ADMIN ROUTES
 * =========================
 */

router.use(protect);
router.use(authorizeRoles("admin"));

// Create category
router.post(
  "/",
  validate(createCategorySchema),
  categoryController.createCategory
);

// Update category
router.put(
  "/:id",
  validateObjectId,
  validate(updateCategorySchema),
  categoryController.updateCategory
);

// Delete category
router.delete("/:id", validateObjectId, categoryController.deleteCategory);

module.exports = router;
