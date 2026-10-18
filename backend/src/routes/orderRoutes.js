const express = require('express');
const router = express.Router();
const {
  placeOrder, listOrders, getOrder, getReceipt, settlePayment, updateOrderStatus,
} = require('../controllers/posController');
const { protect } = require('../middleware/authMiddleware');
const {
  placeOrderRules, orderIdRule, listOrdersRules, settlePaymentRules, orderStatusRules,
} = require('../middleware/validators/orderValidators');

router.use(protect);

router.post('/', placeOrderRules, placeOrder);
router.get('/', listOrdersRules, listOrders);
router.get('/:id', orderIdRule, getOrder);
router.get('/:id/receipt', orderIdRule, getReceipt);
router.patch('/:id/payment', settlePaymentRules, settlePayment);
router.patch('/:id/status', orderStatusRules, updateOrderStatus);

module.exports = router;