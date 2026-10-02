const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { findUserById } = require('../models/userModel');

const CACHE_MS = 15 * 1000;
const cache = new Map();

async function loadUser(id) {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.user;
  const user = await findUserById(id);
  cache.set(id, { user, at: Date.now() });
  return user;
}

function invalidateUserCache(id) {
  cache.delete(Number(id));
}

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
    const user = await loadUser(decoded.user_id);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Account inactive or not found' });
    }
    req.user = { user_id: user.user_id, role: user.role, branch_id: user.branch_id };
    next();
  } catch (err) {
    next(err); // a database problem is a 500, not a "bad token" that logs everyone out
  }
}

module.exports = { protect, invalidateUserCache };