const {
  getAllMenuItems, getMenuItemById, createMenuItem,
  updateMenuItem, isMenuItemInUse, deleteMenuItem,
} = require('../models/menuModel');

async function listMenuItems(req, res, next) {
  try {
    res.json(await getAllMenuItems());
  } catch (err) { next(err); }
}

async function getMenuItem(req, res, next) {
  try {
    const item = await getMenuItemById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json(item);
  } catch (err) { next(err); }
}

async function addMenuItem(req, res, next) {
  try {
    const image_url = req.file ? `/uploads/menu-items/${req.file.filename}` : req.body.image_url || null;
    const item = await createMenuItem({ ...req.body, image_url });
    res.status(201).json({ message: 'Menu item created', item });
  } catch (err) { next(err); }
}

async function editMenuItem(req, res, next) {
  try {
    const image_url = req.file ? `/uploads/menu-items/${req.file.filename}` : req.body.image_url;
    const item = await updateMenuItem(req.params.id, { ...req.body, image_url });
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item updated', item });
  } catch (err) { next(err); }
}

async function removeMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await getMenuItemById(id);
    if (!existing) return res.status(404).json({ message: 'Menu item not found' });

    if (await isMenuItemInUse(id)) {
      return res.status(400).json({
        message: 'Cannot delete: item has sales history. Set is_available to false instead.'
      });
    }

    await deleteMenuItem(id);
    res.json({ message: 'Menu item deleted' });
  } catch (err) { next(err); }
}

module.exports = { listMenuItems, getMenuItem, addMenuItem, editMenuItem, removeMenuItem };