const { Pool } = require('pg');
const config = require('../config');
const logger = require('./logger');

const pool = new Pool(config.db);

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const query = (text, params) => {
  return pool.query(text, params);
};

const getClient = async () => {
  return pool.connect();
};

module.exports = {
  query,
  getClient,
  pool,
};
