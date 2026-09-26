const { body, validationResult } = require('express-validator');
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const createInventoryRules = [
  body('ingredient_id').isInt().withMessage('ingredient_id is required'),
  body('reorder_threshold').isFloat({ min: 0 }).withMessage('reorder_threshold must be a positive number'),
  body('quantity_on_hand').optional().isFloat({ min: 0 }),
  validate,
];

const updateInventoryRules = [
  body('quantity_on_hand').optional().isFloat({ min: 0 }),
  body('reorder_threshold').optional().isFloat({ min: 0 }),
  validate,
];

const adjustInventoryRules = [
  body('delta').isFloat().withMessage('delta is required and must be a number (positive or negative)'),
  validate,
];

module.exports = { createInventoryRules, updateInventoryRules, adjustInventoryRules };