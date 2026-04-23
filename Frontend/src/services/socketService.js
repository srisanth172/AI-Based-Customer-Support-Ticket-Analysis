import { io } from 'socket.io-client';

const SOCKET_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
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

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  joinTicketRoom(ticketId) {
    this.socket?.emit('join-ticket', ticketId);
  }

  leaveTicketRoom(ticketId) {
    this.socket?.emit('leave-ticket', ticketId);
  }

  sendMessage(ticketId, message, sender) {
    this.socket?.emit('send-message', { ticketId, message, sender });
  }

  emit(event, payload) {
    this.socket?.emit(event, payload);
  }

  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }

    const existingCallback = this.listeners.get(event);
    if (existingCallback) {
      this.socket.off(event, existingCallback);
    }

    this.socket.on(event, callback);
    this.listeners.set(event, callback);
  }

  off(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }
}

export default new SocketService();