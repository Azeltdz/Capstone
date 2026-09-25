const jwt = require('jsonwebtoken');
const config = require('../config/config');

function generateToken(user) {
  return jwt.sign(
    { user_id: user.user_id, role: user.role, branch_id: user.branch_id },
    config.accessTokenSecret,
    { expiresIn: '8h' }
  );
}

module.exports = generateToken;