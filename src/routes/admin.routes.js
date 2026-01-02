// const express = require("express");
// const { protect } = require("../middlewares/auth.middleware");
// const { authorizeRoles } = require("../middlewares/role.middleware");

// const router = express.Router();

// router.post(
//   "/admin-only",
//   protect,
//   authorizeRoles("admin"),
//   (req, res) => {
//     res.json({ message: "Admin acess granted" });
// })