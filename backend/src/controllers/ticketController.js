const Ticket = require('../models/Ticket');
const User = require('../models/User');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');
const Notification = require('../models/Notification');
const { emitTicketCreated, emitTicketUpdated } = require('../services/socketService');
const path = require('path');

const generateTicketId = () => 'TKT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

exports.createTicket = async (req, res) => {
  try {
    const { messages = [], userId } = req.body;
    const ticketText = messages.map((message) => message?.text).filter(Boolean).join(' ').trim();
    const firstUserMessage = messages.find((message) => message?.sender === 'user' && message?.text)?.text || ticketText;
    const aiAnalysis = await aiService.analyzeTicketWithAI(ticketText || firstUserMessage);

    if (aiAnalysis.category === 'OutOfScope' || aiAnalysis.isValid === false) {
      return res.status(400).json({ 
        error: 'Ticket cannot be raised. The issue described is either out of scope, irrelevant, or does not fall into our supported categories.' 
      });
    }

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
        suggestedReply: aiAnalysis.suggestedReply,
        suggestedSolutions: aiAnalysis.suggestedSolutions
      }
    });
    await ticket.save();
    await ticket.populate('userId', 'name email');
    
    // Notify Admin of new ticket
    await Notification.create({
      recipient: 'admin',
      title: 'New Ticket Created',
      description: `A new ticket (${ticket.ticketId}) was created by ${ticket.userId.name}.`,
      type: 'info',
      ticketId: ticket.ticketId
    });

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
    const photoFile = req.file;
    
    const ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    let attachmentUrl = null;
    if (photoFile) {
      attachmentUrl = `/uploads/${photoFile.filename}`;
    }

    const newMessage = { 
      sender, 
      text: message || (photoFile ? 'Attached a photo' : ''), 
      attachmentUrl,
      timestamp: new Date() 
    };
    
    ticket.messages.push(newMessage);

    if (sender === 'user') {
      const lowerMsg = (message || '').toLowerCase().trim();
      
      // 6. Resolution Logic: Detection of "Solved" keywords
      const resolvedKeywords = ['it works', 'solved', 'fixed', 'it worked', 'thanks it worked', 'problem solved', 'thank you solved', 'resolved'];
      const isResolution = resolvedKeywords.some(k => lowerMsg.includes(k));
      
      // 10. Reopen Logic: Detection of "Still not working"
      const reopenKeywords = ['still not working', 'not fixed', 'problem persists', 'issue persists', 'still failing'];
      const isReopen = reopenKeywords.some(k => lowerMsg.includes(k));
      
      const lastBotMsg = ticket.messages.filter(m => m.sender === 'bot').pop()?.text || '';
      const wasAskingConfirmation = lastBotMsg.includes('should I mark this ticket as Resolved');
      
      console.log('=== DEBUG RESOLUTION ===');
      console.log('lowerMsg:', lowerMsg);
      console.log('isResolution:', isResolution);
      console.log('lastBotMsg:', lastBotMsg);
      console.log('wasAskingConfirmation:', wasAskingConfirmation);
      console.log('========================');

      if (wasAskingConfirmation && (lowerMsg.includes('yes') || lowerMsg.includes('yep') || lowerMsg.includes('ok') || lowerMsg.includes('confirm') || isResolution)) {
        ticket.status = 'resolved';
        ticket.resolvedAt = new Date();
        ticket.resolutionTime = Math.round((ticket.resolvedAt - ticket.createdAt) / (1000 * 60));
        // Notify Admin of resolution confirmation request
        await Notification.create({
          recipient: 'admin',
          title: 'Resolution Approval Needed',
          description: `Customer confirmed resolution for ticket ${ticket.ticketId}. Please review and close.`,
          type: 'warning',
          ticketId: ticket.ticketId
        });

        ticket.messages.push({ 
          sender: 'bot', 
          text: 'Great! I have marked the ticket as Resolved. Admin, the customer has confirmed resolution. Please reply with "ok" or "close" to finalize and close the ticket.', 
          timestamp: new Date() 
        });
      } else if (isResolution) {
        ticket.messages.push({ 
          sender: 'bot', 
          text: 'Glad to hear it is working! Just to be sure, should I mark this ticket as Resolved? (Reply "Yes" to confirm)', 
          timestamp: new Date() 
        });
      } else if (isReopen && (ticket.status === 'resolved' || ticket.status === 'closed')) {
        ticket.status = 'reopened';
        ticket.priority = 'high'; // Increase priority on reopen
        ticket.messages.push({ sender: 'bot', text: 'I am sorry to hear that the issue persists. I have reopened the ticket and escalated the priority for our team.', timestamp: new Date() });
      } else {
        // 5. Conversation Workflow: User replies -> In Progress
        if (ticket.status !== 'resolved') {
          ticket.status = 'in_progress';
        }
        
        // Notify Admin of new message
        await Notification.create({
          recipient: 'admin',
          title: 'New Message from User',
          description: `Customer ${ticket.userId.name} replied to ticket ${ticket.ticketId}.`,
          type: 'info',
          ticketId: ticket.ticketId
        });

        // Update AI insights on the fly if text is provided
        if (message) {
          const lastMessages = ticket.messages.slice(-3).map(m => m.text).join(' ');
          const newAnalysis = await aiService.analyzeTicketWithAI(lastMessages);
          ticket.aiAnalysis = { ...ticket.aiAnalysis, ...newAnalysis };
        }
      }
    } else if (sender === 'admin') {
      const lowerAdminMsg = (message || '').toLowerCase();
      
      // 1. Admin Approval for closure
      if (ticket.status === 'resolved' && (lowerAdminMsg.includes('ok') || lowerAdminMsg.includes('close'))) {
        ticket.status = 'closed';
        ticket.messages.push({
          sender: 'bot',
          text: 'Ticket has been successfully closed based on Admin approval.',
          timestamp: new Date()
        });
      }
      // 2. Auto-escalation detection
      else if (lowerAdminMsg.includes('forwarded to') && lowerAdminMsg.includes('within 24 hours')) {
        ticket.status = 'escalated';
        ticket.assignedTeam = ticket.category === 'billing' ? 'billing_team' : ticket.category === 'technical' ? 'tech_support' : ticket.category === 'account' ? 'customer_success' : 'tech_support';
        
        let adminName = 'Admin';
        if (req.user && req.user.userId) {
          const User = require('../models/User'); // Ensure User model is available
          const adminUser = await User.findById(req.user.userId);
          if (adminUser) adminName = adminUser.name;
        }

        ticket.activityLog.push({
          actionType: 'ESCALATION',
          message: `Ticket escalated to ${ticket.assignedTeam.replace('_', ' ')} by ${adminName}`
        });
      } 
      // 3. Question detection
      else if (message && (message.endsWith('?') || lowerAdminMsg.includes('please let us know'))) {
        ticket.status = 'waiting_for_customer';
      } 
      // 4. Default reply
      else {
        // Only set to in_progress if not already closed
        if (ticket.status !== 'closed' && ticket.status !== 'resolved') {
          ticket.status = 'in_progress';
        }
      }
    }

    await ticket.save();
    if (sender === 'admin') {
      const user = await User.findById(ticket.userId);
      if (user && user.email) {
        await emailService.sendTicketNotification(user.email, ticket.ticketId, `New reply from support`);
      }
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
        
        // Notify in chat for admin approval
        ticket.messages.push({
          sender: 'bot',
          text: 'The customer (or system) has marked this ticket as Resolved. Admin, please review and reply with "ok" or "close" to finalize.',
          timestamp: new Date()
        });

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

exports.reopenTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.id }).populate('userId', 'name email');
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    // Ensure the user owns the ticket (unless admin)
    if (req.user.role !== 'admin' && ticket.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to reopen this ticket' });
    }

    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      ticket.status = 'reopened';
      ticket.priority = 'high'; // Escalate priority for reopened tickets
      ticket.activityLog.push({
        actionType: 'REOPENED',
        message: 'Ticket reopened by customer and assigned high priority.'
      });
      ticket.messages.push({
        sender: 'bot',
        text: 'This ticket has been reopened. A support agent has been notified and will prioritize your case.',
        timestamp: new Date()
      });
      await ticket.save();
      emitTicketUpdated(ticket);
    }
    
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.requestResolution = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    ticket.messages.push({
      sender: 'bot',
      text: 'Glad to hear it is working! Just to be sure, should I mark this ticket as Resolved? (Reply "Yes" to confirm)',
      timestamp: new Date()
    });
    
    await ticket.save();
    emitTicketUpdated(ticket);
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    // Ensure only the ticket owner can submit feedback
    if (ticket.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    ticket.feedback = {
      rating,
      comment,
      submittedAt: new Date()
    };
    
    await ticket.save();
    emitTicketUpdated(ticket);
    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const ticketsToday = await Ticket.countDocuments({ createdAt: { $gte: startOfDay } });
    
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: { $in: ['open', 'in_progress', 'reopened', 'escalated', 'waiting_for_customer'] } });
    const resolvedTickets = await Ticket.countDocuments({ status: 'resolved' });
    const closedTickets = await Ticket.countDocuments({ status: 'closed' });
    const negativeTickets = await Ticket.countDocuments({ sentiment: 'negative' });
    const highPriorityTickets = await Ticket.countDocuments({ priority: { $in: ['high', 'urgent'] } });

    const sentimentDist = await Ticket.aggregate([
      { $group: { _id: { $ifNull: ['$sentiment', 'neutral'] }, count: { $sum: 1 } } }
    ]);
    
    const categoryDist = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const avgResolution = await Ticket.aggregate([
      { $match: { status: 'resolved', resolutionTime: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$resolutionTime' } } }
    ]);

    const trends = await Ticket.aggregate([
      { $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, 
          count: { $sum: 1 } 
      } },
      { $sort: { '_id': 1 } },
      { $limit: 7 }
    ]);
    
    const topCategoryResult = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const topCategory = topCategoryResult[0]?._id || 'Technical Issues';

    const negativeCount = await Ticket.countDocuments({ sentiment: 'negative' });
    const negativeRatio = totalTickets > 0 ? negativeCount / totalTickets : 0;
    let sentimentReport = "Overall sentiment is balanced.";
    if (negativeRatio > 0.4) {
      sentimentReport = "High frustration detected: There is a significant increase in negative sentiment from customers today.";
    } else if (negativeRatio > 0.2) {
      sentimentReport = "Moderate negativity: Some customers are showing signs of frustration, keep an eye on technical issues.";
    }

    const ratingTrends = await Ticket.aggregate([
      { $match: { 'feedback.rating': { $exists: true } } },
      { $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$feedback.submittedAt' } }, 
          avgRating: { $avg: '$feedback.rating' } 
      } },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      totalTickets, 
      openTickets, 
      resolvedTickets, 
      closedTickets, 
      negativeTickets, 
      highPriorityTickets,
      ticketsToday,
      topCategory,
      sentimentReport,
      sentimentDistribution: sentimentDist, 
      categoryDistribution: categoryDist,
      averageResolutionTime: avgResolution[0]?.avg || 0, 
      trends,
      ratingTrends
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
    const classification = await aiService.analyzeTicketWithAI(text);
    
    res.json({
      category: classification.category || 'Product Issues',
      priority: classification.priority || 'Medium',
      keywords: classification.keywords || []
    });
  } catch (error) {
    console.error('Classification error:', error);
    // Return default classification on error
    res.json({
      category: 'Product Issues',
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

    // Use AI categorized domain directly
    const normalizedCategory = aiAnalysis.category || category || 'Technical Issues';
    console.log('Category Selection:', normalizedCategory);

    const ticketStatus = aiAnalysis.isSpam ? 'spam' : 'open';
    const finalPriority = aiAnalysis.isSpam ? 'low' : (aiAnalysis.priority || 'medium');
    
    // Check for Validity/Scope per Prompt requirements
    if (aiAnalysis.category === 'OutOfScope' || aiAnalysis.isValid === false) {
      console.log('Ticket rejected: Out of Scope or Invalid');
      return res.status(400).json({ 
        message: 'This issue is outside our support scope.',
        category: aiAnalysis.category,
        reasoning: aiAnalysis.reasoning
      });
    }

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
    const { adminId, internalNote } = req.body;
    const ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    if (adminId) ticket.assignedTo = adminId;
    
    if (internalNote) {
      if (!ticket.internalNotes) ticket.internalNotes = [];
      ticket.internalNotes.push({ text: internalNote, timestamp: new Date() });
      ticket.activityLog.push({
        actionType: 'NOTE_ADDED',
        message: 'Internal note added by staff'
      });
    }
    
    await ticket.save();
    emitTicketUpdated(ticket);
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. AI Solution Suggestions Endpoint
exports.generateSuggestions = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const text = `Ticket Subject: ${ticket.subject}\nDescription: ${ticket.description}`;
    const imagePath = ticket.photoUrl ? path.join(__dirname, '../../../uploads', path.basename(ticket.photoUrl)) : null;

    console.log('Generating AI suggestions for ticket:', ticket.ticketId);
    const analysis = await aiService.analyzeTicketWithImage(text, imagePath);

    res.json({
      suggestions: analysis.suggestedSolutions || [
        "Ask customer for clear screenshots of the error.",
        "Check if the account has active subscription.",
        "Request the customer to clear browser cache.",
        "Escalate to technical team if issue persists."
      ]
    });
  } catch (error) {
    console.error('Suggestion generation failed:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};

// 8. Escalation System Endpoint
exports.escalateTicket = async (req, res) => {
  try {
    const { team, reason } = req.body;
    const ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    ticket.status = 'escalated';
    ticket.assignedTeam = team || 'tech_support';
    
    // Add activity log
    ticket.activityLog.push({
      actionType: 'ESCALATION',
      message: `Ticket escalated to ${team || 'relevant team'}. Reason: ${reason || 'Issue persists.'}`
    });

    // Add message to user
    ticket.messages.push({
      sender: 'bot',
      text: 'This issue has been escalated. Expected resolution: 24 hours.',
      timestamp: new Date()
    });

    await ticket.save();
    emitTicketUpdated(ticket);
    res.json({ message: 'Ticket escalated successfully', ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};