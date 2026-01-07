const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");

const {
  addToCart,
  getMyCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cart.controllers");

const router = express.Router();

router.use(protect);

router.post("/", addToCart);
router.get("/", getMyCart);
router.put("/item/:productId", validateObjectId, updateCartItem);
router.delete("/item/:productId",  removeCartItem);
router.delete("/cart", clearCart);

module.exports = router;
