const DEFAULT_SETTINGS = {
  moving_average_window: '7',
  trend_threshold: '10',
  anomaly_threshold: '20',
  low_stock_default_kg: '5',
  low_stock_default_pcs: '20',
  lead_time_days: '2',
  safety_stock_days: '1',
};

const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);

module.exports = { DEFAULT_SETTINGS, SETTING_KEYS };