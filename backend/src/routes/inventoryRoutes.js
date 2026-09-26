const express = require('express');
const router = express.Router();
const c = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  createInventoryRules, updateInventoryRules, adjustInventoryRules,
} = require('../middleware/validators/inventoryValidators');

// nested under /branches/:branchId
router.get('/branches/:branchId/inventory', protect, c.listInventory);
router.get('/branches/:branchId/inventory/low-stock', protect, c.lowStockForBranch);
router.post('/branches/:branchId/inventory', protect, requireRole('owner'), createInventoryRules, c.addInventoryEntry);

// flat /inventory/:id + all-branch low-stock (owner only, used by dashboard/analytics)
router.get('/inventory/low-stock', protect, requireRole('owner'), c.lowStockAllBranches);
router.put('/inventory/:id', protect, requireRole('owner'), updateInventoryRules, c.editInventory);
router.patch('/inventory/:id/adjust', protect, requireRole('owner'), adjustInventoryRules, c.adjustInventory);
router.delete('/inventory/:id', protect, requireRole('owner'), c.removeInventoryEntry);

module.exports = router;