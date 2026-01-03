const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const asyncHandler = require("../utils/asyncHandler");
const generateOtp = require("../utils/generateOtp");
const sendEmail = require("../utils/sendEmail");

// ==============================
// JWT GENERATOR
// ==============================
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// ==============================
// REGISTER
// ==============================
exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  const userExist = await User.findOne({ email });
  if (userExist) {
    return res.status(400).json({
      success: false,
      message: "Email already registered"
    });
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);

  const user = await User.create({
    name,
    email,
    password,
    otp: hashedOtp,
    otpExpire: Date.now() + 10 * 60 * 1000,
    otpAttempts: 0,
    lastOtpSentAt: Date.now(),
    isVerified: false
  });

  // await sendEmail(email, "Verify Your Email", `Your OTP is ${otp}`);

  res.status(201).json({
    success: true,
    message: "OTP sent to email",
    userId: user._id
  });
});

// ==============================
// VERIFY OTP
// ==============================
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({
      success: false,
      message: "Missing credentials"
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: "User already verified"
    });
  }

  if (user.otpAttempts >= 5) {
    return res.status(429).json({
      success: false,
      message: "Too many attempts. Please request a new OTP."
    });
  }

  if (user.otpExpire < Date.now()) {
    return res.status(400).json({
      success: false,
      message: "OTP expired"
    });
  }

  const isValid = await bcrypt.compare(otp, user.otp);
  if (!isValid) {
    user.otpAttempts += 1;
    await user.save();
     return res.status(400).json({
      success: false,
      message: "Invalid OTP",
      attemptsLeft: 5 - user.otpAttempts
    });
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  user.otpAttempts = 0;
  user.lastOtpSentAt = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Email verified successfully"
  });
});

// ==============================
// RESEND OTP
// ==============================
exports.resendOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: "User already verified"
    });
  }

  // 60 sec cooldown

  if (
    user.lastOtpSentAt &&
    Date.now() - user.lastOtpSentAt < 60 * 1000
  ) {
    const wait = Math.ceil(
      (60 * 1000 - (Date.now() - user.lastOtpSentAt)) / 1000
    );
    return res.status(429).json({
      success: false,
      message: `Please wait ${wait}s before requesting new OTP`
    });
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);

  user.otp = hashedOtp;
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  user.otpAttempts+= 1;////------------------------------check
  user.lastOtpSentAt = Date.now();

  await user.save();

  // await sendEmail(user.email, "Resend OTP", `Your OTP is ${otp}`);

  res.status(200).json({
    success: true,
    message: "OTP resent successfully"
  });
});

// ==============================
// LOGIN
// ==============================
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid credentials"
    });
  }

  if (!user.isVerified) {
    return res.status(401).json({
      success: false,
      message: "Please verify your email first"
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Invalid credentials"
    });
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "Login successful",
    token
  });
});

// ==============================
// FORGOT PASSWORD
// ==============================
exports.forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);

  user.otp = hashedOtp;
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  user.lastOtpSentAt = Date.now();
  user.otpAttempts = 0;

  await user.save();

  // await sendEmail(email, "Reset Password OTP", `Your OTP is ${otp}`);

  res.status(200).json({
    success: true,
    message: "Password reset OTP sent to email"
  });
});

// ==============================
// RESET PASSWORD
// ==============================
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  if (user.otpExpire < Date.now()) {
    return res.status(400).json({
      success: false,
      message: "OTP expired"
    });
  }

  const isValid = await bcrypt.compare(otp, user.otp);
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP"
    });
  }

  user.password = newPassword; // pre-save hook will hash
  user.otp = undefined;
  user.otpExpire = undefined;
  user.lastOtpSentAt = undefined;
  user.otpAttempts = 0;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully"
  });
});



  