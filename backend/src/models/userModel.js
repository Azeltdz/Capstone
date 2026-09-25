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

module.exports = { findUserByUsername, findUserById, createUser };