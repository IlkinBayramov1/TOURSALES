import express from 'express';
import prisma from '../../config/db.js';

const router = express.Router();

// Liveness Probe
router.get('/liveness', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'TOURSALES API Server',
    timestamp: new Date().toISOString()
  });
});

// Readiness Probe
router.get('/readiness', async (req, res) => {
  try {
    // Database bağlantısının yoxlanılması
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'READY',
      database: 'CONNECTED',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'NOT_READY',
      database: 'DISCONNECTED',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
