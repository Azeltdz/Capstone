const express = require('express');
const router = express.Router();
const c = require('../controllers/transferController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { createTransferRules } = require('../middleware/validators/transferValidators');

router.use(protect, requireRole('owner'));

router.get('/', c.getTransfers);
router.post('/', createTransferRules, c.recordTransfer);

module.exports = router;