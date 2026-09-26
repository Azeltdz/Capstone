const express = require('express');
const router = express.Router();
const { editBOM, removeFromBOM } = require('../controllers/bomController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.put('/:id', protect, requireRole('owner'), editBOM);
router.delete('/:id', protect, requireRole('owner'), removeFromBOM);

module.exports = router;