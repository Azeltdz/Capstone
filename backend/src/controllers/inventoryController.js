const {
  getInventoryByBranch, getAllInventory, getInventoryById, findInventoryEntry, createInventoryEntry,
  updateInventoryEntry, getLowStockByBranch, getLowStockAll, recordMovement, listMovements, deleteInventoryEntry
} = require('../models/inventoryModel');
const { getBranchById } = require('../models/branchModel');
const { getIngredientById } = require('../models/ingredientModel');

function assertBranchAccess(req, branchId) {
  if (req.user.role === 'cashier' && Number(branchId) !== req.user.branch_id) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
}

// GET /api/branches/:branchId/inventory
async function listInventory(req, res, next) {
  try {
    const { branchId } = req.params;
    assertBranchAccess(req, branchId);

    const branch = await getBranchById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    res.json(await getInventoryByBranch(branchId));
  } catch (err) { next(err); }
}

async function listAllInventory(req, res, next) {
  try {
    res.json(await getAllInventory());
  } catch (err) { next(err); }
}

async function lowStockForBranch(req, res, next) {
  try {
    const { branchId } = req.params;
    assertBranchAccess(req, branchId);
    res.json(await getLowStockByBranch(branchId));
  } catch (err) { next(err); }
}

async function lowStockAllBranches(req, res, next) {
  try {
    res.json(await getLowStockAll());
  } catch (err) { next(err); }
}

async function addInventoryEntry(req, res, next) {
  try {
    const { branchId } = req.params;
    const { ingredient_id, quantity_on_hand, reorder_threshold } = req.body;

    const branch = await getBranchById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    const ingredient = await getIngredientById(ingredient_id);
    if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });

    const existing = await findInventoryEntry(branchId, ingredient_id);
    if (existing) {
      return res.status(409).json({ message: 'This ingredient already has an inventory record for this branch. Use PUT/PATCH to update it.' });
    }

    const entry = await createInventoryEntry({
      branch_id: branchId, ingredient_id, quantity_on_hand, reorder_threshold, performed_by: req.user.user_id,
    });
    res.status(201).json({ message: 'Inventory record created', entry });
  } catch (err) { next(err); }
}

async function editInventory(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await getInventoryById(id);
    if (!existing) return res.status(404).json({ message: 'Inventory record not found' });

    const entry = await updateInventoryEntry(id, { reorder_threshold: req.body.reorder_threshold });
    res.json({ message: 'Inventory updated', entry });
  } catch (err) { next(err); }
}

async function adjustInventory(req, res, next) {
  try {
    const { id } = req.params;
    const { delta } = req.body;

    const existing = await getInventoryById(id);
    if (!existing) return res.status(404).json({ message: 'Inventory record not found' });

    const projected = Number(existing.quantity_on_hand) + Number(delta);
    if (projected < 0) {
      return res.status(400).json({ message: `Adjustment would result in negative stock (current: ${existing.quantity_on_hand})` });
    }

    const entry = await adjustInventoryQuantity(id, delta);
    res.json({ message: 'Inventory adjusted', entry });
  } catch (err) { next(err); }
}

async function removeInventoryEntry(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await getInventoryById(id);
    if (!existing) return res.status(404).json({ message: 'Inventory record not found' });

    await deleteInventoryEntry(id);
    res.json({ message: 'Inventory record deleted' });
  } catch (err) { next(err); }
}

async function addMovement(req, res, next) {
  try {
    const result = await recordMovement({
      inventory_id: Number(req.params.id),
      type: req.body.type,
      quantity: Number(req.body.quantity),
      unit: req.body.unit,
      reason: req.body.reason?.trim(),
      performed_by: req.user.user_id,
    });
    res.status(201).json({ message: 'Stock updated', ...result });
  } catch (err) { next(err); }
}

async function getMovements(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!(await getInventoryById(id))) return res.status(404).json({ message: 'Inventory record not found' });
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 25;
    const { rows, total } = await listMovements(id, pageSize, (page - 1) * pageSize);
    res.json({ rows, total, page, page_size: pageSize, page_count: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (err) { next(err); }
}

module.exports = {
  listInventory, lowStockForBranch, lowStockAllBranches, listAllInventory, addInventoryEntry, 
  editInventory, removeInventoryEntry, addMovement, getMovements
};