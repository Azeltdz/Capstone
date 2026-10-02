const pool = require('./db');
const { getOrderById } = require('../models/orderModel');

(async () => {
  const id = Number(process.argv[2]);
  for (let i = 1; i <= 3; i++) {
    const t = Date.now();
    try {
      const order = await getOrderById(id);
      console.log(`#${i} ok in ${Date.now() - t} ms (${order?.items?.length ?? 0} items)`);
    } catch (e) {
      console.log(`#${i} FAILED after ${Date.now() - t} ms: ${e.message}`);
    }
  }
  await pool.end();
})();