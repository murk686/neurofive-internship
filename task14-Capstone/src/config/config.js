// Sequelize-CLI config. Loaded by .sequelizerc. Supports either discrete
// DB_* vars or a single DATABASE_URL (common on Render/Railway/Heroku-style PaaS).
require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  quiet: true,
});

const pg = require('pg');

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  dialectModule: pg,
  logging: false,
};

function fromUrl(url, extra = {}) {
  return {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
    ...extra,
  };
}

module.exports = {
  development: process.env.DATABASE_URL ? fromUrl(process.env.DATABASE_URL) : base,
  test: {
    ...base,
    database: process.env.DB_NAME || 'eventbooking_test',
    logging: false,
  },
  // Production: if DATABASE_URL is set (typical for hosted providers like
  // Render/Railway), connect via URL with SSL required. Otherwise (e.g. a
  // self-hosted docker-compose Postgres on the same network), use discrete
  // DB_* vars with no forced SSL.
  production: process.env.DATABASE_URL ? fromUrl(process.env.DATABASE_URL) : base,
};