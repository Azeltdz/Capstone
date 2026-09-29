const { body, validationResult } = require('express-validator');
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const updateSettingsRules = [
  body('moving_average_window').optional().isInt({ min: 1, max: 30 }).withMessage('moving_average_window must be 1-30'),
  body('trend_threshold').optional().isFloat({ min: 0, max: 100 }).withMessage('trend_threshold must be 0-100'),
  body('anomaly_threshold').optional().isFloat({ min: 0, max: 100 }).withMessage('anomaly_threshold must be 0-100'),
  body('low_stock_default_kg').optional().isFloat({ min: 0 }).withMessage('low_stock_default_kg must be 0 or more'),
  body('low_stock_default_pcs').optional().isFloat({ min: 0 }).withMessage('low_stock_default_pcs must be 0 or more'),
  body('lead_time_days').optional().isInt({ min: 0, max: 30 }).withMessage('lead_time_days must be 0-30'),
  body('safety_stock_days').optional().isInt({ min: 0, max: 30 }).withMessage('safety_stock_days must be 0-30'),
  validate,
];

const receiptSettingsRules = [
  body('business_name').optional().isString().notEmpty(),
  body('footer_message').optional().isString(),
  validate,
];

module.exports = { updateSettingsRules, receiptSettingsRules };