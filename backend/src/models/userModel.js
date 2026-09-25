const pool = require('../config/db');

async function findUserByUsername(username) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE user_name = $1',
    [username]
  );
  return rows[0];
}

async function findUserById(id) {
  const { rows } = await pool.query(
    'SELECT user_id, branch_id, full_name, user_name, role, is_active FROM users WHERE user_id = $1',
    [id]
  );
  return rows[0];
}

async function createUser({ branch_id, full_name, user_name, hashedPassword, role }) {
  const { rows } = await pool.query(
    `INSERT INTO users (branch_id, full_name, user_name, password, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, branch_id, full_name, user_name, role, is_active`,
    [branch_id, full_name, user_name, hashedPassword, role]
  );
  return rows[0];
}

async function getAllStaff() {
  const { rows } = await pool.query(
    `SELECT user_id, branch_id, full_name, user_name, role, is_active, created_at
      FROM users ORDER BY user_id ASC`
  );
  return rows;
}

async function getStaffByBranch(branchId) {
  const { rows } = await pool.query(
    `SELECT user_id, branch_id, full_name, user_name, role, is_active, created_at
      FROM users WHERE branch_id = $1 ORDER BY user_id ASC`,
    [branchId]
  );
  return rows;
}

async function updateUser(id, { full_name, branch_id, role, is_active }) {
  const { rows } = await pool.query(
    `UPDATE users
      SET full_name = COALESCE($1, full_name),
          branch_id = $2,
          role = COALESCE($3, role),
          is_active = COALESCE($4, is_active)
      WHERE user_id = $5
      RETURNING user_id, branch_id, full_name, user_name, role, is_active`,
    [full_name, branch_id, role, is_active, id]
  );
  return rows[0];
}

module.exports = {
  findUserByUsername,
  findUserById,
  createUser,
  getAllStaff,
  getStaffByBranch,
  updateUser,
};