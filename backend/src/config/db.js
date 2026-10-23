import mongoose from 'mongoose';

/**
 * Validates whether the MongoDB URI is configured and not using placeholder strings.
 * @param {string} uri - The MongoDB connection string
 * @returns {{ valid: boolean, reason?: string }}
 */
export const validateMongoURI = (uri) => {
  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    return {
      valid: false,
      reason: 'MONGODB_URI is not defined in environment variables.',
    };
  }

  const placeholderTokens = ['<username>', '<password>', '<cluster-url>', '<database>', 'your_mongodb'];
  const foundPlaceholders = placeholderTokens.filter((token) => uri.includes(token));

  if (foundPlaceholders.length > 0) {
    return {
      valid: false,
      reason: `MONGODB_URI contains unconfigured placeholder tokens: ${foundPlaceholders.join(', ')}. Please update backend/.env with your actual MongoDB Atlas credentials.`,
    };
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    return {
      valid: false,
      reason: 'MONGODB_URI must start with "mongodb://" or "mongodb+srv://".',
    };
  }

  return { valid: true };
};

/**
 * Returns current database connection status details.
 * @returns {object}
 */
export const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const readyState = mongoose.connection.readyState;
  return {
    stateCode: readyState,
    status: states[readyState] || 'unknown',
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};

/**
 * Connects to MongoDB Atlas using Mongoose.
 * @param {string} [customUri] - Optional URI override (useful for testing)
 * @returns {Promise<typeof mongoose>}
 */
export const connectDB = async (customUri) => {
  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const uri = customUri || process.env.MONGODB_URI;

  const validation = validateMongoURI(uri);
  if (!validation.valid) {
    const errorMsg = `[Database Configuration Error] ${validation.reason}`;
    console.error(`\x1b[31m${errorMsg}\x1b[0m`);
    throw new Error(errorMsg);
  }

  try {
    // Configure connection event listeners once
    if (mongoose.connection.listenerCount('error') === 0) {
      mongoose.connection.on('error', (err) => {
        console.error('\x1b[31m[MongoDB Event Error]\x1b[0m', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('\x1b[33m[MongoDB Event]\x1b[0m Database disconnected.');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('\x1b[32m[MongoDB Event]\x1b[0m Database reconnected successfully.');
      });
    }

    const conn = await mongoose.connect(uri, {
      dbName: process.env.DB_NAME || 'student_db',
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    console.log(
      `\x1b[32m[Database Connected]\x1b[0m Connected to MongoDB successfully | Host: ${conn.connection.host} | DB: ${conn.connection.name}`
    );

    return conn;
  } catch (error) {
    console.error(`\x1b[31m[Database Connection Failed]\x1b[0m ${error.message}`);
    throw error;
  }
};

/**
 * Disconnects from MongoDB (for graceful shutdown and testing).
 * @returns {Promise<void>}
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
