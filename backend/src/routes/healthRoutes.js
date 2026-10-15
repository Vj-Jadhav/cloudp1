import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';

const router = Router();

/**
 * Health check endpoint.
 * GET /api/health
 */
router.get('/health', getHealth);

export default router;
