const express = require('express')
const { protect } = require('../middlewares/auth.middleware')
const { authorizeRoles } = require('../middlewares/role.middleware')
const {
  startChat,
  sendMessage,
  getUserChats,
  getChatById,
  closeChat,
  getAllChats,
  assignChatToAgent,
  addAdminMessage,
  resolvChat,
  createTicket,
  getUserTickets,
  getTicketById,
  addTicketResponse,
  updateTicketStatus,
  rateTicket,
  getAllTickets,
  assignTicket,
  getTicketStats,
} = require('../controllers/support.controller')

const router = express.Router()

// ===== USER ROUTES =====
router.use(protect)

// Chat routes
router.post('/chat/start', startChat)
router.get('/chat', getUserChats)
router.get('/chat/:chatId', getChatById)
router.post('/chat/:chatId/message', sendMessage)
router.patch('/chat/:chatId/close', closeChat)

// Ticket routes
router.post('/ticket', createTicket)
router.get('/ticket', getUserTickets)
router.get('/ticket/:ticketId', getTicketById)
router.post('/ticket/:ticketId/response', addTicketResponse)
router.patch('/ticket/:ticketId/rate', rateTicket)

// ===== ADMIN ROUTES =====
router.use(authorizeRoles('admin'))

// Admin chat management
router.get('/admin/chats', getAllChats)
router.patch('/admin/chat/:chatId/assign', assignChatToAgent)
router.post('/admin/chat/:chatId/message', addAdminMessage)
router.patch('/admin/chat/:chatId/resolve', resolvChat)

// Admin ticket management
router.get('/admin/tickets', getAllTickets)
router.get('/admin/ticket/stats', getTicketStats)
router.patch('/admin/ticket/:ticketId/assign', assignTicket)
router.patch('/admin/ticket/:ticketId/status', updateTicketStatus)

module.exports = router
