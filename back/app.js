import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import routes from './routes/index.js';
import errorHandler from './middlewares/error.middleware.js';
import setupSwagger from './config/swagger.js';

const app = express();

// X-Correlation-ID Tracing Middleware
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
});

// Qlobal middleware-lər
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI OpenAPI 3.0 Setup (/api-docs)
setupSwagger(app);

// İctimai şəkillərin paylaşılması üçün statik marşrut (məs. /public/uploads/...)
app.use('/public', express.static('public'));

// Bütün API marşrutları '/api' prefiksi altında birləşir
app.use('/api', routes);

// Qlobal xətaların idarə olunması middleware-i
app.use(errorHandler);

export default app;


