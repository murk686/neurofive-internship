require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');
const { sendError } = require('./utils/response');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());

// Swagger docs at /api-docs
const swaggerDoc = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
  customSiteTitle: 'NeuroFive API Docs',
}));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NeuroFive Backend API — Week 5: Testing & Documentation',
    data: {
      docs: 'http://localhost:3000/api-docs',
      endpoints: ['POST /api/auth/signup', 'POST /api/auth/login', 'GET /api/auth/me'],
    },
    error: null,
  });
});

app.use('/api/auth', authRoutes);
app.use((req, res) => sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404));
app.use(errorHandler);

module.exports = app;
