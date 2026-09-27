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
  validate,
];

const receiptSettingsRules = [
  body('business_name').optional().isString().notEmpty(),
  body('footer_message').optional().isString(),
  validate,
];

module.exports = { updateSettingsRules, receiptSettingsRules };