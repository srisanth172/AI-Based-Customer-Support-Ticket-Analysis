const Ticket = require('../models/Ticket');
const User = require('../models/User');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');
const { emitTicketCreated, emitTicketUpdated } = require('../services/socketService');
const path = require('path');

const generateTicketId = () => 'TKT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

exports.createTicket = async (req, res) => {
  try {
    const { messages = [], userId } = req.body;
    const ticketText = messages.map((message) => message?.text).filter(Boolean).join(' ').trim();
    const firstUserMessage = messages.find((message) => message?.sender === 'user' && message?.text)?.text || ticketText;
    const aiAnalysis = await aiService.analyzeTicketWithAI(ticketText || firstUserMessage);
    const ticket = new Ticket({
      ticketId: generateTicketId(),
      userId: userId || req.user.userId,
      subject: firstUserMessage?.slice(0, 120) || 'Support request',
      description: ticketText || firstUserMessage || 'Support request',
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
    await ticket.populate('userId', 'name email');
    emitTicketCreated(ticket);
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
    let sortOrder = {};
    if (req.user.role === 'admin') {
      // Sort by priorityScore (desc), then sentiment (negative first), then createdAt (desc)
      sortOrder = {
        'aiAnalysis.priorityScore': -1,
        sentiment: 1, // negative < neutral < positive (alphabetical)
        createdAt: -1
      };
    } else {
      // For customers, keep original sort
      sortOrder = { priority: 1, createdAt: -1 };
    }
    const tickets = await Ticket.find(query).sort(sortOrder).skip((page-1)*limit).limit(parseInt(limit)).populate('userId', 'name email');
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
    await ticket.populate('userId', 'name email');
    emitTicketUpdated(ticket);
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findOne({ ticketId: req.params.id }).populate('userId', 'name email');
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    // Only process changes if status is actually changing
    if (ticket.status !== status) {
      ticket.status = status;
      if (status === 'resolved') {
        ticket.resolvedAt = new Date();
        ticket.resolutionTime = Math.round((ticket.resolvedAt - ticket.createdAt) / (1000 * 60));
        
        // Send resolution email
        if (ticket.userId && ticket.userId.email) {
          await emailService.sendTicketNotification(
            ticket.userId.email,
            ticket.ticketId,
            'Your ticket has been resolved!'
          );
        }
      }
      await ticket.save();
      emitTicketUpdated(ticket);
    }
    
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

// New endpoint: Classify ticket using AI
exports.classifyTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    const text = `${title} ${description}`;
    
    // Use AI service to classify
    const classification = await aiService.classifyTicket(text);
    
    res.json({
      category: classification.category || 'General Inquiry',
      priority: classification.priority || 'Medium',
      keywords: classification.keywords || []
    });
  } catch (error) {
    console.error('Classification error:', error);
    // Return default classification on error
    res.json({
      category: 'General Inquiry',
      priority: 'Medium',
      keywords: []
    });
  }
};

// New endpoint: Check for duplicate tickets
exports.checkDuplicates = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const userId = req.user.userId;
    const titleQuery = title?.substring(0, 20) || '';
    const descriptionQuery = description?.substring(0, 30) || '';
    
    // Find similar tickets by the same user
    const similarTickets = await Ticket.find({
      userId,
      $or: [
        { subject: { $regex: titleQuery, $options: 'i' } },
        { description: { $regex: descriptionQuery, $options: 'i' } }
      ],
      status: { $ne: 'resolved' } // Only check unresolved tickets
    }).select('_id ticketId subject status description category');
    
    res.json({
      hasDuplicate: similarTickets.length > 0,
      similar: similarTickets.slice(0, 3) // Return max 3 similar tickets
    });
  } catch (error) {
    console.error('Duplicate check error:', error);
    res.json({ hasDuplicate: false, similar: [] });
  }
};

