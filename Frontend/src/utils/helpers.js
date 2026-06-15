// src/utils/helper.js
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  TICKET_PRIORITY_COLORS,
  TICKET_STATUS_COLORS,
  SENTIMENT_COLORS,
} from './constants';

/**
 * Format a date to a readable string
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Desired format (e.g., 'PPpp')
 * @returns {string} Formatted date
 */
export const formatDate = (date, formatStr = 'PPpp') => {
  if (!date) return 'N/A';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return format(parsed, formatStr);
};

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {string|Date} date
 * @returns {string}
 */
export const timeAgo = (date) => {
  if (!date) return 'N/A';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(parsed, { addSuffix: true });
};

/**
 * Truncate a string to a maximum length
 * @param {string} str
 * @param {number} length
 * @param {string} suffix
 * @returns {string}
 */
export const truncate = (str, length = 50, suffix = '...') => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length).trim() + suffix;
};

/**
 * Capitalize first letter of each word
 * @param {string} str
 * @returns {string}
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Generate a random ID (for temporary use)
 * @param {number} length
 * @returns {string}
 */
export const generateTempId = (length = 8) => {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};

/**
 * Get CSS class for priority badge
 * @param {string} priority - 'low', 'medium', 'high'
 * @returns {string}
 */
export const getPriorityClass = (priority) => {
  return TICKET_PRIORITY_COLORS[priority] || TICKET_PRIORITY_COLORS.medium;
};

/**
 * Get CSS class for status badge
 * @param {string} status
 * @returns {string}
 */
export const getStatusClass = (status) => {
  return TICKET_STATUS_COLORS[status] || TICKET_STATUS_COLORS.open;
};

/**
 * Get CSS class for sentiment badge
 * @param {string} sentiment
 * @returns {string}
 */
export const getSentimentClass = (sentiment) => {
  return SENTIMENT_COLORS[sentiment] || SENTIMENT_COLORS.neutral;
};

/**
 * Debounce function for search inputs
 * @param {Function} func
 * @param {number} delay
 * @returns {Function}
 */
export const debounce = (func, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

/**
 * Deep clone an object
 * @param {object} obj
 * @returns {object}
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {any} value
 * @returns {boolean}
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Extract error message from API error object
 * @param {any} error
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.error) return error.response.data.error;
  if (error.message) return error.message;
  return 'An unexpected error occurred';
};

/**
 * Scroll element into view smoothly
 * @param {HTMLElement} element
 */
export const scrollIntoView = (element) => {
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

/**
 * Format file size from bytes to human readable
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Copy text to clipboard
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * Class name merger for Tailwind (simple version)
 * @param {...string} classes
 * @returns {string}
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Parse query string to object
 * @param {string} queryString
 * @returns {object}
 */
export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString);
  const obj = {};
  for (const [key, value] of params.entries()) {
    obj[key] = value;
  }
  return obj;
};

/**
 * Build query string from object
 * @param {object} params
 * @returns {string}
 */
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};