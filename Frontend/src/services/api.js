// src/services/api.js
import axios from 'axios';
import { errorHandler } from '../utils/errorHandler';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor: add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = errorHandler(error);
    return Promise.reject(customError);
  }
);

export default apiClient;