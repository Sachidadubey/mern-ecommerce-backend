const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

const router = express.Router();

// 🔹 Only logged-in user
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You are logged in",
    user: req.user
  });
});

// 🔹 Only admin
router.get(
  "/admin",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome Admin"
    });
  }
);

module.exports = router;
