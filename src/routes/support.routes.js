const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");
const controller = require("../controllers/support.controller");

const router = express.Router();

/* =========================================================
   GLOBAL AUTH MIDDLEWARE
   → All support routes require logged-in user
========================================================= */
router.use(protect);

/* =========================================================
   USER CHAT ROUTES
========================================================= */

/**
 * Start a new support chat (User)
 * POST /api/support/chat
 */
router.post("/chat", controller.startChat);

/**
 * Get all chats of logged-in user
 * GET /api/support/chat
 */
router.get("/chat", controller.getUserChats);

/**
 * Get single chat details by chatId (User/Admin)
 * GET /api/support/chat/:chatId
 */
router.get(
  "/chat/:chatId",
  controller.getChatById,validateObjectId()
);

/**
 * Send message in a chat (User/Admin)
 * POST /api/support/chat/:chatId/message
 */
router.post(
  "/chat/:chatId/message",
  validateObjectId(),
  controller.sendMessage
);

/**
 * Close chat with optional rating & feedback (User/Admin)
 * PATCH /api/support/chat/:chatId/close
 */
router.patch(
  "/chat/:chatId/close",
  validateObjectId("chatId"),
  controller.closeChat
);

/* =========================================================
   USER TICKET ROUTES
========================================================= */

/**
 * Create a new support ticket (User)
 * POST /api/support/ticket
 */
router.post("/tickets", controller.createTicket);

/**
 * Get all tickets of logged-in user
 * GET /api/support/ticket
 */
router.get("/tickets", controller.getUserTickets);

/**
 * Get ticket details by ticketId (User/Admin)
 * GET /api/support/ticket/:ticketId
 */
router.get(
  "/tickets/:ticketId",
  validateObjectId(),
  controller.getTicketById
);

/**
 * Add response/message to a ticket (User/Admin)
 * POST /api/support/ticket/:ticketId/response
 */
router.post(
  "/tickets/:ticketId/response",
  validateObjectId(),
  controller.addTicketResponse
);

/**
 * Rate a closed ticket (User)
 * PATCH /api/support/ticket/:ticketId/rate
 */
router.patch(
  "/tickets/:ticketId/rate",
  validateObjectId(),
  controller.rateTicket
);

/* =========================================================
   ADMIN ROUTES (ROLE: ADMIN)
========================================================= */
router.use(authorizeRoles("admin"));

/* ------------------ ADMIN CHAT ROUTES ------------------ */

/**
 * Get all chats (Admin)
 * GET /api/support/admin/chats
 */
router.get("/admin/chats", authorizeRoles("admin"), controller.getAllChats);

/**
 * Assign chat to support agent/admin
 * PATCH /api/support/admin/chat/:chatId/assign
 */
router.patch(
  "/admin/chat/:chatId/assign",
  validateObjectId(),authorizeRoles("admin"),
  controller.assignChat
);

/**
 * Send admin/agent message in chat
 * POST /api/support/admin/chat/:chatId/message
 */
router.post(
  "/admin/chat/:chatId/message",
  validateObjectId(),authorizeRoles("admin"),
  controller.addAdminMessage
);

/**
 * Resolve a chat (Admin)
 * PATCH /api/support/admin/chat/:chatId/resolve
 */
router.patch(
  "/admin/chat/:chatId/resolve",
  validateObjectId("chatId"),authorizeRoles("admin"),
  controller.resolveChat
);

/* ------------------ ADMIN TICKET ROUTES ------------------ */

/**
 * Get all tickets (Admin)
 * GET /api/support/admin/tickets
 */
router.get("/admin/tickets", authorizeRoles("admin"), controller.getAllTickets);

/**
 * Assign ticket to agent/admin
 * PATCH /api/support/admin/ticket/:ticketId/assign
 */
router.patch(
  "/admin/tickets/:ticketId/assign",authorizeRoles("admin"),
  controller.assignTicket
);

/**
 * Update ticket status (OPEN / IN_PROGRESS / RESOLVED)
 * PATCH /api/support/admin/ticket/:ticketId/status
 */
router.patch(
  "/admin/tickets/:ticketId/status",
  validateObjectId(), authorizeRoles("admin"),
  controller.updateTicketStatus
);

/**
 * Close a ticket permanently (Admin)
 * PATCH /api/support/admin/ticket/:ticketId/close
 */
router.patch(
  "/admin/tickets/:ticketId/close",
  validateObjectId(),authorizeRoles("admin"),
  controller.closeTicket
);

/**
 * Get ticket analytics & statistics (Admin)
 * GET /api/support/admin/ticket/stats
 */
router.get("/admin/tickets/stats", authorizeRoles("admin"), controller.getTicketStats);

module.exports = router;
