const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
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

// Ensure uploads directory exists
const uploadDirs = [
  path.join(__dirname, '../uploads'),
  path.join(__dirname, '../../uploads'),
];

for (const uploadDir of uploadDirs) {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

console.log('[Server] Static uploads directories:', uploadDirs.join(', '));

// Trust proxy for production (Render/Vercel) to handle HTTPS cookies
app.set('trust proxy', 1);

const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3000,https://ai-based-customer-support-ticket-an-beige.vercel.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(o => o.replace(/\/$/, '') === normalizedOrigin) || 
                     normalizedOrigin.endsWith('.vercel.app');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Origin ${origin} not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));
// Explicitly handle pre-flight requests for all routes
app.options('*', cors(corsOptions));

const bootstrap = async () => {
  try {
    const connection = await connectDB();
    await require('./utils/autoSeed')();
    cronService.init();

    // Session configuration
    app.use(
      session({
        secret: process.env.SESSION_SECRET || 'nexa_session_secret_9988',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          client: connection.getClient(),
          collectionName: 'sessions',
        }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          secure: process.env.NODE_ENV === 'production', // true in production
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // none for cross-site in production
        },
      })
    );

    app.use(express.json());

    // Set COOP header for Google Auth compatibility
    app.use((req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
      next();
    });

    // Serve static files from uploads directory
    app.use('/uploads', express.static(uploadDirs[0], {
      setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
      }
    }));

    app.use('/uploads', express.static(uploadDirs[1], {
      setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
      }
    }));

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
    server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
};

bootstrap();
