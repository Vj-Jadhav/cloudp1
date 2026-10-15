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

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
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

// Student resource routes
app.use('/api/students', studentRoutes);

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
