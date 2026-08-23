import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import env from './env.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TOURSALES Enterprise SaaS API Documentation',
      version: '1.0.0',
      description: 'TOURSALES Multi-tenant Travel Ecosystem API (B2B/B2C Enterprise Endpoints)'
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local Development Server (Port 5000)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./modules/**/*.js', './routes/**/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export const setupSwagger = (app) => {
  // Production Security Middleware
  const swaggerAuth = (req, res, next) => {
    if (env.NODE_ENV === 'production') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Swagger API Docs"');
        return res.status(401).send('Production-da Swagger sənədləşməsi üçün giriş tələb olunur.');
      }
    }
    next();
  };

  app.use('/api-docs', swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;
