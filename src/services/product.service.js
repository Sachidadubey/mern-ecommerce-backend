const Product = require("../models/product.model");
const AppError = require("../utils/AppError");
const ApiFeatures = require("../utils/ApiFeatures");
const cloudinary = require("../config/cloudinary"); // ✅ FIXED

// ================= ADD PRODUCT =================
exports.addProductService = async (productData, adminId, files) => {
  const { name, description, price, category, stock } = productData;

  if (!name || price === undefined || !category) {
    throw new AppError("Required product fields are missing", 400);
  }

  if (price < 0 || (stock !== undefined && stock < 0)) {
    throw new AppError("Invalid price or stock value", 400);
  }

  // 📸 Images OPTIONAL
 

if (files?.length) {
  images = files.map((file) => ({
    public_id: file.filename,
    url: file.path,
  }));
} else {
  images = [
    {
      public_id: "default-product",
      url: process.env.DEFAULT_PRODUCT_IMAGE,
    },
  ];
}

  try {
    return await Product.create({
      name: name.trim(),
      description,
      price,
      category,
      stock: stock ?? 0,
      images,
      createdBy: adminId,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(
        "Product already exists in this category",
        409
      );
    }
    throw err;
  }
};

// ================= GET ALL PRODUCTS =================
exports.getAllProductsService = async (query) => {
  const resultsPerPage = parseInt(query.limit, 10) || 10;

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
  if (!productId) {
    throw new AppError("Product ID required", 400);
  }

  const product = await Product.findById(productId).lean();

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (!product.isActive) {
    throw new AppError("Product is inactive", 403);
  }

  return product;
};

// ================= UPDATE PRODUCT =================
exports.updateProductService = async (
  productId,
  updateData,
  adminId,
  files
) => {
  if (!productId) {
    throw new AppError("Product ID required", 400);
  }

  if (!updateData && (!files || files.length === 0)) {
    throw new AppError("No update data provided", 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // 🔁 Duplicate name + category check
  if (updateData?.name && updateData?.category) {
    const exists = await Product.findOne({
      _id: { $ne: productId },
      name: updateData.name.trim(),
      category: updateData.category,
    });

    if (exists) {
      throw new AppError(
        "Product already exists in this category",
        409
      );
    }
  }

  // 🔢 Numeric safety
  if (
    (updateData?.price !== undefined && updateData.price < 0) ||
    (updateData?.stock !== undefined && updateData.stock < 0)
  ) {
    throw new AppError("Invalid price or stock value", 400);
  }

  // 🔐 Allowed text fields ONLY
  const allowedUpdates = [
    "name",
    "description",
    "price",
    "category",
    "stock",
    "isActive",
  ];

  allowedUpdates.forEach((field) => {
    if (updateData?.[field] !== undefined) {
      product[field] =
        field === "name"
          ? updateData[field].trim()
          : updateData[field];
    }
  });

  // 📸 IMAGE UPDATE (OPTIONAL)
  if (files?.length) {
    // delete old images
    await Promise.all(
      product.images.map((img) =>
        cloudinary.uploader.destroy(img.public_id)
      )
    );

    // assign new images
    product.images = files.map((file) => ({
      public_id: file.filename,
      url: file.path,
    }));
  }

  // 🧾 Audit trail
  product.updatedBy = adminId;

  await product.save({ validateBeforeSave: true });
  return product;
};

// ================= DELETE PRODUCT (SOFT DELETE) =================
exports.deleteProductService = async (productId, adminId) => {
  if (!productId) {
    throw new AppError("Product ID required", 400);
  }

  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
  }

  product.isActive = false;
  product.updatedBy = adminId;

  await product.save();
  return product;
};
