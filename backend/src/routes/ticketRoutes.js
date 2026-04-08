const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, ticketController.createTicket);
router.get('/', authMiddleware, ticketController.getTickets);
router.get('/stats', authMiddleware, adminMiddleware, ticketController.getDashboardStats);
router.get('/:id', authMiddleware, ticketController.getTicketById);
router.post('/:id/messages', authMiddleware, ticketController.addMessage);
router.patch('/:id/status', authMiddleware, adminMiddleware, ticketController.updateTicketStatus);

module.exports = router;
