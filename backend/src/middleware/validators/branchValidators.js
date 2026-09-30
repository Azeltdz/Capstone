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
  validate
];

const updateBranchRules = [
  body('is_active').optional().isBoolean(),
  validate
];

module.exports = { createBranchRules, updateBranchRules };