const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registerRules = [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('user_name').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['owner', 'cashier']).withMessage('Role must be owner or cashier'),
  validate
];

const loginRules = [
  body('user_name').isString().trim().notEmpty().withMessage('Enter your username'),
  body('password').isString().notEmpty().withMessage('Enter your password'),
  body('portal').isIn(['cashier', 'owner']).withMessage('Invalid sign-in page'),
  validate,
];

module.exports = { registerRules, loginRules };