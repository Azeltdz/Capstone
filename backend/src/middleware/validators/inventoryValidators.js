const { body, param, query, validationResult } = require('express-validator');
const { UNITS } = require('../../constants/units');

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
  body('reorder_threshold').isFloat({ min: 0 }).withMessage('reorder_threshold must be 0 or more'),
  validate,
];

const movementRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid stock record'),
  body('type').isIn(['restock', 'spoilage', 'adjustment']).withMessage('type must be restock, spoilage or adjustment'),
  body('quantity').isFloat({ min: 0, max: 1000000 }).withMessage('quantity must be 0 or more'),
  body('unit').optional().isIn(Object.keys(UNITS)).withMessage('Choose a unit from the list'),
  body('reason').if(body('type').isIn(['spoilage', 'adjustment']))
    .trim().isLength({ min: 3, max: 200 }).withMessage('A reason is required (3 to 200 characters).'),
  body('reason').optional({ nullable: true }).trim().isLength({ max: 200 }).withMessage('Keep the note under 200 characters.'),
  validate,
];

const movementListRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid stock record'),
  query('page').optional().isInt({ min: 1, max: 100000 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  validate,
];

module.exports = { createInventoryRules, updateInventoryRules, movementRules, movementListRules };