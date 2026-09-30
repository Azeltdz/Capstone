// src/pages/owner/SettingsView.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useBranches } from "../../hooks/useBranches";
import {
  useSettings, useUpdateSettings, useSecurityStatus, useReceiptSettings, useUpdateReceiptSettings,
} from "../../hooks/useSettings";
import { ANALYTICS_DEFAULTS, INVENTORY_ALERT_DEFAULTS, RECEIPT_DEFAULTS } from "../../constants/settingsDefaults";

// ---------- Validation (mirrors the backend's express-validator rules) ----------
// Inputs stay strings in the form; converted to numbers only when sending.
const numericString = ({ label, min, max, integer = false }) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => Number.isFinite(Number(v)), `${label} must be a number`)
    .refine((v) => !integer || Number.isInteger(Number(v)), `${label} must be a whole number`)
    .refine(
      (v) => Number(v) >= min && (max === undefined || Number(v) <= max),
      max === undefined ? `${label} must be at least ${min}` : `${label} must be between ${min} and ${max}`
    );

const analyticsSchema = z.object({
  moving_average_window: numericString({ label: "Moving average window", min: 1, max: 30, integer: true }),
  trend_threshold: numericString({ label: "Trend threshold", min: 0, max: 100 }),
  anomaly_threshold: numericString({ label: "Anomaly threshold", min: 0, max: 100 }),
  lead_time_days: numericString({ label: "Supplier lead time", min: 0, max: 30, integer: true }),
  safety_stock_days: numericString({ label: "Safety stock", min: 0, max: 30, integer: true }),
});

const inventoryAlertSchema = z.object({
  low_stock_default_kg: numericString({ label: "Low-stock level (kg)", min: 0 }),
  low_stock_default_pcs: numericString({ label: "Low-stock level (pcs)", min: 0 }),
});

const receiptSchema = z.object({
  business_name: z.string().trim().min(1, "Business name is required").max(100, "Keep it under 100 characters"),
  footer_message: z.string().trim().max(200, "Keep it under 200 characters"),
});

// Server value if present, otherwise the default. Guards against a backend that
// hasn't been restarted yet (new keys would be undefined).
function withDefaults(source, defaults) {
  return Object.fromEntries(Object.keys(defaults).map((k) => [k, String(source?.[k] ?? defaults[k])]));
}

// ---------- Small shared pieces (module level, so they aren't recreated every render) ----------
function TextField({ id, label, hint, error, registration, type = "text", ...inputProps }) {
  return (
    <>
      <label className="form-label" htmlFor={id}>{label}</label>
      <input id={id} type={type} className="form-input" aria-invalid={!!error} {...registration} {...inputProps} />
      {error ? (
        <p className="error-text" role="alert">{error}</p>
      ) : hint ? (
        <p className="form-hint">{hint}</p>
      ) : null}
    </>
  );
}

function PanelActions({ isDirty, isSaving, saveLabel, onRestore }) {
  return (
    <div className="settings-actions" style={{ display: "flex", gap: 8 }}>
      <button type="submit" className="btn btn-navy btn-block" disabled={!isDirty || isSaving}>
        {isSaving ? "Saving…" : saveLabel}
      </button>
      <button type="button" className="btn btn-block" onClick={onRestore} disabled={isSaving}>
        Restore Defaults
      </button>
    </div>
  );
}

// ---------- Panels ----------
function AnalyticsPanel({ settings }) {
  const update = useUpdateSettings();
  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(analyticsSchema),
    defaultValues: withDefaults(settings, ANALYTICS_DEFAULTS),
  });

  const trend = watch("trend_threshold");
  const anomaly = watch("anomaly_threshold");

  async function onSubmit(values) {
    try {
      await update.mutateAsync({
        moving_average_window: Number(values.moving_average_window),
        trend_threshold: Number(values.trend_threshold),
        anomaly_threshold: Number(values.anomaly_threshold),
        lead_time_days: Number(values.lead_time_days),
        safety_stock_days: Number(values.safety_stock_days),
      });
      reset(values); // saved values become the new baseline, so the form is clean again
      toast.success("Analytics settings saved");
    } catch (err) {
      toast.error(err.message);
    }
  }

  function handleRestore() {
    // keepDefaultValues: the form shows the defaults but still compares against what's
    // saved, so Save enables and nothing is written until the owner confirms.
    reset(ANALYTICS_DEFAULTS, { keepDefaultValues: true });
    toast("Defaults loaded. Click Save to apply them.");
  }

  return (
    <form className="panel" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h3 className="panel-title">📊 Analytics Settings</h3>
      <p className="panel-sub">Configure moving average and trend thresholds</p>

      <TextField
        id="ma-window" label="Moving Average Window (days)" type="number" step="1"
        registration={register("moving_average_window")} error={errors.moving_average_window?.message}
      />
      <TextField
        id="trend-threshold" label="Trend Threshold (%)" type="number" step="any"
        hint={`Change of ±${trend}% = Increasing or Decreasing`}
        registration={register("trend_threshold")} error={errors.trend_threshold?.message}
      />
      <TextField
        id="anomaly-threshold" label="Branch Anomaly Flag Threshold (%)" type="number" step="any"
        hint={`Flag branch if transactions drop more than ${anomaly}% vs avg`}
        registration={register("anomaly_threshold")} error={errors.anomaly_threshold?.message}
      />
      <TextField
        id="lead-time" label="Supplier Lead Time (days)" type="number" step="1"
        hint="Days between placing an order and receiving it"
        registration={register("lead_time_days")} error={errors.lead_time_days?.message}
      />
      <TextField
        id="safety-stock" label="Safety Stock (days)" type="number" step="1"
        hint="Extra days of stock kept as a buffer"
        registration={register("safety_stock_days")} error={errors.safety_stock_days?.message}
      />
      <PanelActions
        isDirty={isDirty} isSaving={update.isPending}
        saveLabel="Save Analytics Settings" onRestore={handleRestore}
      />
    </form>
  );
}

