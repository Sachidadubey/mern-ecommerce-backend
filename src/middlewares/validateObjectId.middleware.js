const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

module.exports = (paramName) => {
  return (req, res, next) => {
    let id;

    // 1️⃣ If paramName explicitly provided → highest priority
    if (paramName) {
      id = req.params?.[paramName];
    }

    // 2️⃣ Auto-detect ANY ObjectId from params (🔥 MAIN FIX)
    if (!id && req.params) {
      for (const key of Object.keys(req.params)) {
        const value = req.params[key];

        if (mongoose.Types.ObjectId.isValid(value)) {
          id = value;
          break;
        }
      }
    }

    // 3️⃣ Still not found → error
    if (!id) {
      return next(new AppError("ID is required", 400));
    }

    next();
  };
};
