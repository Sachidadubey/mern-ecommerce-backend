const mongoose = require('mongoose')

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    category: {
      type: String,
      enum: ['PRODUCT_ISSUE', 'DELIVERY_ISSUE', 'PAYMENT_ISSUE', 'REFUND_REQUEST', 'COMPLAINT', 'GENERAL_INQUIRY'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    attachments: [String], // File URLs
    responses: [
      {
        respondBy: mongoose.Schema.Types.ObjectId,
        respondByRole: String,
        response: String,
        attachments: [String],
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    internalNotes: [
      {
        addedBy: mongoose.Schema.Types.ObjectId,
        note: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resolution: {
      resolutionType: String,
      notes: String,
      resolvedAt: Date,
      resolvedBy: mongoose.Schema.Types.ObjectId,
    },
    satisfaction: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedback: String,
      ratedAt: Date,
    },
    tags: [String],
    customFields: mongoose.Schema.Types.Mixed,
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

// Auto-generate ticket ID
supportTicketSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const count = await this.constructor.countDocuments()
    this.ticketId = `TKT-${Date.now()}-${count + 1}`
  }
  next()
})

supportTicketSchema.index({ user: 1, createdAt: -1 })
supportTicketSchema.index({ ticketId: 1 })
supportTicketSchema.index({ status: 1 })
supportTicketSchema.index({ priority: 1 })

module.exports = mongoose.model('SupportTicket', supportTicketSchema)
