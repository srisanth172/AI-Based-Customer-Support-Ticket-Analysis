// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [globalSearch, setGlobalSearch] = useState('');

  // Fetch current user on mount or token change
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Apply theme globally
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      const userData = response.data;
      setUser(userData);
      // Sync theme from server if available
      if (userData?.settings?.appearance?.theme && userData.settings.appearance.theme !== 'system') {
        const serverTheme = userData.settings.appearance.theme;
        if (serverTheme !== theme) setTheme(serverTheme);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      if (error.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload) => {
    try {
      const response = await apiClient.patch('/auth/me', payload);
      const updatedUser = response.data.user;
      setUser(updatedUser);
      if (payload.settings?.appearance?.theme) {
        setTheme(payload.settings.appearance.theme);
      }
      toast.success(response.data.message || 'Profile updated');
      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed';
      toast.error(message);
      throw error;
    }
  };

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        name: username,
        password
      });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      toast.success(`Welcome back, ${userData.name}!`);
      if (userData.role === 'admin') navigate('/admin');
      else navigate('/customer');
      return userData;
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (name, email, password, role = 'customer') => {
    try {
      const response = await apiClient.post('/auth/register', { name, email, password, role });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      toast.success('Account created! Check your email for OTP.');
      if (userData.role === 'admin') navigate('/admin');
      else navigate('/verify-email', { state: { email: userData.email } });
      return userData;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const forgotPassword = async (email) => {
    try {
      await apiClient.post('/auth/forgot-password', { email });
      toast.success('If an account exists, a reset link has been sent');
      return true;
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      throw error;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword });
      toast.success('Password reset successful. Please login.');
      navigate('/login');
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Password reset failed';
      toast.error(message);
      throw error;
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      await apiClient.post('/auth/verify-email', { email, code });
      toast.success('Email verified successfully!');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      toast.error(message);
      throw error;
    }
  };

  const isAuthenticated = !!token;

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (isAuthenticated) {
      try {
        await apiClient.patch('/auth/me', { settings: { appearance: { theme: newTheme } } });
      } catch (error) {
        console.error('Failed to persist theme preference');
      }
    }
  };

  const value = {
    user,
    theme,
    toggleTheme,
    updateProfile,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    fetchUser,
    loading,
    globalSearch,
    setGlobalSearch,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};