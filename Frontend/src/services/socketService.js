import { io } from 'socket.io-client';

const SOCKET_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000';

let socketInstance;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, { withCredentials: true });
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
// src/services/socketService.js
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  /**
   * Initialize WebSocket connection
   * @param {string} token - JWT token for authentication
   */
  connect(token) {
    if (this.socket?.connected) return;

    const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Join a ticket room to receive real-time messages
   * @param {string} ticketId
   */
  joinTicketRoom(ticketId) {
    if (this.socket) {
      this.socket.emit('join-ticket', ticketId);
    }
  }

  /**
   * Leave a ticket room
   * @param {string} ticketId
   */
  leaveTicketRoom(ticketId) {
    if (this.socket) {
      this.socket.emit('leave-ticket', ticketId);
    }
  }

  /**
   * Send a message via WebSocket (for real-time)
   * @param {string} ticketId
   * @param {string} message
   * @param {string} sender
   */
  sendMessage(ticketId, message, sender) {
    if (this.socket) {
      this.socket.emit('send-message', { ticketId, message, sender });
    }
  }

  /**
   * Register event listener
   * @param {string} event - Event name (e.g., 'new-message')
   * @param {function} callback
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.listeners.set(event, callback);
    }
  }

  /**
   * Remove event listener
   * @param {string} event
   */
  off(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }
}

export default new SocketService();