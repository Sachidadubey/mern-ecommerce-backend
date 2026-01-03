const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

const validateObjectId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid ID format", 400);
  }

  next();
};

module.exports = validateObjectId;