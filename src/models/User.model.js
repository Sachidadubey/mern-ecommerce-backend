const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "Name is required"],
      //API will return error.
      //“Name is required” message will show.
      trim:true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      // TEST@GMAIL.COM → test@gmail.com
    },
    password: {
      type: String,
      require: [true, "Password is required"],
      minlength: [6, "password must be atleast 6 characters"],
      select: false,
      //When fetching user from DB
     //Password will NOT be returned
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    isVerified: {
      type: Boolean,
      default:false
    },
    otp: {
      type: String
    },
    otpExpire: {
      type: Number,
    },
    otpAttempts: {
  type: Number,
  default: 0
    },
    lastOtpSentAt: Number,

    
  
  }, { timestamps: true }// mongodb auto add createdAt , updatedAt
);


// hash password before save 
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();  //“Pre-save work finished.  next() Continue saving user.”
  this.password = await bcrypt.hash(this.password, 10);
});
//This is a Mongoose MiddlewareRuns before saving user into database.
//If password did NOT change Don’t hash again Just continue
  

// compare password method

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
// is used to add a custom function to the User model, so every User object automatically gets a method called comparePassword.
//   It is a function attached to the User Model that helps us check whether the user’s entered password matches the hashed password stored in the database.

// methods means: “Add custom functions to the model so every object of this schema can use it.”
// comparePassword This is the name of the custom method.
  


module.exports = mongoose.model("User", userSchema);