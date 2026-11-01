import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATUS_FILE = path.join(__dirname, 'containers.json');

/**
 * Returns the current container deployment status, replica count, and service list.
 */
export function getContainerStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const raw = fs.readFileSync(STATUS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch {
    // If reading file fails, continue with fallback
  }

  const count = process.env.CONTAINER_INSTANCES
    ? parseInt(process.env.CONTAINER_INSTANCES, 10)
    : 2;

  return {
    count,
    runtime: 'Docker',
    provider: 'Render',
    status: 'active',
    services: count > 1 ? ['cloudp', 'cloudp-copy'] : ['cloudp'],
    lastUpdated: new Date().toISOString(),
  };
}
