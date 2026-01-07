const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

module.exports = (req, res, next) => {
  const id =
    req.params.productId ||
    req.params.id ||
    req.params.cartId;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid ID format", 400);
  }

  next();
};
