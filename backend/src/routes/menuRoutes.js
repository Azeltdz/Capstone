const express = require('express');
const router = express.Router();
const c = require('../controllers/menuController');
const bomC = require('../controllers/bomController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { menuItemRules, menuItemUpdateRules, menuIdRule, bomRules, recipeRules } = require('../middleware/validators/menuValidators');
const upload = require('../middleware/upload');

router.get('/', protect, c.listMenuItems);
router.get('/:id', protect, menuIdRule, c.getMenuItem);
router.post('/', protect, requireRole('owner'), upload.single('image'), menuItemRules, c.addMenuItem);
router.put('/:id', protect, requireRole('owner'), upload.single('image'), menuItemUpdateRules, c.editMenuItem);
router.delete('/:id', protect, requireRole('owner'), menuIdRule, c.removeMenuItem);

router.get('/:itemId/bom', protect, requireRole('owner'), bomC.listBOM);
router.post('/:itemId/bom', protect, requireRole('owner'), bomRules, bomC.addToBOM);
router.put('/:itemId/recipe', protect, requireRole('owner'), recipeRules, bomC.saveRecipe);

module.exports = router;