const { query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const transactionQueryRules = [
  query('period').optional().isIn(['today', '7d', '30d', '365d']).withMessage('period must be today, 7d, 30d or 365d'),
  query('branchId').optional().isInt({ min: 1 }).withMessage('branchId must be a positive whole number'),
  query('orderType').optional().isIn(['dine-in', 'take-out', 'delivery']).withMessage('orderType is invalid'),
  query('search').optional().isString().isLength({ max: 100 }).withMessage('search must be under 100 characters'),
  query('sort').optional().isIn(['time', 'total']).withMessage('sort must be time or total'),
  query('dir').optional().isIn(['asc', 'desc']).withMessage('dir must be asc or desc'),
  query('page').optional().isInt({ min: 1, max: 100000 }).withMessage('page must be 1 or more'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('pageSize must be between 1 and 100'),
  validate,
];

module.exports = { transactionQueryRules };