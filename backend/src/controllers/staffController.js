const { getAllStaff, getStaffByBranch, findUserById, updateUser } = require('../models/userModel');
const { createStaffAccount } = require('../services/userService');
const { invalidateUserCache } = require('../middleware/authMiddleware')

// GET /api/staff  (owner only — ?branchId= optional filter)
async function listStaff(req, res, next) {
  try {
    const { branchId } = req.query;
    const staff = branchId ? await getStaffByBranch(branchId) : await getAllStaff();
    res.json(staff);
  } catch (err) {
    next(err);
  }
}

// GET /api/staff/:id  (owner only)
async function getStaff(req, res, next) {
  try {
    const staff = await findUserById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json(staff);
  } catch (err) {
    next(err);
  }
}

// POST /api/staff  (owner only — creates cashier/owner accounts)
async function createStaff(req, res, next) {
  try {
    const newStaff = await createStaffAccount(req.body);
    res.status(201).json({ message: 'Staff account created', staff: newStaff });
  } catch (err) {
    next(err);
  }
}

// PUT /api/staff/:id  (owner only — edit name, branch, role)
async function editStaff(req, res, next) {
  try {
    const { id } = req.params;
    const staff = await updateUser(id, req.body);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    invalidateUserCache(id);
    res.json({ message: 'Staff updated', staff });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/staff/:id/deactivate  (owner only)
async function deactivateStaff(req, res, next) {
  try {
    const { id } = req.params;

    if (Number(id) === req.user.user_id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const staff = await updateUser(id, { is_active: false });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    invalidateUserCache(id);
    res.json({ message: 'Staff deactivated', staff });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/staff/:id/activate  (owner only)
async function activateStaff(req, res, next) {
  try {
    const staff = await updateUser(req.params.id, { is_active: true });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    invalidateUserCache(id);
    res.json({ message: 'Staff reactivated', staff });
  } catch (err) {
    next(err);
  }
}

module.exports = { listStaff, getStaff, createStaff, editStaff, deactivateStaff, activateStaff };