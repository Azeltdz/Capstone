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

async function createBranch({ branch_name, location, contact_number, table_count }) {
  const { rows } = await pool.query(
    `INSERT INTO branches (branch_name, location, contact_number, table_count)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
    [branch_name, location, contact_number, table_count ?? 0]
  );
  return rows[0];
}

async function updateBranch(id, { branch_name, location, contact_number, table_count, is_active }) {
  const { rows } = await pool.query(
    `UPDATE branches
      SET branch_name = COALESCE($1, branch_name),
          location = COALESCE($2, location),
          contact_number = COALESCE($3, contact_number),
          table_count = COALESCE($4, table_count),
          is_active = COALESCE($5, is_active)
      WHERE branch_id = $6
     RETURNING *`,
    [branch_name, location, contact_number, table_count, is_active, id]
  );
  return rows[0];
}

module.exports = { getAllBranches, getBranchById, createBranch, updateBranch };