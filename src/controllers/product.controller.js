const asyncHandler = require("../utils/asyncHandler");
const productService = require("../services/product.service");

/**
 * CREATE PRODUCT
 */
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProductService(
    req.user._id,
    req.body
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

/**
 * GET ALL PRODUCTS
 */
exports.getAllProducts = asyncHandler(async (req, res) => {
  const { products, meta } =
    await productService.getAllProductsService(req.query);

  res.status(200).json({
    success: true,
    total: meta.total,
    count: products.length,
    data: products,
    meta,
  });
});

/**
 * GET SINGLE PRODUCT
 */
exports.getSingleProduct = asyncHandler(async (req, res) => {
  const product = await productService.getSingleProductService(
    req.params.id
  );

  res.status(200).json({
    success: true,
    data: product,
  });
});

/**
 * UPDATE PRODUCT
 */
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProductService(
    req.params.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

/**
 * DELETE PRODUCT (SOFT)
 */
exports.deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProductService(req.params.id);

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});
