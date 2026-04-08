const Ticket = require('../models/Ticket');
const User = require('../models/User');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');

const generateTicketId = () => 'TKT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

exports.createTicket = async (req, res) => {
  try {
    const { messages, userId } = req.body;
    const firstMessage = messages[0].text;
    const aiAnalysis = await aiService.analyzeTicketWithAI(firstMessage);
    const ticket = new Ticket({
      ticketId: generateTicketId(),
      userId: userId || req.user.userId,
      messages,
      priority: aiAnalysis.priority,
      sentiment: aiAnalysis.sentiment,
      category: aiAnalysis.category,
      aiAnalysis: {
        sentimentScore: aiAnalysis.sentimentScore,
        priorityScore: aiAnalysis.priorityScore,
        keywords: aiAnalysis.keywords,
        reasoning: aiAnalysis.reasoning,
        suggestedReply: aiAnalysis.suggestedReply
      }
    });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const { status, priority, category, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (req.user.role === 'customer') query.userId = req.user.userId;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) query.$or = [{ ticketId: { $regex: search, $options: 'i' } }, { 'messages.text': { $regex: search, $options: 'i' } }];
    const tickets = await Ticket.find(query).sort({ priority: 1, createdAt: -1 }).skip((page-1)*limit).limit(parseInt(limit)).populate('userId', 'name email');
    const total = await Ticket.countDocuments(query);
    res.json({ tickets, total, page: parseInt(page), totalPages: Math.ceil(total/limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.id }).populate('userId', 'name email');
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (req.user.role === 'customer' && ticket.userId._id.toString() !== req.user.userId) return res.status(403).json({ error: 'Access denied' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { message, sender } = req.body;
    const ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    ticket.messages.push({ sender, text: message, timestamp: new Date() });
    if (sender === 'user' && ticket.status === 'resolved') ticket.status = 'open';
    if (sender === 'user') {
      const lastMessages = ticket.messages.slice(-3).map(m => m.text).join(' ');
      const newAnalysis = await aiService.analyzeTicketWithAI(lastMessages);
      if (newAnalysis.sentiment === 'negative' && ticket.priority !== 'high') ticket.priority = 'high';
      ticket.aiAnalysis = { ...ticket.aiAnalysis, ...newAnalysis };
    }
    await ticket.save();
    if (sender === 'admin') {
      const user = await User.findById(ticket.userId);
      await emailService.sendTicketNotification(user.email, ticket.ticketId, `New reply from support`);
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    ticket.status = status;
    if (status === 'resolved') {
      ticket.resolvedAt = new Date();
      ticket.resolutionTime = Math.round((ticket.resolvedAt - ticket.createdAt) / (1000 * 60));
    }
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: { $ne: 'resolved' } });
    const resolvedTickets = await Ticket.countDocuments({ status: 'resolved' });
    const negativeTickets = await Ticket.countDocuments({ sentiment: 'negative' });
    const highPriorityTickets = await Ticket.countDocuments({ priority: 'high', status: { $ne: 'resolved' } });
    const sentimentDist = await Ticket.aggregate([{ $group: { _id: '$sentiment', count: { $sum: 1 } } }]);
    const categoryDist = await Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    const avgResolution = await Ticket.aggregate([{ $match: { resolutionTime: { $exists: true } } }, { $group: { _id: null, avg: { $avg: '$resolutionTime' } } }]);
    const trends = await Ticket.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ]);
    res.json({
      totalTickets, openTickets, resolvedTickets, negativeTickets, highPriorityTickets,
      sentimentDistribution: sentimentDist, categoryDistribution: categoryDist,
      averageResolutionTime: avgResolution[0]?.avg || 0, trends
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};