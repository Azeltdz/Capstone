const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  connectionString: config.databaseURI,
  ssl: { rejectUnauthorized: false } // required for Supabase pooler
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;