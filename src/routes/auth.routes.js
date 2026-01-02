const express = require("express");
const { registerUser, loginUser, verifyOtp, resendOTP } = require("../controllers/auth.controller");

const router = express.Router();
router.post("/register", registerUser);
router.post("/varify-otp", verifyOtp);
router.post("/resend-otp", resendOTP)
router.post("/login", loginUser);


module.exports = router;

//router = local route handler later we plug it in main app
