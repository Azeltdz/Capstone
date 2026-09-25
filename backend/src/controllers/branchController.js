const {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch
} = require('../models/branchModel');

// GET /api/branches
async function listBranches(req, res, next) {
  try {
    // Cashiers only ever need their own branch; owners see all
    if (req.user.role === 'cashier') {
      const branch = await getBranchById(req.user.branch_id);
      return res.json(branch ? [branch] : []);
    }
    const branches = await getAllBranches();
    res.json(branches);
  } catch (err) {
    next(err);
  }
}

// GET /api/branches/:id
async function getBranch(req, res, next) {
  try {
    const { id } = req.params;

    // Cashiers can't peek at other branches
    if (req.user.role === 'cashier' && Number(id) !== req.user.branch_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const branch = await getBranchById(id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json(branch);
  } catch (err) {
    next(err);
  }
}

// POST /api/branches  (owner only)
async function addBranch(req, res, next) {
  try {
    const { branch_name, location, contact_number, table_count } = req.body;
    if (!branch_name) {
      return res.status(400).json({ message: 'branch_name is required' });
    }
    const branch = await createBranch({ branch_name, location, contact_number, table_count });
    res.status(201).json({ message: 'Branch created', branch });
  } catch (err) {
    next(err);
  }
}

// PUT /api/branches/:id  (owner only)
async function editBranch(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await getBranchById(id);
    if (!existing) return res.status(404).json({ message: 'Branch not found' });

    const branch = await updateBranch(id, req.body);
    res.json({ message: 'Branch updated', branch });
  } catch (err) {
    next(err);
  }
}

module.exports = { listBranches, getBranch, addBranch, editBranch };