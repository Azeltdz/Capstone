const {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  getBranchesWithStats,
  deleteBranchById
} = require('../models/branchModel');
const { getTablesByBranch } = require('../models/tableModel');
const { getDailyTransactionCounts } = require('../models/analyticsModel');
const { getAllSystemSettings } = require('../models/settingsModel');
const { DEFAULT_SETTINGS } = require('../constants/settingsDefaults');

// GET /api/branches
async function listBranches(req, res, next) {
  try {
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

async function getBranch(req, res, next) {
  try {
    const { id } = req.params;

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

    if (req.body.table_count !== undefined) {
      const currentTables = await getTablesByBranch(id);
      if (req.body.table_count < currentTables.length) {
        return res.status(400).json({
          message: `Cannot set table_count below ${currentTables.length} — that many tables already exist. Delete tables first.`
        });
      }
    }

    const branch = await updateBranch(id, req.body);
    res.json({ message: 'Branch updated', branch });
  } catch (err) {
    next(err);
  }
}

async function listBranchesWithStats(req, res, next) {
  try {
    const stats = await getBranchesWithStats();

    const settingsRows = await getAllSystemSettings();
    const stored = Object.fromEntries(settingsRows.map((r) => [r.setting_key, r.setting_value]));
    const { moving_average_window, anomaly_threshold } = { ...DEFAULT_SETTINGS, ...stored };
    const windowDays = Number(moving_average_window);
    const anomalyThreshold = Number(anomaly_threshold);

    const branches = await Promise.all(
      stats.map(async (b) => {
        const series = await getDailyTransactionCounts(b.branch_id, windowDays);
        const movingAvg = series.reduce((a, c) => a + c, 0) / windowDays;
        const today = series[series.length - 1];
        let flagged = false;
        if (movingAvg > 0) {
          flagged = ((movingAvg - today) / movingAvg) * 100 >= anomalyThreshold;
        }
        return { ...b, flagged };
      })
    );

    res.json(branches);
  } catch (err) { next(err); }
}

async function removeBranch(req, res, next) {
  try {
    const { id } = req.params;
    const branch = await getBranchById(id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    if (branch.is_active) {
      return res.status(400).json({ message: 'Branch must be deactivated before it can be deleted.' });
    }
    const deleted = await deleteBranchById(id);
    res.json({ message: 'Branch deleted', branch: deleted });
  } catch (err) { next(err); }
}

module.exports = { listBranches, getBranch, addBranch, editBranch, listBranchesWithStats, removeBranch };