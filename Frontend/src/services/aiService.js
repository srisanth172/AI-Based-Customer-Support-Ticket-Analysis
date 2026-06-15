import apiClient from './api';

const aiService = {
  analyzeTicket: async (ticketId) => {
    const response = await apiClient.post(`/tickets/${ticketId}/analyze`);
    return response.data;
  },
};

export default aiService;
