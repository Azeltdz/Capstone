const pool = require('../config/db');

async function getTablesByBranch(branchId) {
  const { rows } = await pool.query(
    'SELECT * FROM tables WHERE branch_id = $1 ORDER BY table_number ASC',
    [branchId]
  );
  return rows;
}

async function getTableById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM tables WHERE table_id = $1',
    [id]
  );
  return rows[0];
}

async function findTableByNumber(branchId, tableNumber) {
  const { rows } = await pool.query(
    'SELECT * FROM tables WHERE branch_id = $1 AND table_number = $2',
    [branchId, tableNumber]
  );
  return rows[0];
}

async function createTable({ branch_id, table_number, guest_capacity }) {
  const { rows } = await pool.query(
    `INSERT INTO tables (branch_id, table_number, guest_capacity, status)
      VALUES ($1, $2, $3, 'available')
      RETURNING *`,
    [branch_id, table_number, guest_capacity ?? 4]
  );
  return rows[0];
}

async function updateTableStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE tables SET status = $1 WHERE table_id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0];
}

async function updateTableCapacity(id, guest_capacity) {
  const { rows } = await pool.query(
    `UPDATE tables SET guest_capacity = $1 WHERE table_id = $2 RETURNING *`,
    [guest_capacity, id]
  );
  return rows[0];
}

async function deleteTable(id) {
  const { rows } = await pool.query(
    'DELETE FROM tables WHERE table_id = $1 RETURNING *',
    [id]
  );
  return rows[0];
}

module.exports = {
  getTablesByBranch,
  getTableById,
  findTableByNumber,
  createTable,
  updateTableStatus,
  updateTableCapacity,
  deleteTable,
};