const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const placeOrderRules = [
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

module.exports = { placeOrderRules };