const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");
const validate = require("../middlewares/validate.middleware");

const productController = require("../controllers/product.controller");
const { createProductSchema, updateProductSchema } = require("../validations/product.schema");
const upload = require("../middlewares/upload.middleware");




router.get("/", productController.getAllProducts);

// Get single product
router.get("/:id", validateObjectId, productController.getSingleProduct);

/* ================= ADMIN ROUTES ================= */
router.use(protect);
router.use(authorizeRoles("admin"));

// Create product       --------
 router.post("/", upload.array("images", 5),   validate(createProductSchema),productController.createProduct);

// Update product
router.put(
  "/:id",
  validateObjectId, upload.array("images", 5),  
  validate(updateProductSchema),
  productController.updateProduct
);

// Delete product (soft delete)
router.delete("/:id", validateObjectId, productController.deleteProduct);

/* ================= PUBLIC ROUTES ================= */
// Get all products


module.exports = router;