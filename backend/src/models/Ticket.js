const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'bot', 'admin'], required: true },
  text: { type: String, required: true },
  files: [{ name: String, url: String, fileType: String }],
  timestamp: { type: Date, default: Date.now },
});

const internalNoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const activityLogSchema = new mongoose.Schema({
  actionType: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String },
  description: { type: String },
  photoUrl: { type: String },
  status: { type: String, enum: ['open', 'in_progress', 'pending', 'resolved', 'escalated', 'spam'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
  category: { type: String, enum: ['billing', 'technical', 'delivery', 'account', 'product', 'general'], default: 'general' },
  assignedTeam: { type: String, enum: ['unassigned', 'billing_team', 'tech_support', 'customer_success', 'shipping_dept'], default: 'unassigned' },
  eta: { type: Date },
  messages: [messageSchema],
  internalNotes: [internalNoteSchema],
  activityLog: [activityLogSchema],
  aiAnalysis: {
    sentimentScore: Number,
    priorityScore: Number,
    keywords: [String],
    reasoning: String,
    suggestedReply: String,
    suggestedTeam: String,
    isSpam: { type: Boolean, default: false }
  },
  resolvedAt: Date,
  resolutionTime: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ticketSchema.pre('save', function preSave(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
