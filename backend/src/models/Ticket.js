const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'bot', 'admin'], required: true },
  text: { type: String, required: true },
  attachmentUrl: { type: String },
  files: [{ name: String, url: String, fileType: String }],
  aiVerification: { type: String }, // 'Genuine', 'AI Generated', 'Mismatch'
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
  status: { type: String, enum: ['open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed', 'escalated', 'reopened', 'spam'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
  category: { 
    type: String, 
    enum: [
      'Payments', 'Orders & Delivery', 'Returns & Refunds', 
      'Product Issues', 'Account Issues', 'Notifications & Communication', 
      'Subscription & Plans', 'OutOfScope', 'Spam'
    ],
    default: 'Product Issues' 
  },
  assignedTeam: { type: String, default: 'unassigned' },
  eta: { type: Date },
  additionalPhotos: [{ url: String, uploadedAt: { type: Date, default: Date.now } }],
  messages: [messageSchema],
  internalNotes: [internalNoteSchema],
  activityLog: [activityLogSchema],
  aiAnalysis: {
    sentimentScore: Number,
    priorityScore: Number,
    keywords: [String],
    reasoning: String,
    suggestedReply: String,
    suggestedSolutions: [String],
    suggestedTeam: String,
    isSpam: { type: Boolean, default: false }
  },
  resolvedAt: Date,
  resolutionTime: Number,
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  spamResubmitCount: { type: Number, default: 0 },  // tracks how many resubmissions happened on spam tickets
  spamAdminReviewed: { type: Boolean, default: false },  // true after admin has been shown the spam notice
});

ticketSchema.pre('save', function preSave(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
