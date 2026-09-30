const pool = require('../config/db');

async function getAllBranches() {
  const { rows } = await pool.query(
    'SELECT * FROM branches ORDER BY branch_id ASC'
  );
  return rows;
}

async function getBranchById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM branches WHERE branch_id = $1',
    [id]
  );
  return rows[0];
}

async function createBranch({ branch_name, location, contact_number }) {
  const { rows } = await pool.query(
    `INSERT INTO branches (branch_name, location, contact_number)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
    [branch_name, location, contact_number]
  );
  return rows[0];
}

async function updateBranch(id, { branch_name, location, contact_number, is_active }) {
  const { rows } = await pool.query(
    `UPDATE branches
      SET branch_name = COALESCE($1, branch_name),
          location = COALESCE($2, location),
          contact_number = COALESCE($3, contact_number),
          is_active = COALESCE($4, is_active)
      WHERE branch_id = $5
     RETURNING *`,
    [branch_name, location, contact_number, is_active, id]
  );
  return rows[0];
}

async function getBranchesWithStats() {
  const { rows } = await pool.query(`
    SELECT b.*,
      (SELECT COUNT(*) FROM users u WHERE u.branch_id = b.branch_id AND u.is_active = true) AS staff_count,
      COALESCE((
        SELECT SUM(t.total_amount) FROM transactions t
        WHERE t.branch_id = b.branch_id
          AND DATE(t.transaction_at AT TIME ZONE 'Asia/Manila') = (NOW() AT TIME ZONE 'Asia/Manila')::date
      ), 0) AS sales_today
    FROM branches b
    ORDER BY b.branch_name ASC
  `);
  return rows;
}

async function deleteBranchById(id) {
  try {
    const { rows } = await pool.query('DELETE FROM branches WHERE branch_id = $1 RETURNING *', [id]);
    return rows[0];
  } catch (err) {
    if (err.code === '23503') {
      const e = new Error('Cannot delete branch: it still has staff, tables, inventory, or transaction records.');
      e.statusCode = 400;
      throw e;
    }
    throw err;
  }
}

module.exports = { getAllBranches, getBranchById, createBranch, updateBranch, getBranchesWithStats, deleteBranchById };