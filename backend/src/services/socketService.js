// This is integrated directly in server.js, but we can keep a separate file for clarity
const socketService = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('join-ticket', (ticketId) => socket.join(`ticket-${ticketId}`));
    socket.on('leave-ticket', (ticketId) => socket.leave(`ticket-${ticketId}`));
    socket.on('send-message', (data) => {
      io.to(`ticket-${data.ticketId}`).emit('new-message', data);
    });
    socket.on('disconnect', () => console.log('Client disconnected'));
  });
};
module.exports = socketService;