const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
      // Examples: PRODUCT_CREATED, PRODUCT_UPDATED, ORDER_REFUNDED, USER_ROLE_CHANGED
    },

    resource: {
      type: String,
      enum: ["PRODUCT", "ORDER", "PAYMENT", "USER", "CATEGORY", "COUPON", "REVIEW"],
      required: true,
      index: true,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userRole: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },

    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },

    errorMessage: String,

    ipAddress: String,

    userAgent: String,

    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Indexes for querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
