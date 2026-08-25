require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');

// Export for Vercel serverless
module.exports = app;

// Local development only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    logger.info(`✅ NeuroFive API running on port ${PORT}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`❤️  Health check: http://localhost:${PORT}/health`);
  });

  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION', { error: err.message });
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received — shutting down gracefully');
    server.close(() => process.exit(0));
  });
}
