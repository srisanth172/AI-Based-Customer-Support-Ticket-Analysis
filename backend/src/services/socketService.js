const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('join-ticket', (ticketId) => socket.join(`ticket-${ticketId}`));
    socket.on('leave-ticket', (ticketId) => socket.leave(`ticket-${ticketId}`));
    socket.on('send-message', (data) => {
      io.to(`ticket-${data.ticketId}`).emit('new-message', data);
    });
    socket.on('disconnect', () => console.log('Client disconnected'));
  });

  return io;
};

const emitTicketCreated = (ticket) => {
  if (io) {
    io.emit('ticket-created', ticket);
  }
};

const emitTicketUpdated = (ticket) => {
  if (io) {
    io.emit('ticket-updated', ticket);
    io.to(`ticket-${ticket.ticketId}`).emit('ticket-updated', ticket);
  }
};

const getIO = () => io;

module.exports = { initSocket, emitTicketCreated, emitTicketUpdated, getIO };