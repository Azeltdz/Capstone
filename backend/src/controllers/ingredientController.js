const {
  getAllIngredients, getIngredientById, createIngredient,
  updateIngredient, isIngredientInUse, deleteIngredient,
} = require('../models/ingredientModel');

async function listIngredients(req, res, next) {
  try {
    res.json(await getAllIngredients());
  } catch (err) { next(err); }
}

async function getIngredient(req, res, next) {
  try {
    const ingredient = await getIngredientById(req.params.id);
    if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });
    res.json(ingredient);
  } catch (err) { next(err); }
}

async function addIngredient(req, res, next) {
  try {
    const ingredient = await createIngredient(req.body);
    res.status(201).json({ message: 'Ingredient created', ingredient });
  } catch (err) { next(err); }
}

async function editIngredient(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await getIngredientById(id);
    if (!existing) return res.status(404).json({ message: 'Ingredient not found' });

    const { unit } = req.body;
    if (unit !== undefined && unit !== existing.unit && (await isIngredientInUse(id))) {
      return res.status(400).json({
        message: "Unit can't be changed while the ingredient is used in a recipe or inventory.",
      });
    }

    const ingredient = await updateIngredient(id, req.body);
    res.json({ message: 'Ingredient updated', ingredient });
  } catch (err) { next(err); }
}
async function removeIngredient(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await getIngredientById(id);
    if (!existing) return res.status(404).json({ message: 'Ingredient not found' });

    if (await isIngredientInUse(id)) {
      return res.status(400).json({ message: 'Cannot delete: ingredient is used in a recipe or has inventory records' });
    }

    await deleteIngredient(id);
    res.json({ message: 'Ingredient deleted' });
  } catch (err) { next(err); }
}

module.exports = { listIngredients, getIngredient, addIngredient, editIngredient, removeIngredient };