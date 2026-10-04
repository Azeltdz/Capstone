const express = require('express');
const router = express.Router();

const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { registerRules, loginRules } = require('../middleware/validators/authValidators');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many failed attempts. Try again in 15 minutes.' },
});

router.post('/login', loginLimiter, loginRules, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;