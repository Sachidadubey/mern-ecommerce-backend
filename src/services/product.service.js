const Product = require("../models/product.model");
const AppError = require("../utils/AppError");
const ApiFeatures = require("../utils/ApiFeatures");

// ================= ADD PRODUCT =================
exports.addProductService = async (
  productData,
  adminId,
  files // 👈 req.files
) => {
  const { name, description, price, category, stock } = productData;

  // 🔒 Mandatory fields
  if (!name || price === undefined || !category) {
    throw new AppError("Required product fields are missing", 400);
  }

  // 🔢 Numeric validation
  if (price < 0 || (stock !== undefined && stock < 0)) {
    throw new AppError("Invalid price or stock value", 400);
  }

  // 📸 Upload images to Cloudinary
  const images = [];

  if (files && files.length > 0) {
    for (const file of files) {
      const uploaded = await uploadToCloudinary(
        file.buffer,
        "products"
      );

      images.push({
        url: uploaded.url,
        public_id: uploaded.public_id,
      });
    }
  }

  try {
    const product = await Product.create({
      name: name.trim(),
      description,
      price,
      category,
      stock: stock ?? 0,
      images,
      createdBy: adminId,
    });

    return product;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError("Product already exists in this category", 409);
    }
    throw error;
  }
};

// ================= GET ALL PRODUCTS =================
exports.getAllProductsService = async (query) => {
  const resultsPerPage = parseInt(query.limit, 10) || 10;

  // 🔄 Admin support: include inactive products if needed
  const baseQuery =
    query.includeInactive === "true" ? {} : { isActive: true };

  const features = new ApiFeatures(Product.find(baseQuery), query)
    .filter()
    .sort()
    .paginate(resultsPerPage);

  await features.countTotal(Product);

  const products = await features.query.lean();

  return {
    products,
    meta: features.paginationResult,
  };
};

// ================= GET SINGLE PRODUCT =================
exports.getSingleProductService = async (productId) => {
  if (!productId) throw new AppError("Product ID required", 400);

  const product = await Product.findById(productId).lean();

  if (!product) throw new AppError("Product not found", 404);

  if (!product.isActive)
    throw new AppError("Product is inactive", 403);

  return product;
};

// ================= UPDATE PRODUCT =================
exports.updateProductService = async (productId, updateData, adminId) => {
  if (!productId) throw new AppError("Product ID required", 400);

  if (!updateData || Object.keys(updateData).length === 0) {
    throw new AppError("No update data provided", 400);
  }

  const product = await Product.findById(productId);

  if (!product) throw new AppError("Product not found", 404);

  // 🔁 Prevent duplicate name + category update
  if (updateData.name && updateData.category) {
    const exists = await Product.findOne({
      _id: { $ne: productId },
      name: updateData.name.trim(),
      category: updateData.category,
    });

    if (exists) {
      throw new AppError("Product already exists in this category", 409);
    }
  }

  // 🔐 Whitelisted fields
  const allowedUpdates = [
    "name",
    "description",
    "price",
    "category",
    "stock",
    "images",
    "isActive",
  ];

  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      product[field] = updateData[field];
    }
  });

  // 🧾 Audit trail
  product.updatedBy = adminId;

  await product.save({ validateBeforeSave: true });

  return product;
};

// ================= DELETE PRODUCT (SOFT DELETE) =================
exports.deleteProductService = async (productId, adminId) => {
  if (!productId) throw new AppError("Product ID required", 400);

  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
  }

  product.isActive = false;
  product.updatedBy = adminId;

  await product.save();

  return product;
};
