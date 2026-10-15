import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Starts the HTTP server after successfully connecting to MongoDB.
 */
const startServer = async () => {
  console.log('====================================================');
  console.log('Student Information Management System - Backend Tier');
  console.log(`Environment: ${NODE_ENV}`);
  console.log('====================================================');
  console.log('[1/2] Connecting to MongoDB Atlas...');

  try {
    // Connect to database before starting HTTP listener
    await connectDB();
    console.log('[2/2] MongoDB connection established successfully.');

    const server = app.listen(PORT, () => {
      console.log('----------------------------------------------------');
      console.log(`🚀 Server successfully started on port ${PORT}`);
      console.log(`🌐 Base URL:     http://localhost:${PORT}`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
      console.log('----------------------------------------------------');
    });

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

  } catch (error) {
    console.error('====================================================');
    console.error('❌ [FATAL] Server startup aborted: Database connection failure.');
    console.error(`Reason: ${error.message}`);
    console.error('====================================================');
    console.error('Troubleshooting Steps:');
    console.error('1. Check backend/.env: Replace <username>, <password>, and <cluster-url> with your MongoDB Atlas details.');
    console.error('2. Atlas Network Access: Ensure your IP address or 0.0.0.0/0 (for cloud hosting like Render) is added in Atlas Security > Network Access.');
    console.error('3. Atlas Database User: Ensure the database user has "readWriteAnyDatabase" or read/write privileges on the specified database.');
    console.error('4. For local offline testing, you may set MONGODB_URI=mongodb://127.0.0.1:27017/student_db');
    console.error('====================================================');
    process.exit(1);
  }
};

startServer();
