const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// ── Security headers
// Disable CSP for the /api/v1/docs path so Swagger UI assets load correctly
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/docs')) {
    return next();
  }
  helmet()(req, res, next);
});

// ── CORS — locked to the frontend origin
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, Postman in dev)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} is not allowed.`));
      }
    },
    credentials: true,
  })
);

// ── Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Request logging (dev only)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Global rate limiter (generous, auth routes have their own tighter limits)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use(globalLimiter);

// ── Swagger UI — interactive API docs at /api/v1/docs
app.use(
  '/api/v1/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Nebula API Docs',
    customCss: `
      .swagger-ui { font-family: 'Plus Jakarta Sans', Inter, sans-serif; }
      .swagger-ui .topbar { background: #060a12; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      body { background: #060a12; }
      .swagger-ui .scheme-container { background: #0b111e; box-shadow: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
      .swagger-ui .opblock-tag { color: #94a3b8; }
      .swagger-ui .info .title { color: #f1f5f9; }
      .swagger-ui .info p, .swagger-ui .info li { color: #94a3b8; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
  })
);

// ── Serve raw OpenAPI JSON spec (useful for Postman import)
app.get('/api/v1/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API health check
 *     description: Returns the current status of the Nebula API server.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nebula-api', timestamp: new Date().toISOString() });
});

// ── 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Global error handler
app.use((err, _req, res, _next) => {
  console.error('[Global Error Handler]', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error.' });
});

module.exports = app;
