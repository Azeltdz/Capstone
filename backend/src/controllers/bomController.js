const { getBOMByItem, getBOMEntryById, findBOMEntry, addBOMEntry, updateBOMEntry, deleteBOMEntry } = require('../models/bomModel');
const { getMenuItemById } = require('../models/menuModel');
const { getIngredientById } = require('../models/ingredientModel');

// GET /api/menu-items/:itemId/bom
async function listBOM(req, res, next) {
  try {
    const { itemId } = req.params;
    const item = await getMenuItemById(itemId);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json(await getBOMByItem(itemId));
  } catch (err) { next(err); }
}

// POST /api/menu-items/:itemId/bom
async function addToBOM(req, res, next) {
  try {
    const { itemId } = req.params;
    const { ingredient_id, quantity_per_unit, unit, notes } = req.body;

    const item = await getMenuItemById(itemId);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    const ingredient = await getIngredientById(ingredient_id);
    if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });

    const existing = await findBOMEntry(itemId, ingredient_id);
    if (existing) {
      return res.status(409).json({ message: 'This ingredient is already in this item\'s recipe. Use PUT to update the quantity instead.' });
    }

    const entry = await addBOMEntry({ item_id: itemId, ingredient_id, quantity_per_unit, unit, notes });
    res.status(201).json({ message: 'Ingredient added to recipe', entry });
  } catch (err) { next(err); }
}

// PUT /api/bom/:id
async function editBOM(req, res, next) {
  try {
    const entry = await updateBOMEntry(req.params.id, req.body);
    if (!entry) return res.status(404).json({ message: 'BOM entry not found' });
    res.json({ message: 'Recipe entry updated', entry });
  } catch (err) { next(err); }
}

// DELETE /api/bom/:id
async function removeFromBOM(req, res, next) {
  try {
    const entry = await getBOMEntryById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'BOM entry not found' });
    await deleteBOMEntry(req.params.id);
    res.json({ message: 'Ingredient removed from recipe' });
  } catch (err) { next(err); }
}

module.exports = { listBOM, addToBOM, editBOM, removeFromBOM };