const asyncHandler = require("../utils/asyncHandler");
const Chat = require("../models/chat.model");
const SupportTicket = require("../models/supportTicket.model");

// ===== CHAT OPERATIONS =====

exports.startChat = asyncHandler(async (req, res) => {
  const { subject, category } = req.body;
  const userId = req.user._id;

  const chat = await Chat.create({
    user: userId,
    subject,
    category: category || "OTHER",
    messages: [
      {
        sender: "user",
        senderName: req.user.name,
        senderId: userId,
        message: subject,
      },
    ],
  });

  await chat.populate("user", "name email");

  res.status(201).json({
    success: true,
    data: chat,
    message: "Chat started successfully",
  });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { message, attachments } = req.body;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ success: false, message: "Chat not found" });
  }

  if (chat.user.toString() !== userId.toString() && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  chat.messages.push({
    sender: "user",
    senderName: req.user.name,
    senderId: userId,
    message,
    attachments: attachments || [],
  });

  chat.updatedAt = new Date();
  await chat.save();

  res.status(200).json({
    success: true,
    data: chat,
    message: "Message sent successfully",
  });
});

exports.getUserChats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { limit = 10, page = 1 } = req.query;

  const chats = await Chat.find({ user: userId })
    .populate("user", "name email")
    .populate("supportAgent", "name email")
    .sort({ updatedAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Chat.countDocuments({ user: userId });

  res.status(200).json({
    success: true,
    data: { chats, total },
    message: "Chats fetched successfully",
  });
});

exports.getChatById = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId)
    .populate("user", "name email phone")
    .populate("supportAgent", "name email");

  if (!chat) {
    return res.status(404).json({ success: false, message: "Chat not found" });
  }

  if (chat.user.toString() !== userId.toString() && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  res.status(200).json({
    success: true,
    data: chat,
    message: "Chat retrieved successfully",
  });
});

exports.closeChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { rating, feedback } = req.body;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ success: false, message: "Chat not found" });
  }

  if (chat.user.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  chat.status = "CLOSED";
  chat.resolvedAt = new Date();
  if (rating) chat.rating = rating;
  if (feedback) chat.feedback = feedback;

  await chat.save();

  res.status(200).json({
    success: true,
    data: chat,
    message: "Chat closed successfully",
  });
});

// ===== ADMIN CHAT OPERATIONS =====

exports.getAllChats = asyncHandler(async (req, res) => {
  const { status, limit = 20, page = 1 } = req.query;

  let filter = {};
  if (status) filter.status = status;

  const chats = await Chat.find(filter)
    .populate("user", "name email phone")
    .populate("supportAgent", "name email")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Chat.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: { chats, total },
    message: "All chats fetched",
  });
});

exports.assignChatToAgent = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { agentId } = req.body;

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    {
      supportAgent: agentId,
      status: "ASSIGNED",
    },
    { new: true }
  ).populate("supportAgent", "name email");

  if (!chat) {
    return res.status(404).json({ success: false, message: "Chat not found" });
  }

  res.status(200).json({
    success: true,
    data: chat,
    message: "Chat assigned to agent",
  });
});

exports.addAdminMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { message, attachments } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ success: false, message: "Chat not found" });
  }

  chat.messages.push({
    sender: "agent",
    senderName: req.user.name,
    senderId: req.user._id,
    message,
    attachments: attachments || [],
  });

  if (chat.status !== "RESOLVED" && chat.status !== "CLOSED") {
    chat.status = "ASSIGNED";
  }

  await chat.save();

  res.status(200).json({
    success: true,
    data: chat,
    message: "Admin message added successfully",
  });
});

exports.resolvChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { resolutionMessage } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ success: false, message: "Chat not found" });
  }

  if (resolutionMessage) {
    chat.messages.push({
      sender: "agent",
      senderName: req.user.name,
      senderId: req.user._id,
      message: resolutionMessage,
    });
  }

  chat.status = "RESOLVED";
  chat.resolvedAt = new Date();
  await chat.save();

  res.status(200).json({
    success: true,
    data: chat,
    message: "Chat resolved successfully",
  });
});

// ===== SUPPORT TICKETS =====

