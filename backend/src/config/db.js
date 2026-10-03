const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  connectionString: config.databaseURI,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.withTransaction = async (fn) => {
  const client = await pool.connect();
  let destroy = false;
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    destroy = TRANSIENT.test(err?.message ?? '');
    try { await client.query('ROLLBACK'); } catch { destroy = true; }
    throw err;
  } finally {
    client.release(destroy);
  }
};

module.exports = pool;