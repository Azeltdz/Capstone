const fs = require('fs');
const path = require('path');
const {
  getAllMenuItems, getMenuItemById, createMenuItem, updateMenuItem,
  isMenuItemInUse, findDuplicate, deleteMenuItemCascade,
} = require('../models/menuModel');

const UPLOAD_PREFIX = '/uploads/menu-items/';
const imagePath = (req) => (req.file ? `${UPLOAD_PREFIX}${req.file.filename}` : undefined);
const discardUpload = (req) => { if (req.file) fs.unlink(req.file.path, () => {}); };
const removeStoredImage = (url) => {
  if (url && url.startsWith(UPLOAD_PREFIX)) {
    fs.unlink(path.join(__dirname, '..', '..', 'uploads', 'menu-items', path.basename(url)), () => {});
  }
};
const toBool = (v) => (v === undefined ? undefined : ['true', '1'].includes(String(v)));

// Cashiers only ever see items that are on the menu. Owners see everything.
async function listMenuItems(req, res, next) {
  try {
    const all = await getAllMenuItems();
    res.json(req.user.role === 'owner' ? all : all.filter((i) => i.is_available));
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
    const { item_name, category, selling_price } = req.body;
    if (await findDuplicate(item_name, category || null)) {
      discardUpload(req);
      return res.status(409).json({ message: `"${item_name}" already exists in this category.` });
    }
    const item = await createMenuItem({
      item_name,
      category: category || null,
      selling_price,
      image_url: imagePath(req) ?? null,
      is_available: toBool(req.body.is_available) ?? true,
    });
    res.status(201).json({ message: 'Menu item created', item });
  } catch (err) { discardUpload(req); next(err); }
}

async function editMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await getMenuItemById(id);
    if (!existing) {
      discardUpload(req);
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const name = req.body.item_name ?? existing.item_name;
    const category = req.body.category || existing.category;
    if (await findDuplicate(name, category, Number(id))) {
      discardUpload(req);
      return res.status(409).json({ message: `"${name}" already exists in this category.` });
    }

    const item = await updateMenuItem(id, {
      item_name: req.body.item_name,
      category: req.body.category || undefined,
      selling_price: req.body.selling_price,
      image_url: imagePath(req),
      is_available: toBool(req.body.is_available),
    });
    if (req.file) removeStoredImage(existing.image_url);
    res.json({ message: 'Menu item updated', item });
  } catch (err) { discardUpload(req); next(err); }
}

async function removeMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await getMenuItemById(id);
    if (!existing) return res.status(404).json({ message: 'Menu item not found' });

    if (await isMenuItemInUse(id)) {
      return res.status(409).json({
        message: "This item has sales history, so it can't be deleted. Hide it from the menu instead.",
      });
    }
    await deleteMenuItemCascade(id);
    removeStoredImage(existing.image_url);
    res.json({ message: 'Menu item deleted' });
  } catch (err) { next(err); }
}

module.exports = { listMenuItems, getMenuItem, addMenuItem, editMenuItem, removeMenuItem };