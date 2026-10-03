const { body, param, validationResult, query } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const listOrdersRules = [
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must look like 2026-10-02'),
  query('order_type').optional().isIn(['dine-in', 'take-out', 'delivery']).withMessage('order_type is invalid'),
  query('search').optional().isString().isLength({ max: 100 }).withMessage('search must be under 100 characters'),
  validate,
];

const orderIdRule = [param('id').isInt({ min: 1 }).withMessage('Invalid order'), validate];

const placeOrderRules = [
  body("customer_name").optional({ nullable: true }).isString().trim().isLength({ min: 1, max: 100 }).withMessage("customer_name must be 1-100 characters"),
  body("guest_count").optional({ nullable: true }).isInt({ min: 1, max: 50 }).withMessage("guest_count must be between 1 and 50"),
  body('order_type').isIn(['dine-in', 'take-out', 'delivery']).withMessage('Invalid order_type'),
  body('payment_method').notEmpty().withMessage('payment_method is required'),
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.item_id').isInt().withMessage('Each item needs a valid item_id'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item needs quantity >= 1'),
  body('table_id').custom((value, { req }) => {
    if (req.body.order_type === 'dine-in' && !value) {
      throw new Error('table_id is required for dine-in orders');
    }
    return true;
  }),
  validate,
];

module.exports = { placeOrderRules, orderIdRule, listOrdersRules };