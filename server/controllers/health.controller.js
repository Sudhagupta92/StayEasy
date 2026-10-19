import { getDBStatus } from '../config/db.js';
import { ENV } from '../config/env.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Health check endpoint
 * @route   GET /api/v1/health
 * @access  Public
 */
export const getHealth = (req, res) => {
  const dbStatus = getDBStatus();

  return successResponse(
    res,
    'StayEasy API is running',
    {
      app: 'StayEasy REST API',
      version: '1.0.0',
      phase: 'Phase 12 - Integrated Financial Payments Gateway & Real-Time Wallet / Escrow Ledger',
      environment: ENV.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
    },
    200
  );
};
