const bcrypt = require('bcrypt');
const { findUserByUsername, findUserById, createUser } = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const config = require('../config/config');

async function login(req, res, next) {
  try {
    const { user_name, password } = req.body;
    if (!user_name || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const user = await findUserByUsername(user_name);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (user.role === 'cashier' && (!user.branch_id || user.branch_is_active === false)) {
      return res.status(403).json({
        message: user.branch_id
          ? 'Your branch is deactivated. Please contact the owner.'
          : 'No branch is assigned to this account. Please contact the owner.',
        code: 'BRANCH_INACTIVE',
      });
    }

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'development',
        sameSite: 'none',
        maxAge: 8 * 60 * 60 * 1000
      })
      .json({
        message: 'Login successful',
        token,
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          user_name: user.user_name,
          role: user.role,
          branch_id: user.branch_id
        }
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