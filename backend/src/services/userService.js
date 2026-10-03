const bcrypt = require('bcrypt');
const { findUserByUsername, createUser } = require('../models/userModel');
const { getBranchById } = require ('../models/branchModel');

async function createStaffAccount({ branch_id, full_name, user_name, password, role }) {
  if (role === 'cashier' && !branch_id) {
    const err = new Error('Cashier accounts must be assigned a branch');
    err.statusCode = 400;
    throw err;
  }

  if (role === 'cashier') {
    const branch = await getBranchById(branch_id);
    if (!branch) { const err = new Error('Branch not found'); err.statusCode = 400; throw err; }
    if (!branch.is_active) {
      const err = new Error('That branch is deactivated. Choose an active branch.');
      err.statusCode = 400;
      throw err;
    }
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