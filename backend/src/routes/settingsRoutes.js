const express = require('express');
const router = express.Router();
const c = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { updateSettingsRules, receiptSettingsRules } = require('../middleware/validators/settingsValidators');

router.use(protect, requireRole('owner'));

router.get('/settings', c.getSettings);
router.put('/settings', updateSettingsRules, c.updateSettings);
router.get('/settings/security-status', c.getSecurityStatus);

router.get('/branches/:branchId/settings/receipt', c.getBranchReceiptSettings);
router.put('/branches/:branchId/settings/receipt', receiptSettingsRules, c.updateBranchReceiptSettings);

module.exports = router;