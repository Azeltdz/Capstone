const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { findUserById } = require('../models/userModel');

async function protect(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  let decoded;
  try {
    decoded = jwt.verify(token, config.accessTokenSecret);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await findUserById(decoded.user_id);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Account inactive or not found' });
    }
    req.user = { user_id: user.user_id, role: user.role, branch_id: user.branch_id };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { protect };