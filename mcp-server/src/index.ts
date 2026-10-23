import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from './utils/logger.js';
import { connectToDatabase, disconnectDatabase } from './db/connection.js';
import { registerStudentTools } from './tools/index.js';

// Resolve directory of current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate .env in mcp-server root directory or current working directory
const mcpRootDir = path.resolve(__dirname, '..');
const possibleEnvPaths = [
  path.join(mcpRootDir, '.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(mcpRootDir, '../backend/.env'),
];

let loadedEnv = false;
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    logger.info(`Loaded environment variables from: ${envPath}`);
    loadedEnv = true;
    break;
  }
}

if (!loadedEnv) {
  dotenv.config();
  logger.warn('No explicit .env found in standard search paths. Using process.env defaults.');
}

async function main() {
  logger.info('Initializing Student Information Management System MCP Server...');

  // Create MCP Server instance
  const server = new McpServer({
    name: 'student-information-management-system',
    version: '1.0.0',
  });

  // Register all 6 verified database tools
  registerStudentTools(server);

  // Connect via stdio transport immediately so Claude Desktop handshake is instant
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Student Management MCP Server is running and listening on stdio.');

  // Initiate background connection to MongoDB Atlas
  connectToDatabase().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Background MongoDB Atlas connection failed:', message);
    logger.warn('Tool executions will automatically retry connecting when called.');
  });

  // Handle graceful shutdowns
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down MCP server gracefully...`);
    try {
      await disconnectDatabase();
      await server.close();
    } catch (err) {
      logger.error('Error during shutdown:', err);
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  logger.error('Fatal error starting MCP Server:', error);
  process.exit(1);
});
