const express = require('express');
const router = express.Router();
const { listTables, releaseTable, saveLayout } = require('../controllers/tableController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { branchIdRule, tableIdRule, layoutRules } = require('../middleware/validators/tableValidators');

router.get('/branches/:branchId/tables', protect, branchIdRule, listTables);
router.put('/branches/:branchId/tables/layout', protect, requireRole('owner'), layoutRules, saveLayout);
router.post('/tables/:id/release', protect, tableIdRule, releaseTable);

module.exports = router;