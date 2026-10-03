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

const invalidateUserCache = (id) => cache.delete(Number(id));
const clearUserCache = () => cache.clear();
const deny = (res, code, message) => res.status(401).json({ message, code });

async function protect(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
  if (!token) return deny(res, 'SESSION_EXPIRED', 'Not authenticated');

  let decoded;
  try {
    decoded = jwt.verify(token, config.accessTokenSecret);
  } catch {
    return deny(res, 'SESSION_EXPIRED', 'Invalid or expired token');
  }

  try {
    const user = await loadUser(decoded.user_id);
    if (!user || !user.is_active) return deny(res, 'ACCOUNT_INACTIVE', 'Account inactive or not found');

    if (user.role === 'cashier' && (!user.branch_id || user.branch_is_active === false)) {
      return deny(res, 'BRANCH_INACTIVE', 'Your branch is deactivated');
    }

    req.user = { user_id: user.user_id, role: user.role, branch_id: user.branch_id };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { protect, invalidateUserCache, clearUserCache };