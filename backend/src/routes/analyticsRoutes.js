const express = require('express');
const router = express.Router();
const c = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(protect, requireRole('owner'));

router.get('/forecast/:branchId', c.computeForecast);
router.get('/forecast/:branchId/latest', c.getLatestForecast);
router.get('/branch-anomalies', c.getBranchAnomalies);
router.get('/food-costing', c.getFoodCosting);
router.get('/dashboard', c.getDashboard);

module.exports = router;