const { getTablesByBranch, getTableById, releaseTableById, applyLayout } = require('../models/tableModel');
const { getBranchById } = require('../models/branchModel');

// GET /api/branches/:branchId/tables
async function listTables(req, res, next) {
  try {
    const { branchId } = req.params;
    if (req.user.role === 'cashier' && Number(branchId) !== req.user.branch_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!(await getBranchById(branchId))) return res.status(404).json({ message: 'Branch not found' });
    res.json(await getTablesByBranch(branchId));
  } catch (err) { next(err); }
}

// POST /api/tables/:id/release  (cashier for their own branch, or owner)
async function releaseTable(req, res, next) {
  try {
    const table = await getTableById(req.params.id);
    if (!table || !table.is_active) return res.status(404).json({ message: 'Table not found' });
    if (req.user.role === 'cashier' && table.branch_id !== req.user.branch_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json({ message: 'Table released', table: await releaseTableById(table.table_id) });
  } catch (err) { next(err); }
}

// PUT /api/branches/:branchId/tables/layout  (owner)  body: { count, capacities: [{table_number, guest_capacity}] }
async function saveLayout(req, res, next) {
  try {
    const { branchId } = req.params;
    if (!(await getBranchById(branchId))) return res.status(404).json({ message: 'Branch not found' });

    await applyLayout(Number(branchId), Number(req.body.count), req.body.capacities ?? []);
    res.json({ message: 'Tables updated', tables: await getTablesByBranch(branchId) });
  } catch (err) { next(err); }
}

module.exports = { listTables, releaseTable, saveLayout };