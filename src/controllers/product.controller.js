const Product = require("../models/product.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiFeatures = require("../utils/ApiFeatures");

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


// get all products ----

exports.getAllProducts = asyncHandler(async (req, res) => {
  const features = new ApiFeatures(
    Product.find({ isActive: true }),
    req.query
  )
    .filter()
    .search()
    .sort()
    .paginate();
  
  const products = await features.query;
  const total = await Product.countDocuments({ isActive: true });

  res.status(200).json({
    success: true,
    total,
    data: products,
  });
});

// (200)-> successfull read--

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

// update products ---
exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
  throw new AppError("Product not found", 404);
  }

  // Update only provided fields
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
    data: product,// frontend needs updated data 
  });
});
// Why !== undefined and NOT if (name)? Because: Empty string "" is valid 0 is valid for price/stock false is valid for isActive

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
