require('dotenv').config();
const express = require('express');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler } = require('./middleware/errorHandler');
const { sendError, sendSuccess } = require('./utils/response');
const authRoutes = require('./routes/auth');

const app = express();

app.use(express.json());
app.use(requestLogger);

// Health check endpoint — for UptimeRobot monitoring
app.get('/health', (req, res) => {
  return sendSuccess(res, {
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  }, 200, 'API is healthy');
});

app.get('/', (req, res) => {
  return sendSuccess(res, {
    name: 'NeuroFive Backend API',
    version: '1.0.0',
    task: 'Week 5 Task 12 — Production Deployment',
    docs: '/api-docs',
    health: '/health',
    endpoints: ['POST /api/auth/signup', 'POST /api/auth/login', 'GET /api/auth/me'],
  }, 200, 'NeuroFive Backend API is running');
});

app.use('/api/auth', authRoutes);
app.use((req, res) => sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404));
app.use(errorHandler);

module.exports = app;
