import express from 'express';
import cors from 'cors';
import compression from 'compression';
import crypto from 'crypto';
import env from './config/env.js';
import routes from './routes/index.js';
import errorHandler from './middlewares/error.middleware.js';
import setupSwagger from './config/swagger.js';

const app = express();

// X-Correlation-ID & Ultra-lightweight Latency Profiler Middleware
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  const start = process.hrtime.bigint();
  const originalEnd = res.end;

  res.end = function (...args) {
    const durationMs = (Number(process.hrtime.bigint() - start) / 1e6).toFixed(1);
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${durationMs}ms`);
    }
    if (env.NODE_ENV === 'development' && !req.url.startsWith('/public') && !req.url.startsWith('/uploads')) {
      const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
      const reset = '\x1b[0m';
      console.log(`[API ${statusColor}${res.statusCode}${reset}] ${req.method} ${req.originalUrl || req.url} - ${durationMs}ms`);
    }
    return originalEnd.apply(this, args);
  };

  next();
});

// Gzip / Deflate response compression for ultra-fast JSON transfer
app.use(compression());

// CORS Whitelist for Frontends (web: 5173, vendor: 5174, admin: 5175)
const allowedOrigins = [
  env.FRONTEND_WEB_URL,
  env.FRONTEND_VENDOR_URL,
  env.FRONTEND_ADMIN_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
].filter(Boolean);

// In development, also dynamically allow any localhost / 127.0.0.1 port (e.g. 5173-5178)
const isAllowedDevOrigin = (origin) => {
  if (env.NODE_ENV === 'development') {
    try {
      const { hostname } = new URL(origin);
      return hostname === 'localhost' || hostname === '127.0.0.1';
    } catch {
      return false;
    }
  }
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl) or allowed origins
      if (!origin || allowedOrigins.includes(origin) || isAllowedDevOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS siyasəti bu mənşədən sorğuya icazə vermir: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    maxAge: 86400, // Preflight OPTIONS sorğularını 24 saat keşləyir (şəbəkə dövriyyəsini 2 dəfə azaldır)
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI OpenAPI 3.0 Setup (/api-docs)
setupSwagger(app);

// İctimai şəkillərin paylaşılması üçün statik marşrut (məs. /public/uploads/... və ya /uploads/...)
app.use('/public', express.static('public'));
app.use('/uploads', express.static('public/uploads'));

// Bütün API marşrutları '/api' prefiksi altında birləşir
app.use('/api', routes);

// Qlobal xətaların idarə olunması middleware-i
app.use(errorHandler);

export default app;


