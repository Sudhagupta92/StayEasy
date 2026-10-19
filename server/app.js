import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { ENV } from './config/env.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/api.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration supporting dynamic Vite local development ports & configured CLIENT_URL
const clientUrlOrigins = (ENV.CLIENT_URL || '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...clientUrlOrigins,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:3000',
].filter(Boolean);

const isOriginAllowed = (origin) => {
  // Allow requests with no origin (like mobile apps, curl, postman)
  if (!origin) return true;
  // In development, allow ANY port on localhost, 127.0.0.1, or IPv6 loopback
  if (ENV.NODE_ENV !== 'production') {
    if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)) return true;
  }
  // Exact match in allowed origins list
  if (allowedOrigins.includes(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  })
);

// Rate limiting
app.use('/api', globalRateLimiter);

// Request logger
if (ENV.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root health & welcome endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to StayEasy API',
    documentation: '/api/v1',
    healthCheck: '/api/v1/health',
  });
});

// API Routes
app.use('/api/v1', apiRouter);

// 404 Not Found Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
