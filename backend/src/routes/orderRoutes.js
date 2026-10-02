const express = require('express');
const router = express.Router();
const { placeOrder, listOrders, getOrder, getReceipt } = require('../controllers/posController');
const { protect } = require('../middleware/authMiddleware');
const { placeOrderRules, orderIdRule } = require('../middleware/validators/orderValidators');

router.use(protect);

router.post('/', placeOrderRules, placeOrder);
router.get('/', listOrders);
router.get('/:id', orderIdRule, getOrder);
router.get('/:id/receipt', orderIdRule, getReceipt);

module.exports = router;