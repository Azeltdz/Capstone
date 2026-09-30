const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const branchIdRule = [param('branchId').isInt({ min: 1 }).withMessage('Invalid branch'), validate];
const tableIdRule = [param('id').isInt({ min: 1 }).withMessage('Invalid table'), validate];

const layoutRules = [
  param('branchId').isInt({ min: 1 }).withMessage('Invalid branch'),
  body('count').isInt({ min: 0, max: 50 }).withMessage('Number of tables must be between 0 and 50'),
  body('capacities').optional().isArray({ max: 50 }).withMessage('capacities must be a list'),
  body('capacities.*.table_number').isInt({ min: 1, max: 50 }).withMessage('Invalid table number'),
  body('capacities.*.guest_capacity').isInt({ min: 1, max: 50 }).withMessage('Seats must be between 1 and 50'),
  validate,
];

module.exports = { branchIdRule, tableIdRule, layoutRules };