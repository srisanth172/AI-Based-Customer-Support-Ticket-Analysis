const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { authMiddleware } = require('../middleware/auth');
const Ticket = require('../models/Ticket');

router.post('/interact', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = req.user.userId;

    // Fetch user's active tickets for context
    const userTickets = await Ticket.find({ userId, status: { $ne: 'resolved' } })
      .select('ticketId status priority category messages')
      .sort({ createdAt: -1 })
      .limit(3);

    const context = userTickets.map(t => {
      const latestMsg = t.messages[t.messages.length - 1]?.text || '';
      return `TicketID: ${t.ticketId}, Status: ${t.status}, Category: ${t.category}, Latest: ${latestMsg}`;
    }).join('\n');

    const aiResponse = await aiService.handleCustomerChatInteraction(messages, context);
    
    res.json(aiResponse || { text: "I'm having trouble connecting right now. Please try again or create a ticket directly.", action: "none" });
  } catch (error) {
    console.error('Chat interaction error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
