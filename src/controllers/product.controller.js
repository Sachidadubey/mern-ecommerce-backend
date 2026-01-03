const Product = require("../models/product.model");
const asyncHandler = require("../utils/asyncHandler");

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
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { isActive: true };

  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: "i" };
  }

  const products = await Product.find(filter)
    .skip(skip)
    .limit(limit)
    .sort("-createdAt");

  const total = await Product.countDocuments(filter);

  res.status(200).json({
    success: true,
    meta: {
      page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
    },
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
