const { createOrderWithItems, getOrdersFiltered, getOrderById } = require('../models/orderModel');
const { getBranchById } = require('../models/branchModel');
const { DEFAULT_RECEIPT } = require('../constants/receiptDefaults');

// POST /api/orders
async function placeOrder(req, res, next) {
  try {
    const { table_id, order_type, payment_method, items, customer_name, guest_count } = req.body;

    const branch_id = req.user.role === 'cashier' ? req.user.branch_id : req.body.branch_id;
    if (!branch_id) return res.status(400).json({ message: 'branch_id is required' });

    if (req.user.role !== 'cashier' && !(await getBranchById(branch_id))) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    const order = await createOrderWithItems({
      branch_id, cashier_id: req.user.user_id, table_id, order_type, payment_method,
      customer_name, guest_count, items,
    });

    res.status(201).json({ message: 'Order placed', order });
  } catch (err) {
    next(err);
  }
}
// GET /api/orders
async function listOrders(req, res, next) {
  try {
    const { order_type, date, search } = req.query;
    const branch_id = req.user.role === "cashier" ? req.user.branch_id : req.query.branch_id;

    const orders = await getOrdersFiltered({ branch_id, order_type, date, search });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}
// GET /api/orders/:id
async function getOrder(req, res, next) {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role === 'cashier' && order.branch_id !== req.user.branch_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
}
// GET /api/orders/:id/receipt  (cashier of that branch, or owner)
async function getReceipt(req, res, next) {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role === 'cashier' && order.branch_id !== req.user.branch_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json({
      order_number: order.transaction_id,
      business_name: order.receipt_business_name || DEFAULT_RECEIPT.business_name,
      footer_message: order.receipt_footer_message ?? DEFAULT_RECEIPT.footer_message,
      branch: order.branch_name,
      cashier: order.cashier_name,
      order_type: order.order_type,
      table_number: order.table_number,
      customer_name: order.customer_name,
      guest_count: order.guest_count,
      payment_method: order.payment_method,
      transaction_at: order.transaction_at,
      items: order.items.map((i) => ({
        item_id: i.item_id,
        item_name: i.item_name,
        quantity: i.quantity,
        unit_price: Number(i.unit_price),
        subtotal: Number(i.subtotal),
      })),
      total_amount: Number(order.total_amount),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { placeOrder, listOrders, getOrder, getReceipt };