const express = require('express');
const router = express.Router();

const {
  listStaff, getStaff, createStaff, editStaff, deactivateStaff, activateStaff,
} = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { createStaffRules, updateStaffRules } = require('../middleware/validators/staffValidators');

router.use(protect, requireRole('owner')); // every Staff route is owner-only

router.get('/', listStaff);
router.get('/:id', getStaff);
router.post('/', createStaffRules, createStaff);
router.put('/:id', updateStaffRules, editStaff);
router.patch('/:id/deactivate', deactivateStaff);
router.patch('/:id/activate', activateStaff);

module.exports = router;