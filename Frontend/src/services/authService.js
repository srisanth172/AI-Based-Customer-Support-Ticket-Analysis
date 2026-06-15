// src/services/authService.js
import apiClient from './api';

const authService = {
  /**
   * Register a new user
   * @param {string} name - User's full name
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} role - 'customer' or 'admin'
   */
  register: async (name, email, password, role = 'customer') => {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
      role,
    });
    return response.data;
  },

  /**
   * Login user
   * @param {string} email
   * @param {string} password
   */
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Get current logged-in user info
   */
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Request password reset email
   * @param {string} email
   */
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password using token
   * @param {string} token - Reset token from email
   * @param {string} newPassword
   */
  resetPassword: async (token, newPassword) => {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

export default authService;