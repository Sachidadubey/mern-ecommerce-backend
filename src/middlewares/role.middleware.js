exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    // safety check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // role check
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not allowed to access this resource`
      });
    }

    next();
  };
};



// This is the REST PARAMETER (often called the “rest operator”).

// Definition:

// The rest parameter allows a function to accept any number of arguments and automatically collect them into an array.
//This pattern is called middleware factory.