const express = require('express');
const router = express.Router();
const c = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { transactionQueryRules } = require('../middleware/validators/transactionValidators');

router.use(protect, requireRole('owner'), transactionQueryRules);

router.get('/', c.list);
router.get('/summary', c.summary);
router.get('/trend', c.trend);
router.get('/export', c.exportCsv);

module.exports = router;