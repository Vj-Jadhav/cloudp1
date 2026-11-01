import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Starts the HTTP server and handles database connection with resilient background retry.
 */
const startServer = async () => {
  console.log('====================================================');
  console.log('Student Information Management System - Backend Tier');
  console.log(`Environment: ${NODE_ENV}`);
  console.log('====================================================');
  console.log('[1/2] Connecting to MongoDB Atlas...');

  let dbConnected = false;
  try {
    await connectDB();
    console.log('[2/2] MongoDB connection established successfully.');
    dbConnected = true;
  } catch (error) {
    console.warn('⚠️ [WARNING] Initial MongoDB connection failed:', error.message);
    console.warn('The HTTP server will start in DEGRADED mode while connection retries in the background.');
  }

  const server = app.listen(PORT, () => {
    console.log('----------------------------------------------------');
    console.log(`🚀 Server successfully started on port ${PORT}`);
    console.log(`🌐 Base URL:     http://localhost:${PORT}`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📦 Status:       ${dbConnected ? 'ONLINE (DB Connected)' : 'DEGRADED (Waiting for DB)'}`);
    console.log('----------------------------------------------------');
  });

  // If initial connection failed, retry in background every 10 seconds
  if (!dbConnected) {
    const retryInterval = setInterval(async () => {
      try {
        console.log('[Database Reconnect] Attempting background MongoDB reconnection...');
        await connectDB();
        console.log('✅ [Database Reconnected] MongoDB connection successfully established!');
        clearInterval(retryInterval);
      } catch (retryErr) {
        console.warn('[Database Reconnect] Waiting for database configuration:', retryErr.message);
      }
    }, 10000);
  }

  // Graceful shutdown handling
  const handleShutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      try {
        await disconnectDB();
        console.log('[Server] Database connection closed.');
        process.exit(0);
      } catch (dbErr) {
        console.error('[Server] Error disconnecting from database:', dbErr);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
};

startServer();
