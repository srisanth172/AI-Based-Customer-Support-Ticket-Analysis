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

  // Fetch current user on mount or token change
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
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
      // Redirect based on role
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/customer');
      }
      return userData;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const googleLogin = async (credential, mode = 'login') => {
    try {
      const response = await apiClient.post('/auth/google', { credential, mode });
      const { token: newToken, user: userData, message } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      toast.success(message || `Welcome, ${userData.name}!`);
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/customer');
      }
      return userData;
    } catch (error) {
      const message = error.response?.data?.message || 'Google Auth failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (name, email, password, role = 'customer') => {
    try {
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        password,
        role
      });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      toast.success('Registration successful!');
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/customer');
      }
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
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword
      });
      toast.success('Password reset successful. Please login.');
      navigate('/login');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      throw error;
    }
  };

  const value = {
    user,
    login,
    register,
    googleLogin,
    logout,
    forgotPassword,
    resetPassword,
    loading,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};