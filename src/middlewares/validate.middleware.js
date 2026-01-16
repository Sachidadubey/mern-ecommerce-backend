const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
  try {
    if (!schema || typeof schema.parse !== "function") {
      return next(); // schema missing → skip validation
    }

    schema.parse(req.body); // validate only body
    next();
  } catch (err) {
    // ✅ Only Zod validation errors
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // ❌ Any other unexpected error
    return next(err);
  }
};

module.exports = validate;
