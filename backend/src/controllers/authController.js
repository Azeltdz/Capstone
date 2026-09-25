const bcrypt = require('bcrypt');
const { findUserByUsername, findUserById, createUser } = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const config = require('../config/config');

async function register(req, res, next) {
  try {
    const { branch_id, full_name, user_name, password, role } = req.body;

    if (!full_name || !user_name || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (role === 'cashier' && !branch_id) {
      return res.status(400).json({ message: 'Cashier accounts must be assigned a branch' });
    }

    const existing = await findUserByUsername(user_name);
    if (existing) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser({
      branch_id: role === 'owner' ? null : branch_id,
      full_name,
      user_name,
      hashedPassword,
      role
    });

    res.status(201).json({ message: 'Account created', user: newUser });
  } catch (err) {
    next(err);
  }
}

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

module.exports = { register, login, getMe, logout };