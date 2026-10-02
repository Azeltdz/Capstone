const pool = require('./db');

(async () => {
  for (let i = 1; i <= 5; i++) {
    const t = Date.now();
    try {
      await pool.query('SELECT 1');
      console.log(`#${i} ok in ${Date.now() - t} ms`);
    } catch (e) {
      console.log(`#${i} FAILED after ${Date.now() - t} ms: ${e.message}`);
    }
  }
  await pool.end();
})();