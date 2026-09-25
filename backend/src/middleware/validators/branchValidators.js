const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const createBranchRules = [
  body('branch_name').notEmpty().withMessage('branch_name is required'),
  body('table_count').optional().isInt({ min: 0 }).withMessage('table_count must be a positive integer'),
  validate
];

const updateBranchRules = [
  body('table_count').optional().isInt({ min: 0 }).withMessage('table_count must be a positive integer'),
  body('is_active').optional().isBoolean(),
  validate
];

module.exports = { createBranchRules, updateBranchRules };