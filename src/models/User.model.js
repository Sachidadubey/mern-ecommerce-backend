const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
// const validator = require("../middlewares/validate.middleware");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // validate: [validator.isEmail, "Invalid email"],
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otpHash: {
      type: String,
      select: false,
    },

    otpExpire: {
      type: Date,
      select: false,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },

    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

/* ================= PASSWORD HASH ================= */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* ================= PASSWORD COMPARE ================= */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);