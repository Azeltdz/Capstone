const {
  getTablesByBranch,
  getTableById,
  findTableByNumber,
  createTable,
  updateTableStatus,
  updateTableCapacity,
  deleteTable,
} = require('../models/tableModel');
const { getBranchById } = require('../models/branchModel');

// GET /api/branches/:branchId/tables
async function listTables(req, res, next) {
  try {
    const { branchId } = req.params;

    if (req.user.role === 'cashier' && Number(branchId) !== req.user.branch_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const branch = await getBranchById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    const tables = await getTablesByBranch(branchId);
    res.json(tables);
  } catch (err) {
    next(err);
  }
}

// POST /api/branches/:branchId/tables  (owner only — single table)
async function addTable(req, res, next) {
  try {
    const { branchId } = req.params;
    const { table_number, guest_capacity } = req.body;

    const branch = await getBranchById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    const existingTables = await getTablesByBranch(branchId);
    if (existingTables.length >= branch.table_count) {
      return res.status(400).json({
        message: `Branch table limit reached (${branch.table_count}).`
      });
    }

    const existing = await findTableByNumber(branchId, table_number);
    if (existing) {
      return res.status(409).json({ message: `Table ${table_number} already exists for this branch` });
    }

    const table = await createTable({ branch_id: branchId, table_number, guest_capacity });
    res.status(201).json({ message: 'Table created', table });
  } catch (err) {
    next(err);
  }
}

// POST /api/branches/:branchId/tables/bulk  (owner only — generate Table 1..N at once)
async function bulkCreateTables(req, res, next) {
  try {
    const { branchId } = req.params;
    const { count, guest_capacity } = req.body;

    const branch = await getBranchById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    const existingTables = await getTablesByBranch(branchId);
    const remainingSlots = branch.table_count - existingTables.length;

    if (remainingSlots <= 0) {
      return res.status(400).json({
        message: `Branch table limit reached (${branch.table_count}). Increase table_count on the branch first.`
      });
    }

    if (count > remainingSlots) {
      return res.status(400).json({
        message: `Only ${remainingSlots} table slot(s) remaining for this branch (limit: ${branch.table_count}).`
      });
    }

    const created = [];
    const startNumber = existingTables.length > 0
      ? Math.max(...existingTables.map(t => t.table_number)) + 1
      : 1;

    for (let i = 0; i < count; i++) {
      const tableNumber = startNumber + i;
      const table = await createTable({ branch_id: branchId, table_number: tableNumber, guest_capacity });
      created.push(table);
    }

    res.status(201).json({ message: `${created.length} table(s) created`, tables: created });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/tables/:id/status  (cashier + owner — flip available/occupied)
async function changeTableStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const table = await getTableById(id);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    if (req.user.role === 'cashier' && table.branch_id !== req.user.branch_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await updateTableStatus(id, status);
    res.json({ message: 'Table status updated', table: updated });
  } catch (err) {
    next(err);
  }
}

// PUT /api/tables/:id  (owner only — edit guest capacity)
async function editTable(req, res, next) {
  try {
    const { id } = req.params;
    const { guest_capacity } = req.body;

    const table = await getTableById(id);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    const updated = await updateTableCapacity(id, guest_capacity);
    res.json({ message: 'Table updated', table: updated });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tables/:id  (owner only)
async function removeTable(req, res, next) {
  try {
    const { id } = req.params;
    const table = await getTableById(id);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    if (table.status === 'occupied') {
      return res.status(400).json({ message: 'Cannot delete an occupied table' });
    }

    await deleteTable(id);
    res.json({ message: 'Table deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTables,
  addTable,
  bulkCreateTables,
  changeTableStatus,
  editTable,
  removeTable,
};