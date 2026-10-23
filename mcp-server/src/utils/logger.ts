/**
 * Stdio-Safe Logger for MCP Server.
 *
 * CRITICAL MCP REQUIREMENT:
 * Standard output (stdout) is strictly reserved for JSON-RPC messages in MCP stdio transport.
 * Any non-protocol data written to stdout will corrupt communication with Claude Desktop.
 * Therefore, all diagnostics, status updates, and error logs MUST be routed to stderr (process.stderr).
 */

/**
 * Strips password and sensitive credentials from MongoDB URIs for safe logging.
 */
export function sanitizeMongoUri(uri?: string): string {
  if (!uri) return '[not configured]';
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:*****@');
}

function formatMessage(prefix: string, args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.map((arg) => {
    if (arg instanceof Error) {
      return `${arg.message}\n${arg.stack || ''}`;
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');

  return `[${timestamp}] [MCP-SERVER] [${prefix}] ${formattedArgs}\n`;
}

export const logger = {
  info: (...args: unknown[]) => {
    process.stderr.write(formatMessage('INFO', args));
  },
  warn: (...args: unknown[]) => {
    process.stderr.write(formatMessage('WARN', args));
  },
  error: (...args: unknown[]) => {
    process.stderr.write(formatMessage('ERROR', args));
  },
  debug: (...args: unknown[]) => {
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      process.stderr.write(formatMessage('DEBUG', args));
    }
  },
};