// Updated endpoint: Create ticket with photo upload
exports.createTicketWithPhoto = async (req, res) => {
  try {
    console.log('=== CREATE TICKET REQUEST ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('User object:', req.user);
    console.log('User properties:', Object.keys(req.user || {}));
    
    const { title, description, category } = req.body;
    
    // Try different property names for userId
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    console.log('Extracted userId:', userId);
    
    const photoFile = req.file;
    
    if (!title || !description) {
      console.log('Missing title or description');
      return res.status(400).json({ message: 'Title and description are required' });
    }
    
    if (!photoFile) {
      console.log('No photo file');
      return res.status(400).json({ message: 'Photo is required' });
    }

    if (!category) {
      console.log('No category');
      return res.status(400).json({ message: 'Category is required' });
    }

    if (!userId) {
      console.log('No userId extracted');
      return res.status(401).json({ message: 'User authentication failed' });
    }
    
    // Generate unique ticket ID
    const ticketId = 'TKT-' + Date.now();
    
    // Store photo path (in production, use cloud storage like S3)
    const photoUrl = `/uploads/${photoFile.filename}`;
    const fullImagePath = path.join(__dirname, '../../../uploads', photoFile.filename);

    // Call AI vision service
    const aiAnalysis = await aiService.analyzeTicketWithImage(description, fullImagePath);

    // Normalize category to match schema enum
    const categoryMap = {
      'Billing': 'billing',
      'Technical Issue': 'technical',
      'Account Issue': 'account',
      'General Inquiry': 'general',
      'Bug Report': 'technical'
    };
    
    const normalizedCategory = categoryMap[category] || categoryMap[aiAnalysis.category] || aiAnalysis.category || 'general';
    console.log('Category:', category, '-> Normalized:', normalizedCategory);

    const ticketStatus = aiAnalysis.isSpam ? 'spam' : 'open';
    const finalPriority = aiAnalysis.isSpam ? 'low' : (aiAnalysis.priority || 'medium');
    
    const ticketData = {
      ticketId,
      userId,
      subject: title,
      description,
      title,
      photoUrl,
      status: ticketStatus,
      category: normalizedCategory,
      priority: finalPriority,
      sentiment: aiAnalysis.sentiment || 'neutral',
      aiAnalysis,
      messages: [
        {
          sender: 'user',
          text: description,
          attachmentUrl: photoUrl,
          timestamp: new Date()
        }
      ]
    };
    
    console.log('Creating ticket with data:', ticketData);
    
    const ticket = new Ticket(ticketData);
    await ticket.save();
    
    console.log('Ticket saved successfully:', ticket._id);
    
    // Populate user info
    await ticket.populate('userId', 'name email');
    emitTicketCreated(ticket);
    
    res.status(201).json({
      message: 'Ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('=== CREATE TICKET ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    res.status(500).json({ 
      message: 'Failed to create ticket', 
      error: error.message,
      details: error.stack
    });
  }
};

exports.customerChatbot = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    
    // Default reply in case AI service is down
    let reply = "Hello! I am your AI assistant. How can I help you today?";
    
    // Convert conversationHistory to format expected by AI if it exists
    const messages = conversationHistory || [];
    messages.push({ role: 'user', content: message });
    
    // Try to use aiService, else fallback to simple logic
    try {
      reply = await aiService.chatWithCustomer(messages);
    } catch (aiError) {
      console.warn("AI service failed, using fallback chatbot logic", aiError);
      if (message.toLowerCase().includes('ticket') || message.toLowerCase().includes('issue')) {
        reply = "I understand you have an issue. Would you like me to raise a support ticket for this?";
      } else if (message.toLowerCase().includes('yes')) {
        reply = "[RAISE_TICKET] I am raising a ticket for you right now.";
      } else {
        reply = "Can you please describe your problem in more detail?";
      }
    }
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mock implementations for admin features to restore server stability
exports.exportTicketsCSV = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('userId', 'name email');
    let csv = 'TicketID,Subject,Status,Priority,Category,Customer,Email\n';
    tickets.forEach(t => {
      csv += `${t.ticketId},"${t.subject || t.title}","${t.status}","${t.priority}","${t.category}","${t.userId?.name}","${t.userId?.email}"\n`;
    });
    res.header('Content-Type', 'text/csv');
    res.attachment('tickets-export.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.bulkUpdateTickets = async (req, res) => {
  try {
    const { ticketIds, status, priority } = req.body;
    const update = {};
    if (status) update.status = status;
    if (priority) update.priority = priority;
    
    await Ticket.updateMany({ ticketId: { $in: ticketIds } }, { $set: update });
    res.json({ message: 'Bulk update successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.talkToCopilot = async (req, res) => {
  try {
    const { message, ticketId } = req.body;
    let context = "";
    if (ticketId) {
      const ticket = await Ticket.findOne({ ticketId });
      if (ticket) context = `Context: Ticket ${ticketId}, status ${ticket.status}, priority ${ticket.priority}. Customer description: ${ticket.description || ticket.subject}`;
    }
    
    const reply = await aiService.chatWithCopilot(message, context);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Copilot unavailable' });
  }
};

exports.updateTicketAdmin = async (req, res) => {
  try {
    const { adminId } = req.body;
    const ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    ticket.assignedTo = adminId;
    await ticket.save();
    emitTicketUpdated(ticket);
    res.json({ message: 'Admin assigned successfully', ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};