import apiClient from './api';

const aiService = {
  analyzeTicket: async (ticketId) => {
    const response = await apiClient.post(`/tickets/${ticketId}/analyze`);
    return response.data;
  },

  getChatbotResponse: async (messages) => {
    try {
      const response = await apiClient.post('/chat/interact', {
        messages: messages.map(m => ({
          sender: m.sender === 'user' ? 'user' : 'bot',
          text: m.text
        }))
      });
      return response.data.text;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  },
};

export default aiService;
