const {
  getAllMenuItems, getMenuItemById, createMenuItem, updateMenuItem,
  isMenuItemInUse, findDuplicate, deleteMenuItemCascade,
} = require('../models/menuModel');
const { uploadMenuImage, removeMenuImage } = require('../services/imageStorage');

const toBool = (v) => (v === undefined ? undefined : ['true', '1'].includes(String(v)));

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
  let uploaded = null;
  try {
    const { item_name, category, selling_price } = req.body;
    if (await findDuplicate(item_name, category || null)) {
      return res.status(409).json({ message: `"${item_name}" already exists in this category.` });
    }
    uploaded = req.file ? await uploadMenuImage(req.file) : null;
    const item = await createMenuItem({
      item_name, category: category || null, selling_price,
      image_url: uploaded, is_available: toBool(req.body.is_available) ?? true,
    });
    res.status(201).json({ message: 'Menu item created', item });
  } catch (err) {
    removeMenuImage(uploaded);
    next(err);
  }
}

async function editMenuItem(req, res, next) {
  let uploaded = null;
  try {
    const { id } = req.params;
    const existing = await getMenuItemById(id);
    if (!existing) return res.status(404).json({ message: 'Menu item not found' });

    const name = req.body.item_name ?? existing.item_name;
    const category = req.body.category || existing.category;
    if (await findDuplicate(name, category, Number(id))) {
      return res.status(409).json({ message: `"${name}" already exists in this category.` });
    }

    uploaded = req.file ? await uploadMenuImage(req.file) : null;
    const item = await updateMenuItem(id, {
      item_name: req.body.item_name,
      category: req.body.category || undefined,
      selling_price: req.body.selling_price,
      image_url: uploaded ?? undefined,
      is_available: toBool(req.body.is_available),
    });
    if (uploaded) removeMenuImage(existing.image_url);
    res.json({ message: 'Menu item updated', item });
  } catch (err) {
    removeMenuImage(uploaded);
    next(err);
  }
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
    removeMenuImage(existing.image_url);
    res.json({ message: 'Menu item deleted' });
  } catch (err) { next(err); }
}

module.exports = { listMenuItems, getMenuItem, addMenuItem, editMenuItem, removeMenuItem };