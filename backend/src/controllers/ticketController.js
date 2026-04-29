const Ticket = require('../models/Ticket');
const User = require('../models/User');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');
const Notification = require('../models/Notification');
const { emitTicketCreated, emitTicketUpdated } = require('../services/socketService');
const path = require('path');

const VALID_CATEGORIES = [
  'Payments', 'Orders & Delivery', 'Returns & Refunds', 
  'Product Issues', 'Account Issues', 'Notifications & Communication', 
  'Subscription & Plans'
];

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
    const { status, priority, category, search, page = 1, limit = 1000, myTickets } = req.query;
    const query = {};
    if (req.user.role === 'customer' || myTickets === 'true') {
      query.userId = req.user.userId;
    }
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

    // === SPAM WORKFLOW: Admin Briefing ===
    // If admin is opening a spam ticket for the first time, Swift AI explains why it's spam
    if (req.user.role === 'admin' && ticket.status === 'spam' && !ticket.spamAdminReviewed) {
      ticket.messages.push({
        sender: 'bot',
        text: `🤖 **Swift AI Admin Briefing**\n\nThis ticket has been automatically flagged as **SPAM** because the customer's description did not match the uploaded image.\n\nAdmin, please review the description and attachment. Reply with **"keep spam"** to confirm the flag (which will ask the user for a better photo) or **"not spam"** to reinstate the ticket as legitimate.`,
        timestamp: new Date()
      });
      ticket.spamAdminReviewed = true;
      await ticket.save();
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { message, sender } = req.body;
    const photoFile = req.file;

    const ticket = await Ticket.findOne({ ticketId: req.params.id }).populate('userId', 'name email');
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // ─── Build and push the human message ───────────────────────────────────
    let aiVerification = null;
    let attachmentUrl = null;

    if (photoFile) {
      attachmentUrl = `/uploads/${photoFile.filename}`;
    }

    // Don't push an empty message when only a file was sent
    if (message || attachmentUrl) {
      const newMessage = {
        sender,
        text: message || (attachmentUrl ? 'Attached a photo for review.' : ''),
        attachmentUrl,
        aiVerification,
        timestamp: new Date()
      };
      ticket.messages.push(newMessage);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  ADMIN BRANCH
    // ════════════════════════════════════════════════════════════════════════
    if (sender === 'admin') {
      const lowerAdminMsg = (message || '').toLowerCase().trim();

      // ── SPAM WORKFLOW: Admin decides after Swift AI briefing ─────────────
      if (ticket.status === 'spam') {
        // Admin says "close", "yes close", "close ticket" → close it
        const wantsClose = ['close', 'yes close', 'close ticket', 'yes', 'confirm close'].some(k => lowerAdminMsg.includes(k));
        // Admin says "keep spam", "keep it spam", "spam" → prompt user to resubmit
        const keepSpam   = ['keep spam', 'keep it spam', 'mark spam', 'spam', 'keep as spam'].some(k => lowerAdminMsg.includes(k));
        // Admin says "not spam", "legitimate", "reopen", "open" → clear spam
        const notSpam    = ['not spam', 'legitimate', 'valid', 'reopen', 'open ticket', 'clear spam'].some(k => lowerAdminMsg.includes(k));

        // Check if Swift AI already asked admin to close (i.e. second resubmission also failed)
        const lastBotMsg = ticket.messages.filter(m => m.sender === 'bot').slice(-3).reverse().find(m => m.text.includes('close this ticket'));

        if (lastBotMsg && wantsClose) {
          // ── Close ticket ──
          ticket.status = 'closed';
          ticket.activityLog.push({ actionType: 'SPAM_CLOSED', message: 'Ticket closed by admin after repeated invalid image submissions.' });
          ticket.messages.push({
            sender: 'bot',
            text: `🔒 **Ticket Closed**\n\nThis ticket has been permanently closed by the admin due to repeated invalid image submissions. The customer will be notified.`,
            timestamp: new Date()
          });
          await ticket.save();
          await ticket.populate('userId', 'name email');
          emitTicketUpdated(ticket);
          return res.json(ticket);
        }

        if (keepSpam) {
          // ── Tell the user to send a valid photo ──
          ticket.messages.push({
            sender: 'bot',
            text: `⚠️ **Action Required**\n\nOur support team has reviewed your ticket and confirmed that the image you submitted does not match your reported issue.\n\nPlease upload a **new, genuine screenshot or photo** that clearly shows your actual problem. Once you resubmit a valid image, your ticket will be reopened and processed immediately.`,
            timestamp: new Date()
          });
          ticket.internalNotes.push({ text: `Admin confirmed spam status. Customer prompted to resubmit a valid image.`, timestamp: new Date() });
          await ticket.save();
          await ticket.populate('userId', 'name email');
          emitTicketUpdated(ticket);
          return res.json(ticket);
        }

        if (notSpam) {
          // ── Admin clears spam manually ──
          ticket.status = 'open';
          ticket.activityLog.push({ actionType: 'SPAM_CLEARED', message: 'Ticket spam flag removed by admin. Ticket reopened.' });
          ticket.messages.push({
            sender: 'bot',
            text: `✅ **Ticket Reinstated**\n\nAdmin has reviewed and cleared this ticket. Your issue has been verified and the ticket is now open. Our support team will assist you shortly.`,
            timestamp: new Date()
          });
          await Notification.create({ recipient: 'admin', title: 'Spam Cleared', description: `Admin cleared spam flag on ticket ${ticket.ticketId}.`, type: 'info', ticketId: ticket.ticketId });
          await ticket.save();
          await ticket.populate('userId', 'name email');
          emitTicketUpdated(ticket);
          return res.json(ticket);
        }

        // Admin typed something else on a spam ticket — just save and continue
        await ticket.save();
        await ticket.populate('userId', 'name email');
        emitTicketUpdated(ticket);
        return res.json(ticket);
      }

      // ── RESOLVED: Admin approves closure ────────────────────────────────
      if (ticket.status === 'resolved' && (lowerAdminMsg.includes('ok') || lowerAdminMsg.includes('close'))) {
        ticket.status = 'closed';
        ticket.messages.push({ sender: 'bot', text: 'Ticket has been successfully closed based on Admin approval.', timestamp: new Date() });
      }
      // ── Auto-escalation detection ────────────────────────────────────────
      else if (lowerAdminMsg.includes('forwarded to') && lowerAdminMsg.includes('within 24 hours')) {
        ticket.status = 'escalated';
        ticket.assignedTeam = ticket.category;
        const adminUser = req.user?.userId ? await User.findById(req.user.userId) : null;
        const adminName = adminUser?.name || 'Admin';
        ticket.activityLog.push({ actionType: 'ESCALATION', message: `Ticket escalated to ${ticket.assignedTeam.replace('_', ' ')} by ${adminName}` });
      }
      // ── Question to customer ─────────────────────────────────────────────
      else if (message && (message.endsWith('?') || lowerAdminMsg.includes('please let us know'))) {
        ticket.status = 'waiting_for_customer';
      }
      // ── Default admin reply ──────────────────────────────────────────────
      else {
        if (ticket.status !== 'closed' && ticket.status !== 'resolved') {
          ticket.status = 'in_progress';
        }
      }

      // Send email notification to user about admin reply
      if (ticket.userId?.email) {
        await emailService.sendTicketNotification(ticket.userId.email, ticket.ticketId, 'New reply from support');
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  USER BRANCH
    // ════════════════════════════════════════════════════════════════════════
    else if (sender === 'user') {
      const lowerMsg = (message || '').toLowerCase().trim();

      // ── SPAM RESUBMISSION: Customer sends a new photo ────────────────────
      if (ticket.status === 'spam' && photoFile) {
        const newPhotoUrl = `/uploads/${photoFile.filename}`;
        const fullNewImagePath = path.join(__dirname, '../../uploads', photoFile.filename);

        // Track resubmission in additionalPhotos
        ticket.additionalPhotos.push({ url: newPhotoUrl, uploadedAt: new Date() });
        ticket.spamResubmitCount = (ticket.spamResubmitCount || 0) + 1;

        // Update the attachmentUrl on the message we just pushed
        const lastMsg = ticket.messages[ticket.messages.length - 1];
        if (lastMsg && !lastMsg.attachmentUrl) lastMsg.attachmentUrl = newPhotoUrl;

        // Re-analyze via Groq
        console.log(`[Spam Resubmit] Re-analyzing image for ticket ${ticket.ticketId}, resubmit #${ticket.spamResubmitCount}`);
        const reAnalysis = await aiService.analyzeTicketWithImage(ticket.description || ticket.subject, fullNewImagePath);
        const isStillMismatch = reAnalysis.isSpam === true;

        if (!isStillMismatch) {
          // ── Photo now valid → reopen ticket ──
          ticket.status = 'open';
          ticket.priority = reAnalysis.priority || ticket.priority;
          ticket.aiAnalysis = { ...ticket.aiAnalysis, ...reAnalysis };
          ticket.activityLog.push({ actionType: 'SPAM_CLEARED', message: 'Ticket reopened: resubmitted photo verified and matches the issue description.' });
          ticket.messages.push({
            sender: 'bot',
            text: `✅ **Photo Verified!**\n\nYour new photo has been analyzed and matches your reported issue. This ticket has been reopened and our support team will now assist you shortly.`,
            aiVerification: 'Genuine',
            timestamp: new Date()
          });
          await Notification.create({ recipient: 'admin', title: 'Spam Ticket Reopened', description: `Ticket ${ticket.ticketId} was reopened after the customer resubmitted a valid photo.`, type: 'warning', ticketId: ticket.ticketId });
        } else if (ticket.spamResubmitCount >= 2) {
          // ── Second invalid resubmission → ask admin to close ──
          const mismatchReason = reAnalysis.isAI ? 'appears to be AI-generated' : 'still does not match the issue description';
          ticket.messages.push({
            sender: 'bot',
            text: `🚨 **Admin Notice — Close Ticket?**\n\nThe customer has now submitted **${ticket.spamResubmitCount} invalid images**. The latest photo ${mismatchReason}.\n\nDo you want to **close this ticket**? Reply **"close"** to confirm, or **"not spam"** if you believe this is a valid submission.`,
            timestamp: new Date()
          });
          ticket.internalNotes.push({ text: `Swift AI: Customer submitted ${ticket.spamResubmitCount} invalid images. Latest image ${mismatchReason}. Admin prompted to close.`, timestamp: new Date() });
          await Notification.create({ recipient: 'admin', title: 'Repeated Invalid Images', description: `Customer has submitted ${ticket.spamResubmitCount} invalid images on ticket ${ticket.ticketId}. Admin action required.`, type: 'warning', ticketId: ticket.ticketId });
        } else {
          // ── First invalid resubmission → tell user and notify admin ──
          const mismatchReason = reAnalysis.isAI ? 'appears to be AI-generated' : 'still does not match your described issue';
          ticket.messages.push({
            sender: 'bot',
            text: `⚠️ **Still Not Valid**\n\nThe new image you uploaded ${mismatchReason}. Please submit a clear, genuine screenshot or photo that directly shows the problem you described.\n\nIf you need help, our support team is monitoring this ticket.`,
            aiVerification: 'Mismatch',
            timestamp: new Date()
          });
          ticket.internalNotes.push({ text: `Swift AI: First resubmission also failed. Image ${mismatchReason}. Awaiting customer's next submission or admin action.`, timestamp: new Date() });
          await Notification.create({ recipient: 'admin', title: 'Invalid Resubmission', description: `Customer resubmitted an invalid image on spam ticket ${ticket.ticketId}.`, type: 'warning', ticketId: ticket.ticketId });
        }

        await ticket.save();
        await ticket.populate('userId', 'name email');
        emitTicketUpdated(ticket);
        return res.json(ticket);
      }

      // ── RESOLUTION CONFIRMATION ──────────────────────────────────────────
      const resolvedKeywords = ['it works', 'solved', 'fixed', 'it worked', 'thanks it worked', 'problem solved', 'thank you solved', 'resolved'];
      const isResolution = resolvedKeywords.some(k => lowerMsg.includes(k));

      const reopenKeywords = ['still not working', 'not fixed', 'problem persists', 'issue persists', 'still failing'];
      const isReopen = reopenKeywords.some(k => lowerMsg.includes(k));

      const lastBotMsg = ticket.messages.filter(m => m.sender === 'bot').pop()?.text || '';
      const wasAskingConfirmation = lastBotMsg.includes('should I mark this ticket as Resolved');

      if (wasAskingConfirmation && (lowerMsg.includes('yes') || lowerMsg.includes('yep') || lowerMsg.includes('ok') || lowerMsg.includes('confirm') || isResolution)) {
        ticket.status = 'resolved';
        ticket.resolvedAt = new Date();
        ticket.resolutionTime = Math.round((ticket.resolvedAt - ticket.createdAt) / (1000 * 60));
        await Notification.create({ recipient: 'admin', title: 'Resolution Approval Needed', description: `Customer confirmed resolution for ticket ${ticket.ticketId}. Please review and close.`, type: 'warning', ticketId: ticket.ticketId });
        ticket.messages.push({ sender: 'bot', text: 'Great! I have marked the ticket as Resolved. Admin, the customer has confirmed resolution. Please reply with "ok" or "close" to finalize and close the ticket.', timestamp: new Date() });
      } else if (isResolution) {
        ticket.messages.push({ sender: 'bot', text: 'Glad to hear it is working! Just to be sure, should I mark this ticket as Resolved? (Reply "Yes" to confirm)', timestamp: new Date() });
      } else if (isReopen && (ticket.status === 'resolved' || ticket.status === 'closed')) {
        ticket.status = 'reopened';
        ticket.priority = 'high';
        ticket.messages.push({ sender: 'bot', text: 'I am sorry to hear that the issue persists. I have reopened the ticket and escalated the priority for our team.', timestamp: new Date() });
      } else {
        if (ticket.status !== 'resolved' && ticket.status !== 'spam') {
          ticket.status = 'in_progress';
        }
        await Notification.create({ recipient: 'admin', title: 'New Message from User', description: `Customer ${ticket.userId?.name || 'Unknown'} replied to ticket ${ticket.ticketId}.`, type: 'info', ticketId: ticket.ticketId });
        if (message) {
          const lastMessages = ticket.messages.slice(-3).map(m => m.text).join(' ');
          const newAnalysis = await aiService.analyzeTicketWithAI(lastMessages);
          ticket.aiAnalysis = { ...ticket.aiAnalysis, ...newAnalysis };
        }
      }
    }

    await ticket.save();
    await ticket.populate('userId', 'name email');
    emitTicketUpdated(ticket);
    res.json(ticket);
  } catch (error) {
    console.error('[addMessage] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

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
    const topCategory = (totalTickets > 0 && topCategoryResult[0]?._id) ? topCategoryResult[0]._id : 'None';

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
    
    const isValid = classification.isValid !== false && 
                    classification.category !== 'OutOfScope' && 
                    VALID_CATEGORIES.includes(classification.category);
    
    res.json({
      category: classification.category || 'Product Issues',
      priority: classification.priority || 'Medium',
      keywords: classification.keywords || [],
      valid: isValid
    });
  } catch (error) {
    console.error('Classification error:', error);
    // Return default classification on error
    res.json({
      category: 'OutOfScope',
      priority: 'Low',
      keywords: [],
      valid: false
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
    const { title, description, category } = req.body;
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const photoFile = req.file;

    if (!title || !description) return res.status(400).json({ message: 'Title and description are required' });
    if (!photoFile) return res.status(400).json({ message: 'Photo is required' });
    if (!category) return res.status(400).json({ message: 'Category is required' });
    if (!userId) return res.status(401).json({ message: 'User authentication failed' });

    const ticketId = 'TKT-' + Date.now();
    const photoUrl = `/uploads/${photoFile.filename}`;
    const fullImagePath = path.join(__dirname, '../../uploads', photoFile.filename);

    // AI vision analysis (checks category, validity AND image-description match)
    const aiAnalysis = await aiService.analyzeTicketWithImage(description, fullImagePath);

    // Hard out-of-scope rejection (no ticket created)
    if (aiAnalysis.category === 'OutOfScope' || aiAnalysis.isValid === false || !VALID_CATEGORIES.includes(aiAnalysis.category)) {
      console.log('Ticket rejected: Out of Scope or Invalid');
      return res.status(400).json({
        message: 'This issue is outside our support scope. Please ensure your description is relevant to our supported categories.',
        category: aiAnalysis.category,
        reasoning: aiAnalysis.reasoning
      });
    }

    const normalizedCategory = aiAnalysis.category;
    const isImageMismatch = aiAnalysis.isSpam === true;

    // Build ticket — if image doesn't match description, mark as spam and wait for resubmission
    const ticketStatus = isImageMismatch ? 'spam' : 'open';
    const finalPriority = isImageMismatch ? 'low' : (aiAnalysis.priority || 'medium');

    const botSpamMessage = isImageMismatch
      ? `⚠️ **Invalid Image Detected**\n\nThe photo you uploaded appears to be ${aiAnalysis.isAI ? 'AI generated' : 'unrelated to your description'}: "*${description.slice(0, 100)}*".\n\nThis ticket has been flagged. Please reply with a **correct, genuine screenshot or photo** that clearly shows the issue. Once verified, your ticket will be reopened and our team will assist you.`
      : null;

    const internalNotesData = isImageMismatch ? [{
      text: `Swift AI: The uploaded image is ${aiAnalysis.isAI ? 'AI generated' : 'not matched to the description'}. Ticket marked as spam. Customer prompted to resubmit.`,
      timestamp: new Date()
    }] : [];

    const initialMessages = [
      { 
        sender: 'user', 
        text: description, 
        attachmentUrl: photoUrl, 
        aiVerification: isImageMismatch ? 'Mismatch' : (aiAnalysis.isAI ? 'AI Generated' : 'Genuine'),
        timestamp: new Date() 
      }
    ];
    if (botSpamMessage) {
      initialMessages.push({ sender: 'bot', text: botSpamMessage, timestamp: new Date() });
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
      internalNotes: internalNotesData,
      messages: initialMessages,
      activityLog: isImageMismatch ? [{
        actionType: 'SPAM_DETECTED',
        message: 'Ticket flagged as spam: uploaded image does not match the issue description.'
      }] : []
    };

    const ticket = new Ticket(ticketData);
    await ticket.save();
    await ticket.populate('userId', 'name email');

    // Notify admin only for real tickets, not spam
    if (!isImageMismatch) {
      await Notification.create({
        recipient: 'admin',
        title: 'New Ticket Created',
        description: `A new ticket (${ticket.ticketId}) was created by ${ticket.userId.name}.`,
        type: 'info',
        ticketId: ticket.ticketId
      });
      emitTicketCreated(ticket);
    } else {
      // Still emit so admin can see spam tickets in real-time
      emitTicketCreated(ticket);
    }

    res.status(201).json({
      message: isImageMismatch ? 'Ticket flagged: image does not match description' : 'Ticket created successfully',
      ticket,
      isSpam: isImageMismatch
    });
  } catch (error) {
    console.error('=== CREATE TICKET ERROR ===', error.message);
    res.status(500).json({ message: 'Failed to create ticket', error: error.message });
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
    const { adminId, internalNote, category, status } = req.body;
    const ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    if (adminId) ticket.assignedTo = adminId;
    if (category) ticket.category = category;
    if (status) ticket.status = status;
    
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

// 4. AI Solution Suggestions Endpoint — generates dynamic, ticket-specific suggestions via Groq
exports.generateSuggestions = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    console.log('[Suggestions] Generating AI suggestions for ticket:', ticket.ticketId);

    let suggestedReply = null;
    let suggestedSolutions = null;

    try {
      const result = await aiService.generateAdminSuggestions(ticket);
      if (result) {
        suggestedReply = result.suggestedReply || null;
        suggestedSolutions = Array.isArray(result.suggestedSolutions) ? result.suggestedSolutions : null;
      }
    } catch (aiErr) {
      console.warn('[Suggestions] Groq call failed, will return null so frontend uses fallback:', aiErr.message);
    }

    res.json({ suggestedReply, suggestedSolutions });
  } catch (error) {
    console.error('[Suggestions] Error:', error.message);
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
    ticket.assignedTeam = ticket.category;
    
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