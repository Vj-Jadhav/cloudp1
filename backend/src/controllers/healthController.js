import { getDatabaseStatus } from '../config/db.js';

/**
 * Controller to handle API health check requests.
 * @route GET /api/health
 */
export const getHealth = (req, res) => {
  const dbStatus = getDatabaseStatus();
  const isHealthy = dbStatus.status === 'connected';

  const healthData = {
    status: isHealthy ? 'UP' : 'DEGRADED',
    service: 'Student Information Management System - Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Number(process.uptime().toFixed(2)),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus.status,
      host: dbStatus.host || 'N/A',
      name: dbStatus.name || 'N/A',
    },
  };

  // Return 200 if database is connected, or 503 Service Unavailable if degraded
  const statusCode = isHealthy ? 200 : 503;
  return res.status(statusCode).json(healthData);
};
