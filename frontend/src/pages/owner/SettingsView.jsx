// src/pages/owner/SettingsView.jsx
import { useEffect, useState } from "react";
import {
  getSettingsData,
  getDefaultSettings,
  updateAnalyticsSettings,
  updateReceiptSettings,
  updateInventoryAlertSettings,
} from "../../api/mockOwner";

const SAVE_STATUS = { IDLE: "idle", SAVING: "saving", SAVED: "saved", ERROR: "error" };

// One entry here per editable panel. `section` is the key both in
// `settings` state and in the object getDefaultSettings() returns, so
// wiring a new settings panel later is just adding a row to this array —
// the save/restore handlers, buttons, and status tracking are all generic.
const SETTINGS_PANELS = [
  { section: "analytics", updateFn: updateAnalyticsSettings, saveLabel: "Save Analytics Settings" },
  { section: "receipt", updateFn: updateReceiptSettings, saveLabel: "Save Receipt Settings" },
  { section: "inventoryAlerts", updateFn: updateInventoryAlertSettings, saveLabel: "Save Alert Settings" },
];

export default function SettingsView() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  // One entry per panel/action: { "analytics-save": {status}, "analytics-restore": {status}, ... }
  // Save and Restore get separate keys so clicking one doesn't show a
  // "Saving…" state on the other button.
  const [actionStatus, setActionStatus] = useState({});

  useEffect(() => {
    let cancelled = false;
    getSettingsData()
      .then((d) => !cancelled && setSettings(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="error-text">Couldn't load settings. {error}</p>;
  if (!settings) return <p className="loading-text">Loading settings…</p>;

  function updateField(section, field, value) {
    setSettings((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  }

  // Shared saving/saved/error lifecycle for both Save and Restore buttons.
  async function runAction(actionKey, fn) {
    setActionStatus((prev) => ({ ...prev, [actionKey]: { status: SAVE_STATUS.SAVING } }));
    try {
      await fn();
      setActionStatus((prev) => ({ ...prev, [actionKey]: { status: SAVE_STATUS.SAVED } }));
      setTimeout(() => {
        setActionStatus((prev) => ({ ...prev, [actionKey]: { status: SAVE_STATUS.IDLE } }));
      }, 2000);
    } catch (err) {
      setActionStatus((prev) => ({ ...prev, [actionKey]: { status: SAVE_STATUS.ERROR, message: err.message } }));
    }
  }

  function handleSave(panel) {
    const { section, updateFn } = panel;
    runAction(`${section}-save`, async () => {
      const payload =
        section === "analytics"
          ? {
              movingAvgWindow: Number(settings.analytics.movingAvgWindow),
              trendThreshold: Number(settings.analytics.trendThreshold),
              anomalyThreshold: Number(settings.analytics.anomalyThreshold),
            }
          : settings[section];
      const saved = await updateFn(payload);
      setSettings((prev) => ({ ...prev, [section]: saved }));
    });
  }

  function handleRestore(panel) {
    const { section, updateFn } = panel;
    runAction(`${section}-restore`, async () => {
      const defaults = await getDefaultSettings();
      const saved = await updateFn(defaults[section]);
      setSettings((prev) => ({ ...prev, [section]: saved }));
    });
  }

  function actionLabel(actionKey, defaultLabel) {
    const status = actionStatus[actionKey]?.status;
    if (status === SAVE_STATUS.SAVING) return "Saving…";
    if (status === SAVE_STATUS.SAVED) return "Saved ✓";
    return defaultLabel;
  }

  function isBusy(actionKey) {
    return actionStatus[actionKey]?.status === SAVE_STATUS.SAVING;
  }

  // Renders the Save + Restore Defaults row and any error message for a
  // panel, shared by every settings box below so each one stays in sync.
  function PanelActions({ panel }) {
    const saveKey = `${panel.section}-save`;
    const restoreKey = `${panel.section}-restore`;
    const err =
      actionStatus[saveKey]?.status === SAVE_STATUS.ERROR
        ? actionStatus[saveKey].message
        : actionStatus[restoreKey]?.status === SAVE_STATUS.ERROR
        ? actionStatus[restoreKey].message
        : null;
    return (
      <>
        {err && <p className="error-text">{err}</p>}
        <div className="settings-actions" style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-navy btn-block"
            onClick={() => handleSave(panel)}
            disabled={isBusy(saveKey) || isBusy(restoreKey)}
          >
            {actionLabel(saveKey, panel.saveLabel)}
          </button>
          <button
            className="btn btn-block"
            onClick={() => handleRestore(panel)}
            disabled={isBusy(saveKey) || isBusy(restoreKey)}
          >
            {actionLabel(restoreKey, "Restore Defaults")}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="settings-grid">
      <div className="panel">
        <h3 className="panel-title">📊 Analytics Settings</h3>
        <p className="panel-sub">Configure moving average and trend thresholds</p>

        <label className="form-label">Moving Average Window (days)</label>
        <input
          type="number"
          className="form-input"
          value={settings.analytics.movingAvgWindow}
          onChange={(e) => updateField("analytics", "movingAvgWindow", e.target.value)}
        />

        <label className="form-label">Trend Threshold (%)</label>
        <input
          type="number"
          className="form-input"
          value={settings.analytics.trendThreshold}
          onChange={(e) => updateField("analytics", "trendThreshold", e.target.value)}
        />
        <p className="form-hint">Change of ±{settings.analytics.trendThreshold}% = Increasing or Decreasing</p>

        <label className="form-label">Branch Anomaly Flag Threshold (%)</label>
        <input
          type="number"
          className="form-input"
          value={settings.analytics.anomalyThreshold}
          onChange={(e) => updateField("analytics", "anomalyThreshold", e.target.value)}
        />
        <p className="form-hint">Flag branch if transactions drop more than {settings.analytics.anomalyThreshold}% vs avg</p>

        <PanelActions panel={SETTINGS_PANELS[0]} />
      </div>

      <div className="panel">
        <h3 className="panel-title">🧾 Receipt Settings</h3>

        <label className="form-label">Business Name on Receipt</label>
        <input
          type="text"
          className="form-input"
          value={settings.receipt.businessName}
          onChange={(e) => updateField("receipt", "businessName", e.target.value)}
        />

        <label className="form-label">Tagline</label>
        <input
          type="text"
          className="form-input"
          value={settings.receipt.tagline}
          onChange={(e) => updateField("receipt", "tagline", e.target.value)}
        />

        <label className="form-label">Footer Message</label>
        <input
          type="text"
          className="form-input"
          value={settings.receipt.footer}
          onChange={(e) => updateField("receipt", "footer", e.target.value)}
        />

        <PanelActions panel={SETTINGS_PANELS[1]} />
      </div>

      <div className="panel">
        <h3 className="panel-title">🔒 Security Settings</h3>
        <div className="security-row">
          <span>Password encryption</span>
          <span className="badge badge-good">bcrypt ✓</span>
        </div>
        <div className="security-row">
          <span>JWT Auth</span>
          <span className="badge badge-good">Active ✓</span>
        </div>
        <div className="security-row">
          <span>Daily backup</span>
          <span className="badge badge-good">Supabase ✓</span>
        </div>
        <div className="security-row">
          <span>HTTPS</span>
          <span className="badge badge-good">Vercel ✓</span>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">📦 Inventory Alert Settings</h3>
        <p className="panel-sub">Default reorder thresholds for all ingredients</p>

        <label className="form-label">Low Stock Alert — kg ingredients</label>
        <input
          type="text"
          className="form-input"
          value={settings.inventoryAlerts.lowStockKg}
          onChange={(e) => updateField("inventoryAlerts", "lowStockKg", e.target.value)}
        />

        <label className="form-label">Low Stock Alert — piece ingredients</label>
        <input
          type="text"
          className="form-input"
          value={settings.inventoryAlerts.lowStockPcs}
          onChange={(e) => updateField("inventoryAlerts", "lowStockPcs", e.target.value)}
        />

        <PanelActions panel={SETTINGS_PANELS[2]} />
      </div>
    </div>
  );
}