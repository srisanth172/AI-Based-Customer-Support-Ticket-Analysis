const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const chatRoutes = require('./routes/chatRoutes');
const liveChatRoutes = require('./routes/liveChatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { initSocket } = require('./services/socketService');

const cronService = require('./services/cronService');

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
  override: true,
});

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Set COOP header for Google Auth compatibility
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.get('/', (req, res) => {
  // If the frontend build exists, serve it, otherwise show the API message
  const distPath = path.join(__dirname, '../../Frontend/dist/index.html');
  if (fs.existsSync(distPath)) {
    return res.sendFile(distPath);
  }
  res.json({ message: 'AI Ticket Analysis API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/live-chat', liveChatRoutes);
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/notifications', notificationRoutes);

// Serve static files from the Frontend dist directory
app.use(express.static(path.join(__dirname, '../../Frontend/dist')));

// SPA fallback: for any non-API route, serve the frontend's index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const distPath = path.join(__dirname, '../../Frontend/dist/index.html');
  if (fs.existsSync(distPath)) {
    res.sendFile(distPath);
  } else {
    next();
  }
});

app.use(notFound);
app.use(errorHandler);

initSocket(server);

const PORT = process.env.PORT || 5003;

const bootstrap = async () => {
  await connectDB();
  await require('./utils/autoSeed')();
  cronService.init();
  server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
};

bootstrap().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});
