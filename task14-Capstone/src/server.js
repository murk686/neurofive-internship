require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  quiet: true,
});

const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    const server = app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
      console.log(`API docs available at http://localhost:${PORT}/api/docs`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await sequelize.close();
        process.exit(0);
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Unable to start server:', err);
    process.exit(1);
  }
}

start();
