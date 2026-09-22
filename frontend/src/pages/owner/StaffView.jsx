// src/pages/owner/StaffView.jsx
import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import {
  getStaffData,
  addCashierAccount,
  updateStaffAccount,
  toggleStaffStatus,
  getAssignableBranches,
} from "../../api/mockOwner";

const emptyAddForm = { name: "", username: "", password: "", branch: "" };

export default function StaffView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [branchOptions, setBranchOptions] = useState([]);

  // Add-account popup
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit popup
  const [editingRow, setEditingRow] = useState(null); // the row object being edited, or null
  const [editForm, setEditForm] = useState({ name: "", branch: "" });
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Which row's status toggle is in flight (disables just that button)
  const [busyUsername, setBusyUsername] = useState(null);

  function reload() {
    return getStaffData()
      .then((d) => setData(d))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    let cancelled = false;
    getStaffData()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Close whichever popup is open on Escape.
  useEffect(() => {
    if (!showAddModal && !editingRow) return;
    function handleKey(e) {
      if (e.key === "Escape") {
        setShowAddModal(false);
        setEditingRow(null);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showAddModal, editingRow]);

  async function openAddModal() {
    setAddForm(emptyAddForm);
    setAddError("");
    setShowAddModal(true);
    try {
      const branches = await getAssignableBranches();
      setBranchOptions(branches);
      setAddForm((f) => ({ ...f, branch: branches[0] || "" }));
    } catch {
      // popup still opens; user just won't have branch options until retried
    }
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    setAddError("");
    setAdding(true);
    try {
      await addCashierAccount(addForm);
      await reload();
      setShowAddModal(false);
      setAddForm(emptyAddForm);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function openEdit(row) {
    setEditingRow(row);
    setEditForm({ name: row.name, branch: row.branch });
    setEditError("");
    try {
      const branches = await getAssignableBranches();
      // Keep the staff member's current branch selectable even if it were
      // ever deactivated after they were assigned to it.
      setBranchOptions(Array.from(new Set([...branches, row.branch])));
    } catch {
      setBranchOptions([row.branch]);
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError("");
    setSavingEdit(true);
    try {
      await updateStaffAccount(editingRow.username, editForm);
      await reload();
      setEditingRow(null);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleToggleStatus(row) {
    setBusyUsername(row.username);
    try {
      await toggleStaffStatus(row.username);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyUsername(null);
    }
  }

  if (error) return <p className="error-text">Couldn't load staff. {error}</p>;
  if (!data) return <p className="loading-text">Loading staff…</p>;

  const { stats, rows } = data;

  return (
    <>
      <div className="view-header">
        <h2 className="view-title">Staff Management</h2>
        <button className="btn btn-navy" onClick={openAddModal}>
          + Add Staff Account
        </button>
      </div>

      <div className="stat-grid stat-grid-3">
        <StatCard label="Total Staff" value={stats.total} change="Across 2 branches" changeType="muted" />
        <StatCard label="Active Accounts" value={stats.activeAccounts} change="All accounts active" changeType="up" />
        <StatCard label="Roles" value={stats.roles} valueClassName="stat-value-sm" />
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Branch</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.username} className={row.isAdmin ? "row-highlight" : ""}>
                <td className="cell-strong">{row.name}</td>
                <td className="mono">{row.username}</td>
                <td>{row.branch}</td>
                <td>
                  <span className={`badge ${row.isAdmin ? "badge-admin" : "badge-cashier"}`}>{row.role}</span>
                </td>
                <td>
                  <span className={`badge ${row.status === "Active" ? "badge-good" : "badge-flag"}`}>{row.status}</span>
                </td>
                <td>
                  {row.isAdmin ? (
                    <span className="muted-cell">—</span>
                  ) : (
                    <>
                      <button className="action-link" onClick={() => openEdit(row)}>
                        Edit
                      </button>{" "}
                      <button
                        className="action-link action-danger"
                        disabled={busyUsername === row.username}
                        onClick={() => handleToggleStatus(row)}
                      >
                        {busyUsername === row.username ? "…" : row.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="footer-note">
        Showing {rows.length} of {rows.length} staff accounts · Deactivated accounts preserve transaction history
      </span>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => !adding && setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Cashier Account</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => !adding && setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="modal-body">
              <label className="form-row">
                Full Name
                <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
              </label>
              <label className="form-row">
                Username
                <input
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  required
                />
              </label>
              <label className="form-row">
                Password
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  minLength={6}
                  required
                />
              </label>
              <label className="form-row">
                Branch
                <select value={addForm.branch} onChange={(e) => setAddForm({ ...addForm, branch: e.target.value })} required>
                  {branchOptions.length === 0 && <option value="">No active branches</option>}
                  {branchOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>

              {addError && <p className="form-error">{addError}</p>}

              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowAddModal(false)} disabled={adding}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-navy" disabled={adding || branchOptions.length === 0}>
                  {adding ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingRow && (
        <div className="modal-overlay" onClick={() => !savingEdit && setEditingRow(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit {editingRow.name}</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => !savingEdit && setEditingRow(null)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-body">
              <label className="form-row">
                Full Name
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </label>
              <label className="form-row">
                Branch
                <select value={editForm.branch} onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })} required>
                  {branchOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>

              {editError && <p className="form-error">{editError}</p>}

              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setEditingRow(null)} disabled={savingEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-navy" disabled={savingEdit}>
                  {savingEdit ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}