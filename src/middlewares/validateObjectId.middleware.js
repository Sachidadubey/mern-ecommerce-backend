const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

module.exports = (paramName) => {
  return (req, res, next) => {
    let id;

    if (paramName) {
      id = req.params?.[paramName];
    } else {
      id =
        req.params?.productId ||
        req.params?.id ||
        req.params?.reviewId ||
        req.params?.orderId ||
        req.params?.cartId;
    }

    // 🔥 IMPORTANT FIX
    if (!id) {
      return next(new AppError("ID is required", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid ID format", 400));
    }

    next(); // ✅ request lifecycle continues
  };
};
