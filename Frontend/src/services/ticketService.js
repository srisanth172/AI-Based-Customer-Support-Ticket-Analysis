// src/services/ticketService.js
import apiClient from './api';

const ticketService = {
  /**
   * Create a new ticket
   * @param {object} ticketData - { messages, userId }
   */
  createTicket: async (ticketData) => {
    const response = await apiClient.post('/tickets', ticketData);
    return response.data;
  },

  /**
   * Get all tickets with optional filters
   * @param {object} params - { status, priority, category, search, page, limit }
   */
  getTickets: async (params = {}) => {
    const response = await apiClient.get('/tickets', { params });
    return response.data;
  },

  /**
   * Get a single ticket by ID
   * @param {string} ticketId
   */
  getTicketById: async (ticketId) => {
    const response = await apiClient.get(`/tickets/${ticketId}`);
    return response.data;
  },

  /**
   * Add a message to a ticket
   * @param {string} ticketId
   * @param {string} message
   * @param {string} sender - 'user', 'admin', or 'bot'
   */
  addMessage: async (ticketId, message, sender) => {
    const response = await apiClient.post(`/tickets/${ticketId}/messages`, {
      message,
      sender,
    });
    return response.data;
  },

  updateTicketAdmin: async (ticketId, payload) => {
    const response = await apiClient.patch(`/tickets/${ticketId}/admin`, payload);
    return response.data;
  },

  updateTicketStatus: async (ticketId, status) => {
    const response = await apiClient.patch(`/tickets/${ticketId}/status`, { status });
    return response.data;
  },

  bulkUpdateTickets: async (payload) => {
    const response = await apiClient.post(`/tickets/bulk`, payload);
    return response.data;
  },

  exportTicketsCSV: async () => {
    const response = await apiClient.get('/tickets/export', { responseType: 'blob' });
    return response.data;
  },

  /**
   * Get dashboard statistics (admin only)
   */
  getDashboardStats: async () => {
    const response = await apiClient.get('/tickets/stats');
    return response.data;
  },
};

export default ticketService;