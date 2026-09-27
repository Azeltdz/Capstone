const pool = require('../config/db');

async function getAllSystemSettings() {
  const { rows } = await pool.query('SELECT setting_key, setting_value FROM system_settings');
  return rows;
}

async function upsertSystemSetting(key, value) {
  const { rows } = await pool.query(
    `INSERT INTO system_settings (setting_key, setting_value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (setting_key)
      DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
     RETURNING *`,
    [key, value]
  );
  return rows[0];
}

async function getReceiptSettings(branchId) {
  const { rows } = await pool.query('SELECT * FROM receipt_settings WHERE branch_id = $1', [branchId]);
  return rows[0];
}

async function upsertReceiptSettings(branchId, { business_name, footer_message }) {
  const { rows } = await pool.query(
    `INSERT INTO receipt_settings (branch_id, business_name, footer_message)
      VALUES ($1, $2, $3)
      ON CONFLICT (branch_id)
      DO UPDATE SET
        business_name = COALESCE($2, receipt_settings.business_name),
        footer_message = COALESCE($3, receipt_settings.footer_message)
     RETURNING *`,
    [branchId, business_name, footer_message]
  );
  return rows[0];
}

module.exports = { getAllSystemSettings, upsertSystemSetting, getReceiptSettings, upsertReceiptSettings };