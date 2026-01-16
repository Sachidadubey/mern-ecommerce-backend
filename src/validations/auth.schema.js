const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const verifyOtpSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});
module.exports = { registerSchema, loginSchema , verifyOtpSchema};
