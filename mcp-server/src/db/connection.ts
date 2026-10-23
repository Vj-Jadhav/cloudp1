import mongoose from 'mongoose';
import { logger, sanitizeMongoUri } from '../utils/logger.js';

let connectionPromise: Promise<typeof mongoose> | null = null;

/**
 * Validates the MongoDB URI format and rejects unconfigured placeholder strings.
 */
export function validateMongoURI(uri?: string): { valid: boolean; reason?: string } {
  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    return {
      valid: false,
      reason: 'MONGODB_URI is not defined in the environment.',
    };
  }

  const placeholderTokens = ['<username>', '<password>', '<cluster-url>', '<database>', 'your_mongodb'];
  const foundPlaceholders = placeholderTokens.filter((token) => uri.includes(token));

  if (foundPlaceholders.length > 0) {
    return {
      valid: false,
      reason: `MONGODB_URI contains unconfigured placeholders (${foundPlaceholders.join(', ')}). Update mcp-server/.env with real Atlas credentials.`,
    };
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    return {
      valid: false,
      reason: 'MONGODB_URI must start with "mongodb://" or "mongodb+srv://".',
    };
  }

  return { valid: true };
}

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Safe for concurrent and repeated calls; reuses active or in-flight connection promise.
 */
export async function connectToDatabase(customUri?: string): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = customUri || process.env.MONGODB_URI;
  const validation = validateMongoURI(uri);

  if (!validation.valid) {
    const errorMsg = `Database Configuration Error: ${validation.reason}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  connectionPromise = (async () => {
    try {
      if (mongoose.connection.listenerCount('error') === 0) {
        mongoose.connection.on('error', (err) => {
          logger.error('MongoDB Atlas Connection Error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB Atlas disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
          logger.info('MongoDB Atlas reconnected successfully.');
        });
      }

      logger.info(`Connecting to MongoDB Atlas at ${sanitizeMongoUri(uri)}...`);

      const conn = await mongoose.connect(uri!, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      });

      logger.info(
        `Connected to MongoDB Atlas | Host: ${conn.connection.host} | DB: ${conn.connection.name}`
      );

      return conn;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to connect to MongoDB Atlas:', message);
      throw error;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

/**
 * Ensures an active connection to MongoDB Atlas before executing any tool operation.
 */
export async function ensureDatabaseConnected(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    await connectToDatabase();
  }
}

/**
 * Gracefully disconnects from MongoDB Atlas.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    logger.info('Closing MongoDB Atlas connection...');
    await mongoose.disconnect();
    logger.info('MongoDB Atlas disconnected gracefully.');
  }
}
