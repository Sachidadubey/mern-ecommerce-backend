const User = require("../models/User.model");
const jwt = require("jsonwebtoken");


// generate token 
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    //put user id inside token so when token is decoded → we know which user
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};
//Because token must uniquely represent a user. Token = Digital Identity Card.   2>  jwt.sign() creates a new JWT token like stamping a verified seal
//jwt has 3 things -- Payload , secretKey,expiry

 

//register user

exports.registerUser = async (req, res, next) => {//next = send errors to central handler
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)  // If any field missing → ❌ stop.
      return res.status(400).json({ // 400 = Bad Request
        success: false,
        message: "All fields are required"
      });
    
    const userExist = await User.findOne({ email });
    if (userExist) 
      return res.status(400).json({
        success: false,
        message: "Email already registerd"
      });
    
      const user = await User.create({ name, email, password });

      const token = generateToken(user._id);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token
      });
    
    
  } catch (error) {
    next(error);
    
  }
};

// login user

exports.loginUser = async (req, res, next) => {
  try {
    
    const { email, password } = req.body;
    if (!email || !password)
      res.status(400).json({
        success: false,
        message: "Email and password  are required "
      });
    
    const user = await User.findOne({ email }).select("+password");
    if (!user)
      res.status(400).json({
        success: false,
        message: "Invalid Credentials !"
      });
    

    const isMatch = await user.comparePassword(password);

    if (!isMatch)
      res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    
    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: "Login successful",
      token
    });
    
    

  } catch (error) {
    next(error)
  }
};

//.select("+password")  -- Why plus sign? Because: In User Model, password = select:false So normal queries DO NOT return password But we NEED password temporarily ONLY for login to compare