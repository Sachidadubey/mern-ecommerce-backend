const express = require("express");
const protect = require("../middlewares/auth.middleware");

const {
  addToCart,
  getMyCart,
  updateCartItem,
  removeCartItem,
  clearCart
}
  = require("../controllers/cart.controller");
const validateObjectId = require("../middlewares/validateObjectId.middleware");
const router = express.Router();
router.use(protect); // all routes are protected-

router.post("/", addToCart);
router.get("/", getMyCart);
router.put("/item/:productId",validateObjectId, updateCartItem);
router.delete("/item/:productId",validateObjectId, removeCartItem);
router.delete("/cart", clearCart);

module.exports = router;
