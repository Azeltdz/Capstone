const { createTransfer, listTransfers } = require('../models/transferModel');

// POST /api/transfers  (owner)  body: { ingredient_id, from_branch_id, to_branch_id, quantity, note? }
async function recordTransfer(req, res, next) {
  try {
    const result = await createTransfer({
      ingredient_id: req.body.ingredient_id,
      from_branch_id: req.body.from_branch_id,
      to_branch_id: req.body.to_branch_id,
      quantity: req.body.quantity,
      note: req.body.note?.trim(),
      performed_by: req.user.user_id,
    });
    res.status(201).json({ message: 'Stock transferred', ...result });
  } catch (err) { next(err); }
}

// GET /api/transfers  (owner)  most recent transfers
async function getTransfers(req, res, next) {
  try {
    res.json(await listTransfers(20));
  } catch (err) { next(err); }
}

module.exports = { recordTransfer, getTransfers };