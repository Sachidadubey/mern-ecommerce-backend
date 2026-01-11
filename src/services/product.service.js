const Product = require("../models/product.model");
const ApiFeatures = require("../utils/ApiFeatures");
const AppError = require("../utils/AppError");

/**
 * =========================
 * CREATE PRODUCT (ADMIN)
 * =========================
 */
exports.createProductService = async (userId, data) => {
  const product = await Product.create({
    ...data,
    createdBy: userId,
  });

  return product;
};

/**
 * =========================
 * GET ALL PRODUCTS (PUBLIC)
 * =========================
 */
exports.getAllProductsService = async (query) => {
  const resultsPerPage = 10;

  const features = new ApiFeatures(
    Product.find({ isActive: true }),
    query
  )
    .filter()
    .sort();

  await features.countTotal(Product);
  features.paginate(resultsPerPage);

  const products = await features.query;

  return {
    products,
    meta: features.paginationResult,
  };
};

/**
 * =========================
 * GET SINGLE PRODUCT (PUBLIC)
 * =========================
 */
exports.getSingleProductService = async (productId) => {
  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

/**
 * =========================
 * UPDATE PRODUCT (ADMIN)
 * =========================
 */
exports.updateProductService = async (productId, data) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) {
      product[key] = data[key];
    }
  });

  await product.save();
  return product;
};

/**
 * =========================
 * DELETE PRODUCT (SOFT DELETE)
 * =========================
 */
exports.deleteProductService = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  product.isActive = false;
  await product.save();
};
