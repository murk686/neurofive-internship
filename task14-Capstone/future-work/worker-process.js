require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  quiet: true,
});

const { sequelize } = require('./models');
const { startWorkers } = require('./jobs/worker');

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Worker: database connection established.');

    const { emailWorker, paymentExpiryWorker } = startWorkers();
    console.log('Worker: listening for email + payment-expiry jobs.');

    const shutdown = async (signal) => {
      console.log(`\nWorker: ${signal} received. Shutting down gracefully...`);
      await emailWorker.close();
      await paymentExpiryWorker.close();
      await sequelize.close();
      process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Worker: failed to start:', err);
    process.exit(1);
  }
}

start();
