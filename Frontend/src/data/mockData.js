// src/data/mockData.js
export const mockTickets = [
  {
    id: 'TKT-1001',
    subject: 'Unable to login to dashboard',
    priority: 'high',
    status: 'open',
    sentiment: 'negative',
    category: 'technical',
    createdAt: '2024-01-15T10:30:00Z',
    messages: [
      { sender: 'user', text: 'I cannot login to my account, it keeps saying invalid password', timestamp: '2024-01-15T10:30:00Z' },
      { sender: 'bot', text: 'I understand you\'re having trouble logging in. Let me help you reset your password.', timestamp: '2024-01-15T10:31:00Z' },
    ],
    aiAnalysis: {
      sentiment: 'negative',
      priority: 'high',
      category: 'technical',
      reasoning: 'Urgent login issue detected with multiple failed attempts',
      keywords: ['login', 'password', 'invalid'],
      suggestedReply: 'I apologize for the login issues. Let me help you reset your password immediately.'
    }
  },
  {
    id: 'TKT-1002',
    subject: 'Billing question about subscription',
    priority: 'medium',
    status: 'in_progress',
    sentiment: 'neutral',
    category: 'billing',
    createdAt: '2024-01-14T14:20:00Z',
    messages: [
      { sender: 'user', text: 'I was charged twice this month, can you help?', timestamp: '2024-01-14T14:20:00Z' },
      { sender: 'admin', text: 'I\'ll look into this for you. Can you provide your transaction ID?', timestamp: '2024-01-14T15:00:00Z' },
    ],
    aiAnalysis: {
      sentiment: 'neutral',
      priority: 'medium',
      category: 'billing',
      reasoning: 'Billing discrepancy detected but no urgency indicators',
      keywords: ['charged', 'twice', 'subscription'],
      suggestedReply: 'I understand your concern about the double charge. Please share your transaction ID so I can investigate.'
    }
  },
  {
    id: 'TKT-1003',
    subject: 'Delivery delay - urgent!',
    priority: 'high',
    status: 'open',
    sentiment: 'negative',
    category: 'delivery',
    createdAt: '2024-01-16T09:15:00Z',
    messages: [
      { sender: 'user', text: 'My order is 5 days late, this is unacceptable!', timestamp: '2024-01-16T09:15:00Z' },
    ],
    aiAnalysis: {
      sentiment: 'negative',
      priority: 'high',
      category: 'delivery',
      reasoning: 'Urgent delivery delay with negative sentiment',
      keywords: ['late', 'unacceptable', 'delay'],
      suggestedReply: 'I sincerely apologize for the delivery delay. Let me escalate this to our logistics team right away.'
    }
  }
];

export const mockStats = {
  totalTickets: 47,
  openTickets: 23,
  resolvedTickets: 24,
  negativeTickets: 8,
  highPriorityTickets: 5,
  averageResolutionTime: 145
};