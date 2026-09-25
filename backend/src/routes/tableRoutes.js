const express = require('express');
const router = express.Router();

const {
  listTables,
  addTable,
  bulkCreateTables,
  changeTableStatus,
  editTable,
  removeTable,
} = require('../controllers/tableController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  createTableRules,
  bulkCreateRules,
  statusRules,
  capacityRules,
} = require('../middleware/validators/tableValidators');

// nested under /branches/:branchId
router.get('/branches/:branchId/tables', protect, listTables);
router.post('/branches/:branchId/tables', protect, requireRole('owner'), createTableRules, addTable);
router.post('/branches/:branchId/tables/bulk', protect, requireRole('owner'), bulkCreateRules, bulkCreateTables);

// flat /tables/:id routes
router.patch('/tables/:id/status', protect, statusRules, changeTableStatus);
router.put('/tables/:id', protect, requireRole('owner'), capacityRules, editTable);
router.delete('/tables/:id', protect, requireRole('owner'), removeTable);

module.exports = router;