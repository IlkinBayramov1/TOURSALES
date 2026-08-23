import express from 'express';
import prisma from '../../config/db.js';

const router = express.Router();

// Liveness Probe (/live & /liveness)
const livenessHandler = (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'TOURSALES Enterprise API Server',
    correlationId: req.correlationId,
    timestamp: new Date().toISOString()
  });
};
router.get('/liveness', livenessHandler);
router.get('/live', livenessHandler);

// Readiness Probe (/ready & /readiness)
const readinessHandler = async (req, res) => {
  try {
    // Database bağlantısının yoxlanılması
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'READY',
      database: 'CONNECTED',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'NOT_READY',
      database: 'DISCONNECTED',
      error: error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
};
router.get('/readiness', readinessHandler);
router.get('/ready', readinessHandler);

export default router;
