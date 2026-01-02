const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const generateOtp = require("../utils/generateOtp");
const sendEmail = require("../utils/sendEmail"); 

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// REGISTER
exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });

  const userExist = await User.findOne({ email });
  if (userExist)
    return res.status(400).json({
      success: false,
      message: "Email already registered"
    });

  const otp = generateOtp();
  // hashing otp -----
  const hashedOtp = await bcrypt.hash(otp, 10);


  const user = await User.create({
    name,
    email,
    password,
    otp:hashedOtp,
    otpExpire: Date.now() + 10 * 60 * 1000,
    lastOtpSentAt: Date.now()
  });

  // await sendEmail(email, "Verify Email", `Your OTP is ${otp}`);

  res.status(201).json({
    success: true,
    message: "OTP sent to email",
    userId: user._id
  });
});


// VERIFY OTP
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp)
    return res.status(400).json({ message: "Missing credentials" });

  const user = await User.findById(userId);
  if (!user)
    return res.status(400).json({ message: "User not found" });

  if (user.isVerified)
    return res.status(400).json({ message: "Already verified" });

  // brute force protection ---
  if (user.otpAttempts > 5)
    return res.status(400).json({ message: "Too Many attempts. Request new OTP" });

  if (user.otpExpire < Date.now())
    return res.status(400).json({ message: "OTP expired" });

  const isValid = await bcrypt.compare(otp, user.otp);
  if (!isValid) {
    user.otpAttempts += 1;
    await user.save();

    return res.status(400).json({
      message: "Invalid Otp",
      attemptsLeft: 5 - user.otpAttempts
    });
  }
   

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  user.otpAttempts = 0;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Email verified successfully"
  });
});


// LOGIN
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });

  const user = await User.findOne({ email }).select("+password");
  if (!user)
    return res.status(400).json({
      success: false,
      message: "Invalid credentials"
    });

  if (!user.isVerified)
    return res.status(401).json({
      success: false,
      message: "Verify email first"
    });

  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return res.status(400).json({
      success: false,
      message: "Invalid credentials"
    });

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "Login successful",
    token
  });
});


// RESEND OTP
exports.resendOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);   // FIXED
  if (!user)
    return res.status(400).json({ message: "User not found" });

  if (user.isVerified)
    return res.status(400).json({ message: "Already verified" });
  //60s cooldown------

  if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt < 60 * 1000) {
    const wait = Math.ceil((60 * 1000 - (Date.now() - user.lastOtpSentAt)) / 1000);
    return res.status(429).json({
      message: `please wait ${wait}s before requesting new OTP`
    });
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);
  user.otp = hashedOtp;
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  user.otpAttempts = 0;
  user.lastOtpSentAt = Date.now() + 5 * 60 * 1000;
  await user.save();

  // await sendEmail(user.email, "Resend OTP", `Your OTP is ${otp}`);

  res.status(200).json({ message: "OTP resent successfully" });
});
