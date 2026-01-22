const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    supportAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ['user', 'agent', 'system'],
          default: 'user',
        },
        senderName: String,
        senderId: mongoose.Schema.Types.ObjectId,
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        attachments: [String], // URLs
      },
    ],
    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    category: {
      type: String,
      enum: ['PRODUCT', 'DELIVERY', 'PAYMENT', 'REFUND', 'OTHER'],
      default: 'OTHER',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    subject: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    resolvedAt: Date,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

// Index for faster queries
chatSchema.index({ user: 1, createdAt: -1 })
chatSchema.index({ status: 1 })
chatSchema.index({ supportAgent: 1 })

module.exports = mongoose.model('Chat', chatSchema)
