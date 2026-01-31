const asyncHandler = require("../utils/asyncHandler");
const Chat = require("../models/chat.model");
const SupportTicket = require("../models/supportTicket.model");
const service = require("../services/support.services");

/* ========== CHAT ========== */

exports.startChat = asyncHandler(async (req, res) => {
  const chat = await service.createChat({
    user: req.user,
    subject: req.body.subject,
    category: req.body.category,
  });
  res.status(201).json({ success: true, data: chat });
});

exports.getUserChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ user: req.user._id });
  res.json({ success: true, data: chats });
});

exports.getChatById = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found" });
  if (chat.user.toString() !== req.user._id.toString() && req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  res.json({ success: true, data: chat });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const  chatId= req.params.chatId;
  const chat = await Chat.findById(chatId);
  const updated = await service.addChatMessage({
    chat,
    user: req.user,
    message: req.body.message,
    attachments: req.body.attachments,
  });
  res.json({ success: true, data: updated });
});

exports.closeChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.chatId);
  const closed = await service.closeChat({
    chat,
    rating: req.body.rating,
    feedback: req.body.feedback,
  });
  res.json({ success: true, data: closed });
});

/* ========== ADMIN CHAT ========== */

exports.getAllChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find();
  res.json({ success: true, data: chats });
});

exports.assignChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.chatId);
  const updated = await service.assignChat({ chat, agentId: req.body.agentId });
  res.json({ success: true, data: updated });
});

exports.addAdminMessage = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.chatId);
  const updated = await service.addChatMessage({
    chat,
    user: req.user,
    message: req.body.message,
  });
  res.json({ success: true, data: updated });
});

exports.resolveChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.chatId);
  const resolved = await service.resolveChat({ chat, admin: req.user });
  res.json({ success: true, data: resolved });
});

/* ========== TICKET ========== */

exports.createTicket = asyncHandler(async (req, res) => {
  const ticket = await service.createTicket({
    user: req.user._id,
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority,
    category: req.body.category,
  });
  res.status(201).json({ success: true, data: ticket });
});

exports.getUserTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ user: req.user._id });
  res.json({ success: true, data: tickets });
});

exports.getTicketById = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.ticketId);
  if (!ticket) return res.status(404).json({ message: "Not found" });
  res.json({ success: true, data: ticket });
});

exports.addTicketResponse = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.ticketId);
  const updated = await service.addTicketResponse({
    ticket,
    user: req.user,
    response: req.body.response,
  });
  res.json({ success: true, data: updated });
});

exports.rateTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.ticketId);
  ticket.satisfaction = {
    rating: req.body.rating,
    feedback: req.body.feedback,
  };
  await ticket.save();
  res.json({ success: true, data: ticket });
});

/* ========== ADMIN TICKET ========== */

exports.getAllTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find();
  res.json({ success: true, data: tickets });
});

exports.assignTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.ticketId);
  const updated = await service.assignTicket({ ticket, agentId: req.body.agentId });
  res.json({ success: true, data: updated });
});

exports.updateTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.ticketId);
  const updated = await service.updateTicketStatus({
    ticket,
    status: req.body.status,
    admin: req.user,
  });
  res.json({ success: true, data: updated });
});

exports.closeTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.ticketId);
  const closed = await service.closeTicket({ ticket, admin: req.user });
  res.json({ success: true, data: closed });
});

exports.getTicketStats = asyncHandler(async (req, res) => {
  const total = await SupportTicket.countDocuments();
  res.json({ success: true, data: { total } });
});

