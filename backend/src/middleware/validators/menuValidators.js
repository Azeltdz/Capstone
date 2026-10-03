const { body, param, validationResult } = require('express-validator');
const { UNITS } = require('../../constants/units');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const ingredientRules = [
  body('ingredient_name').notEmpty().withMessage('ingredient_name is required'),
  body('unit').isIn(Object.keys(UNITS)).withMessage('Choose a unit from the list'),
  body('unit_cost').isFloat({ min: 0 }).withMessage('unit_cost must be a positive number'),
  validate,
];

const menuIdRule = [param('id').isInt({ min: 1 }).withMessage('Invalid menu item'), validate];

const menuItemRules = [
  body('item_name').trim().notEmpty().withMessage('Item name is required')
    .isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('category').optional({ checkFalsy: true }).trim().isLength({ max: 50 })
    .withMessage('Category must be under 50 characters'),
  body('selling_price').isFloat({ min: 0.01, max: 1000000 }).withMessage('Price must be greater than 0'),
  body('is_available').optional().isBoolean().withMessage('is_available must be true or false'),
  validate,
];

const menuItemUpdateRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid menu item'),
  body('item_name').optional().trim().notEmpty().withMessage('Item name cannot be empty')
    .isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('category').optional({ checkFalsy: true }).trim().isLength({ max: 50 })
    .withMessage('Category must be under 50 characters'),
  body('selling_price').optional().isFloat({ min: 0.01, max: 1000000 }).withMessage('Price must be greater than 0'),
  body('is_available').optional().isBoolean().withMessage('is_available must be true or false'),
  validate,
];

const bomRules = [
  body('ingredient_id').isInt().withMessage('ingredient_id is required'),
  body('quantity_per_unit').isFloat({ min: 0.001 }).withMessage('quantity_per_unit must be greater than 0'),
  validate,
];

const recipeRules = [
  param('itemId').isInt({ min: 1 }).withMessage('Invalid menu item'),
  body('lines').isArray().withMessage('lines must be a list').bail()
    .custom((v) => v.length <= 50).withMessage('A recipe can have at most 50 ingredients'),
  body('lines.*.ingredient_id').isInt({ min: 1 }).withMessage('Each line needs an ingredient'),
  body('lines.*.quantity_per_unit').isFloat({ max: 100000 }).withMessage('Each quantity must be a number').bail()
    .custom((v) => Number(v) >= 0.001).withMessage('Each quantity must be at least 0.001'),
  body('selling_price').optional().isFloat({ min: 0.01, max: 1000000 }).withMessage('Price must be greater than 0'),
  validate,
];

const ingredientUpdateRules = [
  body('ingredient_name').optional().trim().notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('unit').optional().isIn(Object.keys(UNITS)).withMessage('Choose a unit from the list'),
  body('unit_cost').optional().isFloat({ min: 0, max: 1000000 }).withMessage('unit_cost must be 0 or more'),
  body('supplier_name').optional({ nullable: true }).isString().isLength({ max: 100 })
    .withMessage('Supplier must be under 100 characters'),
  validate,
];

module.exports = { ingredientRules, menuIdRule, menuItemRules, menuItemUpdateRules, bomRules, recipeRules, ingredientUpdateRules };