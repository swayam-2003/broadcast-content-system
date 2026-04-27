const fs = require('fs');
const path = require('path');
const { getClient } = require('../utils/db');
const logger = require('../utils/logger');

async function runMigrations() {
  const client = await getClient();
  
  try {
    const sqlFile = path.join(__dirname, '001_initial_schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    logger.info('Running database migrations...');
    await client.query(sql);
    logger.info('Migrations completed successfully');
  } catch (err) {
    logger.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

runMigrations().then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(1);
});
