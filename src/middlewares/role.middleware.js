const AppError = require("../utils/AppError");

exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        `Role (${req.user.role}) is not allowed to access this resource`,
        403
      );
    }

    next();
  };
};



// This is the REST PARAMETER (often called the “rest operator”).

// Definition:

// The rest parameter allows a function to accept any number of arguments and automatically collect them into an array.
//This pattern is called middleware factory.