const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const asyncHandler = require("../utils/asyncHandler");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1️⃣ Token check from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  console.log(req.headers.authorization);

  // 2️⃣ If token missing
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token missing"
    });
  }

  // 3️⃣ Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 4️⃣ Find user from token payload
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "User not found"
    });
  }

  // 5️⃣ Attach user to request
  req.user = user;

  // 6️⃣ Move to next middleware/controller
  next();
});
