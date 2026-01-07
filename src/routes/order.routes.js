const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const { createOrder } = require("../controllers/order.controller");


router.use(protect);
router.post("/", createOrder);

module.exports = router;
