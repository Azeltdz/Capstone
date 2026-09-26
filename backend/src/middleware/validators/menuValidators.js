const { body, validationResult } = require('express-validator');
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const ingredientRules = [
  body('ingredient_name').notEmpty().withMessage('ingredient_name is required'),
  body('unit').notEmpty().withMessage('unit is required'),
  body('unit_cost').isFloat({ min: 0 }).withMessage('unit_cost must be a positive number'),
  validate,
];

const menuItemRules = [
  body('item_name').notEmpty().withMessage('item_name is required'),
  body('selling_price').isFloat({ min: 0 }).withMessage('selling_price must be a positive number'),
  validate,
];

const bomRules = [
  body('ingredient_id').isInt().withMessage('ingredient_id is required'),
  body('quantity_per_unit').isFloat({ min: 0.001 }).withMessage('quantity_per_unit must be greater than 0'),
  validate,
];

module.exports = { ingredientRules, menuItemRules, bomRules };