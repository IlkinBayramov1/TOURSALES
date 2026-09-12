import http from 'http';
import app from './app.js';
import env from './config/env.js';
import prisma from './config/db.js';
import { notificationsService } from './modules/notifications/notifications.service.js';
import { startCronJobs } from './utils/cron-jobs.js';

// Catch Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception thrown:', err);
  process.exit(1);
});

// Catch Unhandled Rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = env.PORT || 5000;
const server = http.createServer(app);

// WebSocket (Socket.io) serverini başladırıq
notificationsService.initialize(server);

// Gündəlik Cron Job-ları işə salırıq
startCronJobs();

// Verilənlər bazasını əvvəlcədən qoşuruq və serveri dinləməyə başlayırıq (Cold-start gecikməsini aradan qaldırır)
const startServer = async () => {
  const dbStartTime = Date.now();
  try {
    await prisma.$connect();
    const dbDuration = Date.now() - dbStartTime;
    console.log(`[Database] Prisma verilənlər bazasına uğurla qoşuldu (${dbDuration}ms).`);
  } catch (err) {
    console.error('[CRITICAL] Verilənlər bazasına qoşularkən xəta:', err);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`Server ${env.NODE_ENV} rejimində, ${PORT} portunda fəaliyyət göstərir (WebSocket və Cron Jobs aktivdir).`);
  });
};

startServer();

// Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  console.log(`[SHUTDOWN] ${signal} siqnalı alındı. Graceful shutdown başladılır...`);
  server.close(async () => {
    console.log('[SHUTDOWN] HTTP və WebSocket serverləri bağlandı.');
    try {
      await prisma.$disconnect();
      console.log('[SHUTDOWN] Database bağlantısı təhlükəsiz bağlandı.');
      process.exit(0);
    } catch (err) {
      console.error('[SHUTDOWN ERROR] Database bağlantısını bağlayarkən xəta:', err);
      process.exit(1);
    }
  });

  // Maximum 10 saniyə ərzində məcburi dayandırma
  setTimeout(() => {
    console.error('[SHUTDOWN] Məcburi dayandırma (Timeout: 10s).');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

