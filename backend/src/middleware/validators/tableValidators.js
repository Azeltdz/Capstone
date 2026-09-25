const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const createTableRules = [
  body('table_number').isInt({ min: 1 }).withMessage('table_number must be a positive integer'),
  body('guest_capacity').optional().isInt({ min: 1 }).withMessage('guest_capacity must be a positive integer'),
  validate,
];

const bulkCreateRules = [
  body('count').isInt({ min: 1, max: 50 }).withMessage('count must be between 1 and 50'),
  body('guest_capacity').optional().isInt({ min: 1 }),
  validate,
];

const statusRules = [
  body('status').isIn(['available', 'occupied']).withMessage("status must be 'available' or 'occupied'"),
  validate,
];

const capacityRules = [
  body('guest_capacity').isInt({ min: 1 }).withMessage('guest_capacity must be a positive integer'),
  validate,
];

module.exports = { createTableRules, bulkCreateRules, statusRules, capacityRules };