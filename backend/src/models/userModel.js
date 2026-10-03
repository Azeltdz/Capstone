const pool = require('../config/db');

async function findUserByUsername(username) {
  const { rows } = await pool.query(
    `SELECT u.*, b.is_active AS branch_is_active
      FROM users u LEFT JOIN branches b ON b.branch_id = u.branch_id
      WHERE u.user_name = $1`,
    [username]
  );
  return rows[0];
}

async function findUserById(id) {
  const { rows } = await pool.query(
    `SELECT u.user_id, u.branch_id, u.full_name, u.user_name, u.role, u.is_active,
            b.is_active AS branch_is_active
      FROM users u LEFT JOIN branches b ON b.branch_id = u.branch_id
      WHERE u.user_id = $1`,
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

async function updateUser(id, fields) {
  const has = (k) => Object.prototype.hasOwnProperty.call(fields, k);
  const { rows } = await pool.query(
    `UPDATE users SET
        full_name = COALESCE($1, full_name),
        branch_id = CASE WHEN $2::boolean THEN $3::int ELSE branch_id END,
        role = COALESCE($4, role),
        is_active = COALESCE($5, is_active)
      WHERE user_id = $6
      RETURNING user_id, branch_id, full_name, user_name, role, is_active`,
    [fields.full_name ?? null, has('branch_id'), fields.branch_id ?? null, fields.role ?? null, fields.is_active ?? null, id]
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