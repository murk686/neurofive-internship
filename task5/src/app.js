const express = require('express');
const { errorHandler } = require('./middleware/errorHandler');
const { sendError } = require('./utils/response');
const authRoutes = require('./routes/auth');

const app = express();

// Parse JSON — malformed JSON errors are caught by errorHandler automatically
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'NeuroFive Backend API — Week 3', data: null, error: null });
});

// Routes
app.use('/api/auth', authRoutes);

// 404 — unknown routes
app.use((req, res) => {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
});

// Global error handler — MUST be last
app.use(errorHandler);

module.exports = app;
