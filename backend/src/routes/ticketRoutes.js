const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `ticket-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// New routes for ticket creation flow
router.post('/classify', authMiddleware, upload.single('photo'), ticketController.classifyTicket);
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
