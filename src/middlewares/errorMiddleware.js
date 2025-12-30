// centralized error handler -----
const errorHandler = (err, req, res, next)=>{
  console.log("error");

  const statusCode = err.statuscode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
  
};
module.exports = errorHandler;


// err.stack shows the complete error trace

// err.message only gives the error text.
// err.stack shows:

// file name

// function name

// line number

// full call path

// So instead of just knowing “Something failed”, you know exactly where and