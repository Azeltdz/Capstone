const DEFAULT_SETTINGS = {
  moving_average_window: '7',
  trend_threshold: '10',
  anomaly_threshold: '20',
};

const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);

module.exports = { DEFAULT_SETTINGS, SETTING_KEYS };