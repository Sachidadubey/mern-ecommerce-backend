const Chat = require("../models/chat.model");
const SupportTicket = require("../models/supportTicket.model");
const { CHAT_STATUS, TICKET_STATUS } = require("../constants/support.constants");

/* ================= CHAT SERVICES ================= */

exports.createChat = async ({ user, subject, category }) => {
  return Chat.create({
    user: user._id,
    subject,
    category,
    status: CHAT_STATUS.OPEN,
    messages: [{
      sender: "user",
      senderName: user.name,
      senderId: user._id,
      message: subject,
    }],
  });
};

exports.addChatMessage = async ({ chat, user, message, attachments }) => {
  if (chat.status === CHAT_STATUS.CLOSED)
    throw new Error("Chat closed");

  chat.messages.push({
    sender: user.role === "admin" ? "agent" : "user",
    senderName: user.name,
    senderId: user._id,
    message,
    attachments: attachments || [],
  });

  chat.updatedAt = new Date();
  return chat.save();
};

exports.closeChat = async ({ chat, rating, feedback }) => {
  chat.status = CHAT_STATUS.CLOSED;
  chat.resolvedAt = new Date();
  if (rating) chat.rating = rating;
  if (feedback) chat.feedback = feedback;
  return chat.save();
};

exports.assignChat = async ({ chat, agentId }) => {
  chat.supportAgent = agentId;
  chat.status = CHAT_STATUS.ASSIGNED;
  return chat.save();
};

exports.resolveChat = async ({ chat, admin }) => {
  chat.status = CHAT_STATUS.RESOLVED;
  chat.resolvedAt = new Date();
  chat.messages.push({
    sender: "agent",
    senderName: admin.name,
    senderId: admin._id,
    message: "Issue resolved",
  });
  return chat.save();
};

/* ================= TICKET SERVICES ================= */

exports.createTicket = async (data) => {
  return SupportTicket.create(data);
};

exports.addTicketResponse = async ({ ticket, user, response, attachments }) => {
  ticket.responses.push({
    respondBy: user._id,
    respondByRole: user.role,
    response,
    attachments: attachments || [],
  });
  ticket.updatedAt = new Date();
  return ticket.save();
};

exports.assignTicket = async ({ ticket, agentId }) => {
  
  ticket.assignedTo = agentId;
  ticket.status = TICKET_STATUS.IN_PROGRESS;
  return ticket.save();
};

exports.updateTicketStatus = async ({ ticket, status, admin }) => {
  ticket.status = status;
  if (status === TICKET_STATUS.RESOLVED) {
    ticket.resolution = {
      resolvedBy: admin._id,
      resolvedAt: new Date(),
    };
  }
  return ticket.save();
};

exports.closeTicket = async ({ ticket, admin }) => {
  ticket.status = TICKET_STATUS.CLOSED;
  ticket.closedBy = admin._id;
  ticket.closedAt = new Date();
  return ticket.save();
};