function InventoryAlertsPanel({ settings }) {
  const update = useUpdateSettings();
  const {
    register, handleSubmit, reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(inventoryAlertSchema),
    defaultValues: withDefaults(settings, INVENTORY_ALERT_DEFAULTS),
  });

  async function onSubmit(values) {
    try {
      await update.mutateAsync({
        low_stock_default_kg: Number(values.low_stock_default_kg),
        low_stock_default_pcs: Number(values.low_stock_default_pcs),
      });
      reset(values);
      toast.success("Inventory alert settings saved");
    } catch (err) {
      toast.error(err.message);
    }
  }

  function handleRestore() {
    reset(INVENTORY_ALERT_DEFAULTS, { keepDefaultValues: true });
    toast("Defaults loaded. Click Save to apply them.");
  }

  return (
    <form className="panel" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h3 className="panel-title">📦 Inventory Alert Settings</h3>
      <p className="panel-sub">
        Suggested reorder level when adding a new ingredient. Existing items keep their own levels.
      </p>

      <TextField
        id="low-stock-kg" label="Default low-stock level: kg ingredients" type="number" step="any"
        registration={register("low_stock_default_kg")} error={errors.low_stock_default_kg?.message}
      />
      <TextField
        id="low-stock-pcs" label="Default low-stock level: piece ingredients" type="number" step="any"
        registration={register("low_stock_default_pcs")} error={errors.low_stock_default_pcs?.message}
      />

      <PanelActions
        isDirty={isDirty} isSaving={update.isPending}
        saveLabel="Save Alert Settings" onRestore={handleRestore}
      />
    </form>
  );
}

function ReceiptForm({ branchId, receipt }) {
  const update = useUpdateReceiptSettings(branchId);
  const {
    register, handleSubmit, reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      business_name: receipt.business_name ?? RECEIPT_DEFAULTS.business_name,
      footer_message: receipt.footer_message ?? RECEIPT_DEFAULTS.footer_message,
    },
  });

  async function onSubmit(values) {
    try {
      await update.mutateAsync(values);
      reset(values);
      toast.success("Receipt settings saved");
    } catch (err) {
      toast.error(err.message);
    }
  }

  function handleRestore() {
    reset(RECEIPT_DEFAULTS, { keepDefaultValues: true });
    toast("Defaults loaded. Click Save to apply them.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField
        id="receipt-name" label="Business Name on Receipt"
        registration={register("business_name")} error={errors.business_name?.message}
      />
      <TextField
        id="receipt-footer" label="Footer Message"
        registration={register("footer_message")} error={errors.footer_message?.message}
      />
      <PanelActions
        isDirty={isDirty} isSaving={update.isPending}
        saveLabel="Save Receipt Settings" onRestore={handleRestore}
      />
    </form>
  );
}

function ReceiptPanel() {
  const { data: branches = [] } = useBranches();
  const activeBranches = branches.filter((b) => b.is_active);
  const [pickedBranch, setPickedBranch] = useState("");
  const branchId = pickedBranch || String(activeBranches[0]?.branch_id ?? "");

  const { data: receipt, error } = useReceiptSettings(branchId);

  return (
    <div className="panel">
      <h3 className="panel-title">🧾 Receipt Settings</h3>
      <p className="panel-sub">Printed on receipts for the selected branch</p>

      <label className="form-label" htmlFor="receipt-branch">Branch</label>
      <select
        id="receipt-branch" className="form-input" value={branchId}
        onChange={(e) => setPickedBranch(e.target.value)}
      >
        {activeBranches.map((b) => (
          <option key={b.branch_id} value={String(b.branch_id)}>{b.branch_name}</option>
        ))}
      </select>

      {!branchId && <p className="loading-text">No active branches.</p>}
      {error && <p className="error-text">Couldn't load receipt settings. {error.message}</p>}
      {/* key remounts the form with fresh values whenever the branch changes */}
      {receipt && <ReceiptForm key={branchId} branchId={branchId} receipt={receipt} />}
    </div>
  );
}

function SecurityPanel() {
  const { data: items = [], isLoading, error } = useSecurityStatus();

  return (
    <div className="panel">
      <h3 className="panel-title">🔒 Security Settings</h3>
      {isLoading && <p className="loading-text">Checking…</p>}
      {error && <p className="error-text">Couldn't load security status. {error.message}</p>}
      {items.map((item) => (
        <div className="security-row" key={item.key}>
          <span>{item.label}</span>
          <span className={`badge ${item.ok ? "badge-good" : "badge-warn"}`}>
            {item.value} {item.ok ? "✓" : "⚠"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------- Page ----------
export default function SettingsView() {
  const { data: settings, isLoading, error } = useSettings();

  if (error) return <p className="error-text">Couldn't load settings. {error.message}</p>;
  if (isLoading) return <p className="loading-text">Loading settings…</p>;

  return (
    <div className="settings-grid">
      <AnalyticsPanel settings={settings} />
      <ReceiptPanel />
      <SecurityPanel />
      <InventoryAlertsPanel settings={settings} />
    </div>
  );
}