exports.createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority, orderId, attachments } =
    req.body;
  const userId = req.user._id;

  const ticket = await SupportTicket.create({
    user: userId,
    order: orderId,
    title,
    description,
    category: category || "GENERAL_INQUIRY",
    priority: priority || "MEDIUM",
    attachments: attachments || [],
  });

  await ticket.populate("user", "name email phone");

  res.status(201).json({
    success: true,
    data: ticket,
    message: "Support ticket created successfully",
  });
});

exports.getUserTickets = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { limit = 10, page = 1, status } = req.query;

  let filter = { user: userId };
  if (status) filter.status = status;

  const tickets = await SupportTicket.find(filter)
    .populate("user", "name email")
    .populate("order", "orderStatus totalAmount")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await SupportTicket.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: { tickets, total },
    message: "User tickets fetched",
  });
});

exports.getTicketById = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const userId = req.user._id;

  const ticket = await SupportTicket.findById(ticketId)
    .populate("user", "name email phone")
    .populate("order", "orderStatus items totalAmount")
    .populate("assignedTo", "name email");

  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  if (ticket.user.toString() !== userId.toString() && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  res.status(200).json({
    success: true,
    data: ticket,
    message: "Ticket retrieved successfully",
  });
});

exports.addTicketResponse = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { response, attachments } = req.body;
  const userId = req.user._id;

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  if (ticket.user.toString() !== userId.toString() && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  ticket.responses.push({
    respondBy: userId,
    respondByRole: req.user.role,
    response,
    attachments: attachments || [],
  });

  ticket.updatedAt = new Date();
  await ticket.save();

  res.status(200).json({
    success: true,
    data: ticket,
    message: "Response added successfully",
  });
});

exports.updateTicketStatus = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { status, resolutionType, resolutionNotes } = req.body;

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  ticket.status = status;
  ticket.updatedAt = new Date();

  if (status === "RESOLVED" && resolutionType) {
    ticket.resolution = {
      resolutionType,
      notes: resolutionNotes,
      resolvedAt: new Date(),
      resolvedBy: req.user._id,
    };
  }

  await ticket.save();

  res.status(200).json({
    success: true,
    data: ticket,
    message: "Ticket status updated",
  });
});

exports.rateTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { rating, feedback } = req.body;
  const userId = req.user._id;

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  if (ticket.user.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  ticket.satisfaction = {
    rating,
    feedback,
    ratedAt: new Date(),
  };

  await ticket.save();

  res.status(200).json({
    success: true,
    data: ticket,
    message: "Ticket rated successfully",
  });
});

// ===== ADMIN TICKET OPERATIONS =====

exports.getAllTickets = asyncHandler(async (req, res) => {
  const { status, priority, limit = 20, page = 1 } = req.query;

  let filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const tickets = await SupportTicket.find(filter)
    .populate("user", "name email phone")
    .populate("assignedTo", "name email")
    .sort({ priority: 1, createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await SupportTicket.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: { tickets, total },
    message: "All tickets fetched",
  });
});

exports.assignTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { agentId } = req.body;

  const ticket = await SupportTicket.findByIdAndUpdate(
    ticketId,
    {
      assignedTo: agentId,
      status: "IN_PROGRESS",
    },
    { new: true }
  ).populate("assignedTo", "name email");

  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  res.status(200).json({
    success: true,
    data: ticket,
    message: "Ticket assigned successfully",
  });
});

exports.getTicketStats = asyncHandler(async (req, res) => {
  const totalTickets = await SupportTicket.countDocuments();
  const openTickets = await SupportTicket.countDocuments({ status: "OPEN" });
  const inProgressTickets = await SupportTicket.countDocuments({
    status: "IN_PROGRESS",
  });
  const resolvedTickets = await SupportTicket.countDocuments({
    status: "RESOLVED",
  });

  const avgResolutionTime = await SupportTicket.aggregate([
    {
      $match: { "resolution.resolvedAt": { $exists: true } },
    },
    {
      $group: {
        _id: null,
        avgTime: {
          $avg: {
            $subtract: ["$resolution.resolvedAt", "$createdAt"],
          },
        },
      },
    },
  ]);

  const avgRating = await SupportTicket.aggregate([
    {
      $match: { "satisfaction.rating": { $exists: true } },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$satisfaction.rating" },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      avgResolutionTime: avgResolutionTime[0]?.avgTime || 0,
      avgRating: avgRating[0]?.avgRating || 0,
    },
    message: "Ticket statistics fetched",
  });
});
