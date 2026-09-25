const bcrypt = require('bcrypt');
const { findUserByUsername, createUser } = require('../models/userModel');

async function createStaffAccount({ branch_id, full_name, user_name, password, role }) {
  if (role === 'cashier' && !branch_id) {
    const err = new Error('Cashier accounts must be assigned a branch');
    err.statusCode = 400;
    throw err;
  }

  const existing = await findUserByUsername(user_name);
  if (existing) {
    const err = new Error('Username already taken');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  return createUser({
    branch_id: role === 'owner' ? null : branch_id,
    full_name,
    user_name,
    hashedPassword,
    role,
  });
}

module.exports = { createStaffAccount };