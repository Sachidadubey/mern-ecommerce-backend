const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cart.controllers");
const { protect } = require("../middlewares/auth.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");
const validate = require("../middlewares/validate.middleware");

const { addToCartSchema, updateCartItemSchema } = require("../validations/cart.schema");

router.use(protect);

router.post("/", validate(addToCartSchema), cartController.addToCart);

router.get("/", cartController.getMyCart);

router.put("/item/:productId", validateObjectId, validate(updateCartItemSchema), cartController.updateCartItem);

router.delete("/item/:productId", validateObjectId, cartController.removeCartItem);

router.delete("/clear", cartController.clearCart);

module.exports = router;