const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const chatRoutes = require('./routes/chatRoutes');
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

app.get('/', (req, res) => {
  res.json({ message: 'AI Ticket Analysis API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', require('./routes/aiRoutes'));

app.use(notFound);
app.use(errorHandler);

initSocket(server);

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  await connectDB();
  await require('./utils/autoSeed')();
  cronService.init();
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

bootstrap().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});
