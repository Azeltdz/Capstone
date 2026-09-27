const {
  getAllSystemSettings, upsertSystemSetting, getReceiptSettings, upsertReceiptSettings,
} = require('../models/settingsModel');
const { getBranchById } = require('../models/branchModel');
const { DEFAULT_SETTINGS, SETTING_KEYS } = require('../constants/settingsDefaults');

// GET /api/settings
async function getSettings(req, res, next) {
  try {
    const rows = await getAllSystemSettings();
    const stored = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
    res.json({ ...DEFAULT_SETTINGS, ...stored });
  } catch (err) { next(err); }
}

// PUT /api/settings
async function updateSettings(req, res, next) {
  try {
    const updates = req.body;
    const invalidKeys = Object.keys(updates).filter((k) => !SETTING_KEYS.includes(k));
    if (invalidKeys.length) {
      return res.status(400).json({ message: `Unknown setting key(s): ${invalidKeys.join(', ')}` });
    }

    const saved = {};
    for (const key of Object.keys(updates)) {
      const row = await upsertSystemSetting(key, String(updates[key]));
      saved[row.setting_key] = row.setting_value;
    }

    const rows = await getAllSystemSettings();
    const stored = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
    res.json({ message: 'Settings updated', settings: { ...DEFAULT_SETTINGS, ...stored } });
  } catch (err) { next(err); }
}

// GET /api/branches/:branchId/settings/receipt
async function getBranchReceiptSettings(req, res, next) {
  try {
    const { branchId } = req.params;
    const branch = await getBranchById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    const settings = await getReceiptSettings(branchId);
    res.json(settings || { branch_id: Number(branchId), business_name: null, footer_message: null });
  } catch (err) { next(err); }
}

// PUT /api/branches/:branchId/settings/receipt
async function updateBranchReceiptSettings(req, res, next) {
  try {
    const { branchId } = req.params;
    const branch = await getBranchById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    const settings = await upsertReceiptSettings(branchId, req.body);
    res.json({ message: 'Receipt settings updated', settings });
  } catch (err) { next(err); }
}

// GET /api/settings/security-status  (static — matches Figure 23's security panel)
function getSecurityStatus(req, res) {
  res.json({
    password_hashing: 'bcrypt — active',
    authentication: 'JWT — active',
    database_backups: 'Supabase daily backups — active',
    transport_security: process.env.NODE_ENV === 'production' ? 'HTTPS — active' : 'HTTPS — inactive (dev mode)',
  });
}

module.exports = {
  getSettings, updateSettings, getBranchReceiptSettings, updateBranchReceiptSettings, getSecurityStatus,
};