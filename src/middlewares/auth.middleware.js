const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new AppError("Not authorized, token missing", 401);
  }

console.log(process.env.ACCESS_TOKEN_SECRET );
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  req.user = user;
  next();
});