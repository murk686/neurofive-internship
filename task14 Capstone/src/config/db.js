const { Sequelize } = require('sequelize');
const config = require('./config');

const env = process.env.NODE_ENV || 'development';
const envConfig = config[env];

let sequelize;
if (envConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[envConfig.use_env_variable], envConfig);
} else {
  sequelize = new Sequelize(
    envConfig.database,
    envConfig.username,
    envConfig.password,
    envConfig
  );
}

module.exports = sequelize;
