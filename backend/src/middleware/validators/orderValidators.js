const { body, param, validationResult, query } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const MAX_ID = 2147483647;
const MAX_CASH = 9999999.99;
// Plain text only: no control characters and no angle brackets (React escapes output; this is a second layer).
const SAFE_TEXT = /^[^\u0000-\u001F\u007F<>]*$/;
const ID_TEXT = /^[A-Za-z0-9][A-Za-z0-9\-/ ]*$/;
// A peso amount: a finite number > 0, at most 2 decimals, within a sane limit.
const isPesoAmount = (v) =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= MAX_CASH &&
  Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;

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
  // Optional so older clients and tests that only send payment_method still work (default: paid).
  body('payment_status').optional().isIn(['paid', 'unpaid']).withMessage('payment_status must be paid or unpaid'),
  body('payment_method').custom((value, { req }) => {
    if (req.body.payment_status === 'unpaid') {
      if (value) throw new Error('payment_method must be empty for an unpaid order');
      return true;
    }
    if (!['cash', 'gcash'].includes(value)) throw new Error('payment_method must be cash or gcash');
    return true;
  }),
  // Cash handed over. Only for cash payments. The server checks it against the real total.
  body('amount_tendered').custom((value, { req }) => {
    if (value === undefined || value === null) return true;
    if (req.body.payment_status === 'unpaid') throw new Error('amount_tendered must be empty for an unpaid order');
    if (req.body.payment_method !== 'cash') throw new Error('amount_tendered is only for cash payments');
    if (!isPesoAmount(value)) throw new Error('amount_tendered must be a peso amount up to 9,999,999.99 with at most 2 decimals');
    return true;
  }),
  // Customer name is optional everywhere.
  body('customer_name').optional({ values: 'falsy' }).isString().withMessage('customer_name must be text')
    .bail().trim().isLength({ max: 100 }).withMessage('customer_name must be 100 characters or fewer')
    .matches(SAFE_TEXT).withMessage('customer_name contains characters that are not allowed'),
  body('guest_count').optional({ nullable: true }).isInt({ min: 1, max: 50 }).withMessage('guest_count must be between 1 and 50'),
  body('items').isArray({ min: 1, max: 50 }).withMessage('items must be an array of 1 to 50 lines'),
  body('items.*.item_id').isInt({ min: 1, max: MAX_ID }).withMessage('Each item needs a valid item_id'),
  body('items.*.quantity').isInt({ min: 1, max: 99 }).withMessage('Each item needs a quantity from 1 to 99'),
  body('items.*.note').optional({ values: 'falsy' }).isString().withMessage('An item note must be text')
    .bail().trim().isLength({ max: 120 }).withMessage('An item note must be 120 characters or fewer')
    .matches(SAFE_TEXT).withMessage('An item note contains characters that are not allowed'),
  body('items.*.pwd').optional().isBoolean({ strict: true }).withMessage('pwd must be true or false'),
  body('table_id').optional({ nullable: true }).isInt({ min: 1, max: MAX_ID }).withMessage('Invalid table_id'),
  body('table_id').custom((value, { req }) => {
    if (req.body.order_type === 'dine-in' && !value) throw new Error('table_id is required for dine-in orders');
    if (req.body.order_type !== 'dine-in' && value) throw new Error('table_id is only for dine-in orders');
    return true;
  }),
  // PWD details are optional. If given they must look sane.
  body('pwd').optional({ nullable: true }).isObject().withMessage('pwd must be an object'),
  body('pwd.name').optional({ values: 'falsy' }).isString().withMessage('PWD name must be text')
    .bail().trim().isLength({ max: 100 }).withMessage('PWD name must be 100 characters or fewer')
    .matches(SAFE_TEXT).withMessage('PWD name contains characters that are not allowed'),
  body('pwd.id_number').optional({ values: 'falsy' }).isString().withMessage('PWD ID number must be text')
    .bail().trim().isLength({ max: 50 }).withMessage('PWD ID number must be 50 characters or fewer')
    .matches(ID_TEXT).withMessage('PWD ID number may only contain letters, numbers, dashes, slashes and spaces'),
  validate,
];

const settlePaymentRules = [
  param('id').isInt({ min: 1, max: MAX_ID }).withMessage('Invalid order'),
  body('payment_method').isIn(['cash', 'gcash']).withMessage('payment_method must be cash or gcash'),
  body('amount_tendered').custom((value, { req }) => {
    if (value === undefined || value === null) return true;
    if (req.body.payment_method !== 'cash') throw new Error('amount_tendered is only for cash payments');
    if (!isPesoAmount(value)) throw new Error('amount_tendered must be a peso amount up to 9,999,999.99 with at most 2 decimals');
    return true;
  }),
  validate,
];

const orderStatusRules = [
  param('id').isInt({ min: 1, max: MAX_ID }).withMessage('Invalid order'),
  body('order_status').isIn(['completed']).withMessage('order_status must be completed'),
  validate,
];

module.exports = { placeOrderRules, orderIdRule, listOrdersRules, settlePaymentRules, orderStatusRules };