require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`✅ NeuroFive API running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`❤️  Health check: http://localhost:${PORT}/health`);
});

// Handle uncaught exceptions — keeps server alive in production
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down gracefully', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION — shutting down gracefully', { error: err.message });
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
