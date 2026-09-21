// src/pages/owner/SettingsView.jsx
import { useEffect, useState } from "react";
import { getSettingsData } from "../../api/mockOwner";

export default function SettingsView() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");

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

  function handleSave(section) {
    // Real version later:
    //   await apiFetch(`/api/settings/${section}`, { method: "PUT", body: JSON.stringify(settings[section]) });
    alert(`${section} settings would be saved here.`);
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
        <p className="form-hint">Change of ±10% = Increasing or Decreasing</p>

        <label className="form-label">Branch Anomaly Flag Threshold (%)</label>
        <input
          type="number"
          className="form-input"
          value={settings.analytics.anomalyThreshold}
          onChange={(e) => updateField("analytics", "anomalyThreshold", e.target.value)}
        />
        <p className="form-hint">Flag branch if sales drop more than 20% vs avg</p>

        <button className="btn btn-navy btn-block" onClick={() => handleSave("Analytics")}>
          Save Analytics Settings
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

        <button className="btn btn-navy btn-block" onClick={() => handleSave("Receipt")}>
          Save Receipt Settings
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

        <button className="btn btn-navy btn-block" onClick={() => handleSave("Inventory Alert")}>
          Save Alert Settings
        </button>
      </div>
    </div>
  );
}
