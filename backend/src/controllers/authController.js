const bcrypt = require('bcrypt');
const { findUserByUsername, findUserById, createUser } = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const config = require('../config/config');

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);
const BAD_LOGIN = { message: 'Invalid credentials' };

async function login(req, res, next) {
  try {
    const { user_name, password, portal } = req.body;
    const user = await findUserByUsername(user_name);
    const passwordOk = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

    if (!user || !passwordOk || !user.is_active || user.role !== portal) {
      return res.status(401).json(BAD_LOGIN);
    }

    if (user.role === 'cashier' && (!user.branch_id || user.branch_is_active === false)) {
      return res.status(403).json({
        message: user.branch_id
          ? 'Your branch is deactivated. Please contact the owner.'
          : 'No branch is assigned to this account. Please contact the owner.',
        code: 'BRANCH_INACTIVE',
      });
    }

    res.json({
      message: 'Login successful',
      token: generateToken(user),
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        user_name: user.user_name,
        role: user.role,
        branch_id: user.branch_id,
      },
    });
  } catch (err) {
    next(err);
  }
}
async function getMe(req, res, next) {
  try {
    const user = await findUserById(req.user.user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  res.clearCookie('token').json({ message: 'Logged out' });
}

module.exports = { login, getMe, logout };