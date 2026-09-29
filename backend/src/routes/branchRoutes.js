const express = require('express');
const router = express.Router();

const { listBranches, getBranch, addBranch, editBranch, listBranchesWithStats, removeBranch } = require('../controllers/branchController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { createBranchRules, updateBranchRules } = require('../middleware/validators/branchValidators');

router.get('/', protect, listBranches);
router.get('/summary', protect, requireRole('owner'), listBranchesWithStats);
router.get('/:id', protect, getBranch); 
router.post('/', protect, requireRole('owner'), createBranchRules, addBranch);
router.put('/:id', protect, requireRole('owner'), updateBranchRules, editBranch);
router.delete('/:id', protect, requireRole('owner'), removeBranch);

module.exports = router;