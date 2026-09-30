const express = require('express');
const router = express.Router();
const c = require('../controllers/menuController');
const bomC = require('../controllers/bomController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { menuItemRules, bomRules, recipeRules } = require('../middleware/validators/menuValidators');
const upload = require('../middleware/upload');

// menu items — read is open to any logged-in user (cashier's POS needs this)
router.get('/', protect, c.listMenuItems);
router.get('/:id', protect, c.getMenuItem);
router.post('/', protect, requireRole('owner'), upload.single('image'), menuItemRules, c.addMenuItem);
router.put('/:id', protect, requireRole('owner'), upload.single('image'), c.editMenuItem);
router.put('/:itemId/recipe', protect, requireRole('owner'), recipeRules, bomC.saveRecipe);
router.delete('/:id', protect, requireRole('owner'), c.removeMenuItem);

// BOM nested under a menu item — owner only
router.get('/:itemId/bom', protect, requireRole('owner'), bomC.listBOM);
router.post('/:itemId/bom', protect, requireRole('owner'), bomRules, bomC.addToBOM);

module.exports = router;