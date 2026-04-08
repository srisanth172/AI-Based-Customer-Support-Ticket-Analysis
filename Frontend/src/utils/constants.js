// src/utils/constants.js

// API endpoints (base is set in api.js)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/auth/me',
  },
  TICKETS: {
    BASE: '/tickets',
    STATS: '/tickets/stats',
    MESSAGES: (ticketId) => `/tickets/${ticketId}/messages`,
    STATUS: (ticketId) => `/tickets/${ticketId}/status`,
  },
};

// Ticket statuses
export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  PENDING: 'pending',
  RESOLVED: 'resolved',
};

export const TICKET_STATUS_LABELS = {
  [TICKET_STATUS.OPEN]: 'Open',
  [TICKET_STATUS.IN_PROGRESS]: 'In Progress',
  [TICKET_STATUS.PENDING]: 'Pending',
  [TICKET_STATUS.RESOLVED]: 'Resolved',
};

export const TICKET_STATUS_COLORS = {
  [TICKET_STATUS.OPEN]: 'bg-blue-100 text-blue-800',
  [TICKET_STATUS.IN_PROGRESS]: 'bg-purple-100 text-purple-800',
  [TICKET_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [TICKET_STATUS.RESOLVED]: 'bg-green-100 text-green-800',
};

// Ticket priorities
export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const TICKET_PRIORITY_LABELS = {
  [TICKET_PRIORITY.LOW]: 'Low',
  [TICKET_PRIORITY.MEDIUM]: 'Medium',
  [TICKET_PRIORITY.HIGH]: 'High',
};

export const TICKET_PRIORITY_COLORS = {
  [TICKET_PRIORITY.LOW]: 'bg-green-100 text-green-800',
  [TICKET_PRIORITY.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [TICKET_PRIORITY.HIGH]: 'bg-red-100 text-red-800',
};

// Sentiment types
export const SENTIMENT = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative',
};

export const SENTIMENT_LABELS = {
  [SENTIMENT.POSITIVE]: 'Positive',
  [SENTIMENT.NEUTRAL]: 'Neutral',
  [SENTIMENT.NEGATIVE]: 'Negative',
};

export const SENTIMENT_COLORS = {
  [SENTIMENT.POSITIVE]: 'bg-green-100 text-green-800',
  [SENTIMENT.NEUTRAL]: 'bg-gray-100 text-gray-800',
  [SENTIMENT.NEGATIVE]: 'bg-red-100 text-red-800',
};

// Ticket categories
export const TICKET_CATEGORY = {
  BILLING: 'billing',
  TECHNICAL: 'technical',
  DELIVERY: 'delivery',
  ACCOUNT: 'account',
  PRODUCT: 'product',
  GENERAL: 'general',
};

export const TICKET_CATEGORY_LABELS = {
  [TICKET_CATEGORY.BILLING]: 'Billing',
  [TICKET_CATEGORY.TECHNICAL]: 'Technical',
  [TICKET_CATEGORY.DELIVERY]: 'Delivery',
  [TICKET_CATEGORY.ACCOUNT]: 'Account',
  [TICKET_CATEGORY.PRODUCT]: 'Product',
  [TICKET_CATEGORY.GENERAL]: 'General',
};

// User roles
export const USER_ROLE = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 20, 50, 100],
};

// Date formats
export const DATE_FORMATS = {
  FULL: 'PPPpp', // e.g., "Jan 1, 2024 10:30 AM"
  SHORT: 'PP',   // e.g., "Jan 1, 2024"
  TIME: 'p',     // e.g., "10:30 AM"
  RELATIVE: 'relative',
};

// Socket events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_TICKET: 'join-ticket',
  LEAVE_TICKET: 'leave-ticket',
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  TICKET_UPDATED: 'ticket-updated',
};

// Toast durations (ms)
export const TOAST_DURATION = {
  SHORT: 2000,
  NORMAL: 3000,
  LONG: 5000,
};