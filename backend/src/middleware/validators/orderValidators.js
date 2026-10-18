const { body, param, validationResult, query } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const MAX_ID = 2147483647;

const listOrdersRules = [
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must look like 2026-10-02'),
  query('order_type').optional().isIn(['dine-in', 'take-out', 'delivery']).withMessage('order_type is invalid'),
  query('payment_status').optional().isIn(['paid', 'unpaid']).withMessage('payment_status is invalid'),
  query('search').optional().isString().isLength({ max: 100 }).withMessage('search must be under 100 characters'),
  validate,
];

const orderIdRule = [param('id').isInt({ min: 1, max: MAX_ID }).withMessage('Invalid order'), validate];

const placeOrderRules = [
  body('order_type').isIn(['dine-in', 'take-out', 'delivery']).withMessage('Invalid order_type'),
  body('payment_status').optional().isIn(['paid', 'unpaid']).withMessage('payment_status must be paid or unpaid'),
  body('payment_method').custom((value, { req }) => {
    if (req.body.payment_status === 'unpaid') {
      if (value) throw new Error('payment_method must be empty for an unpaid order');
      return true;
    }
    if (!['cash', 'gcash'].includes(value)) throw new Error('payment_method must be cash or gcash');
    return true;
  }),
  body('customer_name').optional({ nullable: true }).isString().trim().isLength({ min: 1, max: 100 }).withMessage('customer_name must be 1-100 characters'),
  body('customer_name').custom((value, { req }) => {
    if (req.body.payment_status === 'unpaid' && !(typeof value === 'string' && value.trim())) {
      throw new Error('customer_name is required for an unpaid order');
    }
    return true;
  }),
  body('guest_count').optional({ nullable: true }).isInt({ min: 1, max: 50 }).withMessage('guest_count must be between 1 and 50'),
  body('items').isArray({ min: 1, max: 50 }).withMessage('items must be an array of 1 to 50 lines'),
  body('items.*.item_id').isInt({ min: 1, max: MAX_ID }).withMessage('Each item needs a valid item_id'),
  body('items.*.quantity').isInt({ min: 1, max: 99 }).withMessage('Each item needs a quantity from 1 to 99'),
  body('items.*.note').optional({ nullable: true }).isString().trim().isLength({ max: 120 }).withMessage('An item note must be 120 characters or fewer'),
  body('items.*.pwd').optional().isBoolean().withMessage('pwd must be true or false'),
  body('table_id').optional({ nullable: true }).isInt({ min: 1, max: MAX_ID }).withMessage('Invalid table_id'),
  body('table_id').custom((value, { req }) => {
    if (req.body.order_type === 'dine-in' && !value) {
      throw new Error('table_id is required for dine-in orders');
    }
    return true;
  }),
  body('pwd').custom((value, { req }) => {
    const anyPwd = Array.isArray(req.body.items) && req.body.items.some((i) => i && i.pwd === true);
    if (!anyPwd) return true;
    const name = value && value.name;
    const idNumber = value && value.id_number;
    if (typeof name !== 'string' || !name.trim() || name.length > 100) throw new Error('PWD name is required (max 100 characters)');
    if (typeof idNumber !== 'string' || !idNumber.trim() || idNumber.length > 50) throw new Error('PWD ID number is required (max 50 characters)');
    return true;
  }),
  validate,
];

const settlePaymentRules = [
  param('id').isInt({ min: 1, max: MAX_ID }).withMessage('Invalid order'),
  body('payment_method').isIn(['cash', 'gcash']).withMessage('payment_method must be cash or gcash'),
  validate,
];

const orderStatusRules = [
  param('id').isInt({ min: 1, max: MAX_ID }).withMessage('Invalid order'),
  body('order_status').isIn(['completed']).withMessage('order_status must be completed'),
  validate,
];

module.exports = { placeOrderRules, orderIdRule, listOrdersRules, settlePaymentRules, orderStatusRules };