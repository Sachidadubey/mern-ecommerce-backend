const { z } = require("zod");
const mongoose = require("mongoose");
const objectId = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: "Invalid ObjectId",
  });
module.exports = { objectId };