const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};
const MAX_ID = 2147483647;
const SAFE_TEXT = /^[^\u0000-\u001F\u007F<>]*$/;
// A stock quantity: a finite number > 0, at most 3 decimals, within a sane limit.
const isQuantity = (v) =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 1000000 &&
  Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6;

const createTransferRules = [
  body('ingredient_id').isInt({ min: 1, max: MAX_ID }).withMessage('Choose an ingredient').toInt(),
  body('from_branch_id').isInt({ min: 1, max: MAX_ID }).withMessage('Choose the sending branch').toInt(),
  body('to_branch_id').isInt({ min: 1, max: MAX_ID }).withMessage('Choose the receiving branch').toInt(),
  body('quantity').custom((v) => {
    if (!isQuantity(v)) throw new Error('Quantity must be a number above 0 with at most 3 decimals');
    return true;
  }),
  body('note').optional({ values: 'falsy' }).isString().bail().trim().isLength({ max: 200 })
    .withMessage('Note must be 200 characters or fewer')
    .matches(SAFE_TEXT).withMessage('Note contains characters that are not allowed'),
  validate,
];

module.exports = { createTransferRules };