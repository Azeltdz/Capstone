// src/pages/owner/SettingsView.jsx
import { useEffect, useState } from "react";
import {
  getSettingsData,
  updateAnalyticsSettings,
  updateReceiptSettings,
  updateInventoryAlertSettings,
  updateBranchTableCount,
} from "../../api/mockOwner";

const SAVE_STATUS = { IDLE: "idle", SAVING: "saving", SAVED: "saved", ERROR: "error" };

export default function SettingsView() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  // One entry per panel: { [panelKey]: { status, message } }. Kept separate
  // from `settings` so a failed save on one panel never blocks or clears
  // the others.
  const [saveStatus, setSaveStatus] = useState({});

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

  function updateBranchTableField(branchId, value) {
    setSettings((prev) => ({
      ...prev,
      branchTables: prev.branchTables.map((b) => (b.id === branchId ? { ...b, tableCount: value } : b)),
    }));
  }

  // Shared saving/saved/error lifecycle for every panel, so each save
  // handler below is just "what to send", not "how to track it".
  async function runSave(panelKey, saveFn) {
    setSaveStatus((prev) => ({ ...prev, [panelKey]: { status: SAVE_STATUS.SAVING } }));
    try {
      await saveFn();
      setSaveStatus((prev) => ({ ...prev, [panelKey]: { status: SAVE_STATUS.SAVED } }));
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [panelKey]: { status: SAVE_STATUS.IDLE } }));
      }, 2000);
    } catch (err) {
      setSaveStatus((prev) => ({ ...prev, [panelKey]: { status: SAVE_STATUS.ERROR, message: err.message } }));
    }
  }

  function handleSaveAnalytics() {
    runSave("analytics", async () => {
      const saved = await updateAnalyticsSettings({
        movingAvgWindow: Number(settings.analytics.movingAvgWindow),
        trendThreshold: Number(settings.analytics.trendThreshold),
        anomalyThreshold: Number(settings.analytics.anomalyThreshold),
      });
      setSettings((prev) => ({ ...prev, analytics: saved }));
    });
  }

  function handleSaveReceipt() {
    runSave("receipt", async () => {
      const saved = await updateReceiptSettings(settings.receipt);
      setSettings((prev) => ({ ...prev, receipt: saved }));
    });
  }

  function handleSaveInventoryAlerts() {
    runSave("inventoryAlerts", async () => {
      const saved = await updateInventoryAlertSettings(settings.inventoryAlerts);
      setSettings((prev) => ({ ...prev, inventoryAlerts: saved }));
    });
  }

  function handleSaveTableCounts() {
    runSave("tables", async () => {
      // Each branch's table count is its own row, so save them in parallel
      // rather than inventing a bulk-update endpoint just for this panel.
      const updated = await Promise.all(
        settings.branchTables.map((b) => updateBranchTableCount(b.id, b.tableCount))
      );
      setSettings((prev) => ({
        ...prev,
        branchTables: updated.map(({ id, name, tableCount }) => ({ id, name, tableCount })),
      }));
    });
  }

  function saveLabel(panelKey, defaultLabel) {
    const status = saveStatus[panelKey]?.status;
    if (status === SAVE_STATUS.SAVING) return "Saving…";
    if (status === SAVE_STATUS.SAVED) return "Saved ✓";
    return defaultLabel;
  }

  function isSaving(panelKey) {
    return saveStatus[panelKey]?.status === SAVE_STATUS.SAVING;
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

        {saveStatus.analytics?.status === SAVE_STATUS.ERROR && (
          <p className="error-text">{saveStatus.analytics.message}</p>
        )}
        <button className="btn btn-navy btn-block" onClick={handleSaveAnalytics} disabled={isSaving("analytics")}>
          {saveLabel("analytics", "Save Analytics Settings")}
        </button>
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

        {saveStatus.receipt?.status === SAVE_STATUS.ERROR && (
          <p className="error-text">{saveStatus.receipt.message}</p>
        )}
        <button className="btn btn-navy btn-block" onClick={handleSaveReceipt} disabled={isSaving("receipt")}>
          {saveLabel("receipt", "Save Receipt Settings")}
        </button>
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

      {/* Ch.3 Fig. 23: "...the number of tables per branch used by the POS
          table selection screen." Table counts live on the branches table
          itself (see BRANCHES_DB / updateBranchTableCount in mockOwner.js),
          not in the settings object, but are edited here for convenience —
          same field the Branch Management tab's "table count" edits. */}
      <div className="panel">
        <h3 className="panel-title">🪑 Table Management</h3>
        <p className="panel-sub">Number of tables per branch, used by the POS table selection screen</p>

        {settings.branchTables.map((branch) => (
          <div key={branch.id}>
            <label className="form-label">{branch.name}</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={branch.tableCount}
              onChange={(e) => updateBranchTableField(branch.id, e.target.value)}
            />
          </div>
        ))}

        {saveStatus.tables?.status === SAVE_STATUS.ERROR && (
          <p className="error-text">{saveStatus.tables.message}</p>
        )}
        <button className="btn btn-navy btn-block" onClick={handleSaveTableCounts} disabled={isSaving("tables")}>
          {saveLabel("tables", "Save Table Counts")}
        </button>
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

        {saveStatus.inventoryAlerts?.status === SAVE_STATUS.ERROR && (
          <p className="error-text">{saveStatus.inventoryAlerts.message}</p>
        )}
        <button className="btn btn-navy btn-block" onClick={handleSaveInventoryAlerts} disabled={isSaving("inventoryAlerts")}>
          {saveLabel("inventoryAlerts", "Save Alert Settings")}
        </button>
      </div>
    </div>
  );
}