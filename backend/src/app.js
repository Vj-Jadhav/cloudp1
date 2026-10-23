import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

const app = express();

// ==========================================
// Middleware Configuration
// ==========================================

// Enable CORS with origin restriction using FRONTEND_URL
const rawOrigins = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map((origin) => origin.trim());
const isDev = process.env.NODE_ENV !== 'production';

// Check if origin is a valid Vercel deployment (production or preview domain)
const isVercelOrigin = (origin) => {
  try {
    const { hostname, protocol } = new URL(origin);
    return (protocol === 'https:' || protocol === 'http:') &&
           (hostname.endsWith('.vercel.app') || hostname === 'vercel.app');
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Allow if origin is explicitly in allowedOrigins list or wildcard
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow any Vercel production or preview deployment URL
      if (isVercelOrigin(origin)) {
        return callback(null, true);
      }

      // In development mode, automatically allow localhost & 127.0.0.1 on any port (5173, 5174, etc.)
      if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS Warning] Origin "${origin}" is not allowed by CORS configuration.`);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}

// ==========================================
// Route Registration
// ==========================================

// Root endpoint info
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Student Information Management System API',
    tier: 'Backend Logic Tier (Node.js + Express.js)',
    documentation: 'See README.md for endpoint specifications',
    healthCheck: '/api/health',
    version: '1.0.0',
  });
});

// Health check routes mounted at /api and top-level /health
app.use('/api', healthRoutes);
app.use('/', healthRoutes);

// Student resource routes mounted at canonical /api/students and /students alias
app.use('/api/students', studentRoutes);
app.use('/students', studentRoutes);

// ==========================================
// Error Handling
// ==========================================

// 404 Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected server error occurred.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

export default app;
