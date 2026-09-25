const express = require('express');
const router = express.Router();

const { listBranches, getBranch, addBranch, editBranch } = require('../controllers/branchController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { createBranchRules, updateBranchRules } = require('../middleware/validators/branchValidators');

router.get('/', protect, listBranches);
router.get('/:id', protect, getBranch); 
router.post('/', protect, requireRole('owner'), createBranchRules, addBranch);
router.put('/:id', protect, requireRole('owner'), updateBranchRules, editBranch);

module.exports = router;