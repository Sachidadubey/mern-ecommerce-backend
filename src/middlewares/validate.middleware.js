const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
  try {
    if (!schema || typeof schema.parse !== "function") {
      return next();
    }
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    next();
  } catch (err) {
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

    next(err);
  }
};

module.exports = validate;
