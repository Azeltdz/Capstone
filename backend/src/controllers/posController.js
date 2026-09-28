const { createOrderWithItems, getOrdersFiltered, getOrderById } = require('../models/orderModel');
const { getBranchById } = require('../models/branchModel');

// POST /api/orders
async function placeOrder(req, res, next) {
  try {
    const { table_id, order_type, payment_method, items, customer_name, guest_count } = req.body;

    // Cashiers can only order for their own branch; owner (rare, testing) must specify one
    const branch_id = req.user.role === 'cashier' ? req.user.branch_id : req.body.branch_id;
    if (!branch_id) return res.status(400).json({ message: 'branch_id is required' });

    const branch = await getBranchById(branch_id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    const transaction = await createOrderWithItems({
      branch_id,
      cashier_id: req.user.user_id,
      table_id,
      order_type,
      payment_method,
      customer_name,
      guest_count,
      items,
    });

    const fullOrder = await getOrderById(transaction.transaction_id);
    res.status(201).json({ message: 'Order placed', order: fullOrder });
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
// GET /api/orders/:id/receipt
async function getReceipt(req, res, next) {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role === 'cashier' && order.branch_id !== req.user.branch_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json({
      order_number: order.transaction_id,
      branch: order.branch_name,
      cashier: order.cashier_name,
      customer_name: order.customer_name,
      guest_count: order.guest_count,
      table_number: order.table_number,
      order_type: order.order_type,
      items: order.items,
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      transaction_at: order.transaction_at,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { placeOrder, listOrders, getOrder, getReceipt };