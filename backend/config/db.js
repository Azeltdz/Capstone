const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Supabase pooler
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

console.log(process.env.DATABASE_URL);

module.exports = pool;