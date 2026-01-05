const Product = require("../models/product.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiFeatures = require("../utils/ApiFeatures");
const AppError = require("../utils/AppError");

/**
 * CREATE PRODUCT
 */
exports.createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, stock, category } = req.body;

  if (!name || price == null || stock == null) {
    throw new AppError("Name, Price, Stock are required", 400);
  }

  const product = await Product.create({
    name,
    description,
    price,
    stock,
    category,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

/**
 * GET ALL PRODUCTS (FILTER + SORT + PAGINATION + CORRECT COUNT)
 */
exports.getAllProducts = asyncHandler(async (req, res) => {
  const resultsPerPage = 10;

  const features = new ApiFeatures(
    Product.find({ isActive: true }),
    req.query
  )
    .filter()
    .sort()
    .countTotal(Product) // ✅ CORRECT COUNT
    .paginate(resultsPerPage);

  const products = await features.query;

  res.status(200).json({
    success: true,
    total: features.paginationResult.total, // ✅ filtered total
    count: products.length,
    data: products,
    meta:features.paginationResults, // pagination metadata 
  });
});

/**
 * GET SINGLE PRODUCT
 */
exports.getSingleProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

/**
 * UPDATE PRODUCT
 */
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const {
    name,
    description,
    price,
    stock,
    category,
    isActive,
  } = req.body;

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (stock !== undefined) product.stock = stock;
  if (category !== undefined) product.category = category;
  if (isActive !== undefined) product.isActive = isActive;

  await product.save();

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

/**
 * DELETE PRODUCT (SOFT DELETE)
 */
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});
