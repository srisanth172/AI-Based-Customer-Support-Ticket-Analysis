const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const multer = require('multer');

const { storage } = require('../config/cloudinary');

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// New routes for ticket creation flow
router.post('/classify', authMiddleware, ticketController.classifyTicket);
router.post('/check-duplicates', authMiddleware, ticketController.checkDuplicates);
router.post('/create', authMiddleware, upload.single('photo'), ticketController.createTicketWithPhoto);

// Existing routes
router.post('/', authMiddleware, ticketController.createTicket);
router.get('/', authMiddleware, ticketController.getTickets);
router.get('/stats', authMiddleware, adminMiddleware, ticketController.getDashboardStats);
router.get('/export', authMiddleware, adminMiddleware, ticketController.exportTicketsCSV);
router.post('/bulk', authMiddleware, adminMiddleware, ticketController.bulkUpdateTickets);
router.get('/:id', authMiddleware, ticketController.getTicketById);
router.post('/copilot', authMiddleware, adminMiddleware, ticketController.talkToCopilot);
router.post('/chatbot', authMiddleware, ticketController.customerChatbot);
router.post('/:id/messages', authMiddleware, upload.single('photo'), ticketController.addMessage);
router.post('/:id/suggestions', authMiddleware, adminMiddleware, ticketController.generateSuggestions);
router.post('/:id/request-resolution', authMiddleware, ticketController.requestResolution);
router.post('/:id/escalate', authMiddleware, adminMiddleware, ticketController.escalateTicket);
router.patch('/:id/reopen', authMiddleware, ticketController.reopenTicket);
router.patch('/:id/status', authMiddleware, adminMiddleware, ticketController.updateTicketStatus);
router.patch('/:id/admin', authMiddleware, adminMiddleware, ticketController.updateTicketAdmin);
router.post('/:id/feedback', authMiddleware, ticketController.submitFeedback);

module.exports = router;
