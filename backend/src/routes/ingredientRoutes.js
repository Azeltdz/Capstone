const express = require('express');
const router = express.Router();
const c = require('../controllers/ingredientController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { ingredientRules } = require('../middleware/validators/menuValidators');

router.use(protect, requireRole('owner'));

router.get('/', c.listIngredients);
router.get('/:id', c.getIngredient);
router.post('/', ingredientRules, c.addIngredient);
router.put('/:id', c.editIngredient);
router.delete('/:id', c.removeIngredient);

module.exports = router;