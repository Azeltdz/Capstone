// src/pages/owner/StaffView.jsx
import { useState, useMemo } from "react";
import StatCard from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";
import { useBranches } from "../../hooks/useBranches";
import {
  useStaffList,
  useCreateStaff,
  useUpdateStaff,
  useDeactivateStaff,
  useActivateStaff,
} from "../../hooks/useStaff";

const EMPTY_ADD_FORM = { full_name: "", user_name: "", password: "", role: "cashier", branch_id: "" };

export default function StaffView() {
  const { user: currentUser } = useAuth();
  const { data: staff = [], isLoading, error } = useStaffList();
  const { data: branches = [] } = useBranches();

  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deactivateStaff = useDeactivateStaff();
  const activateStaff = useActivateStaff();

  const activeBranches = useMemo(() => branches.filter((b) => b.is_active), [branches]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [addError, setAddError] = useState("");

  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", role: "cashier", branch_id: "" });
  const [editError, setEditError] = useState("");

  const [busyId, setBusyId] = useState(null);

  function branchName(branchId) {
    return branches.find((b) => b.branch_id === branchId)?.branch_name || "—";
  }

  function openAddModal() {
    setAddForm({ ...EMPTY_ADD_FORM, branch_id: String(activeBranches[0]?.branch_id ?? "") });
    setAddError("");
    setShowAddModal(true);
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    setAddError("");
    try {
      if (!addForm.full_name.trim()) throw new Error("Full name is required.");
      if (addForm.user_name.trim().length < 3) throw new Error("Username must be at least 3 characters.");
      if (addForm.password.length < 6) throw new Error("Password must be at least 6 characters.");
      if (addForm.role === "cashier" && !addForm.branch_id) throw new Error("Please choose a branch.");

      await createStaff.mutateAsync({
        full_name: addForm.full_name.trim(),
        user_name: addForm.user_name.trim(),
        password: addForm.password,
        role: addForm.role,
        ...(addForm.role === "cashier" ? { branch_id: Number(addForm.branch_id) } : {}),
      });
      setShowAddModal(false);
    } catch (err) {
      setAddError(err.message);
    }
  }

  function openEdit(row) {
    setEditingRow(row);
    setEditForm({
      full_name: row.full_name,
      role: row.role,
      branch_id: activeBranches.some((b) => b.branch_id === row.branch_id)
        ? String(row.branch_id)
        : String(activeBranches[0]?.branch_id ?? ""),
    });
    setEditError("");
  }

  function handleEditRoleChange(newRole) {
    setEditForm((prev) => ({
      ...prev,
      role: newRole,
      branch_id:
        newRole === "cashier" && !prev.branch_id
          ? String(activeBranches[0]?.branch_id ?? "")
          : prev.branch_id,
    }));
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError("");
    try {
      if (!editForm.full_name.trim()) throw new Error("Full name is required.");
      if (editForm.role === "cashier" && !editForm.branch_id) throw new Error("Please choose a branch.");

      await updateStaff.mutateAsync({
        id: editingRow.user_id,
        full_name: editForm.full_name.trim(),
        role: editForm.role,
        branch_id: editForm.role === "cashier" ? Number(editForm.branch_id) : null,
      });
      setEditingRow(null);
    } catch (err) {
      setEditError(err.message);
    }
  }

  async function handleToggleStatus(row) {
    setBusyId(row.user_id);
    try {
      if (row.is_active) await deactivateStaff.mutateAsync(row.user_id);
      else await activateStaff.mutateAsync(row.user_id);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <p className="error-text">Couldn't load staff. {error.message}</p>;
  if (isLoading) return <p className="loading-text">Loading staff…</p>;

  const total = staff.length;
  const activeAccounts = staff.filter((s) => s.is_active).length;
  const roles = [...new Set(staff.map((s) => (s.role === "owner" ? "Owner" : "Cashier")))].join(", ");
  const branchCount = new Set(staff.filter((s) => s.branch_id).map((s) => s.branch_id)).size;

  return (
    <>
      <div className="view-header">
        <h2 className="view-title">Staff Management</h2>
        <button className="btn btn-navy" onClick={openAddModal}>
          + Add Staff Account
        </button>
      </div>

      <div className="stat-grid stat-grid-3">
        <StatCard label="Total Staff" value={total} change={`Across ${branchCount} branches`} changeType="muted" />
        <StatCard label="Active Accounts" value={activeAccounts} change={`${total - activeAccounts} deactivated`} changeType="up" />
        <StatCard label="Roles" value={roles} valueClassName="stat-value-sm" />
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
            {staff.map((row) => {
              const isSelf = row.user_id === currentUser.user_id;
              return (
                <tr key={row.user_id} className={row.role === "owner" ? "row-highlight" : ""}>
                  <td className="cell-strong">{row.full_name}</td>
                  <td className="mono">{row.user_name}</td>
                  <td>{row.branch_id ? branchName(row.branch_id) : "—"}</td>
                  <td>
                    <span className={`badge ${row.role === "owner" ? "badge-admin" : "badge-cashier"}`}>
                      {row.role === "owner" ? "Owner" : "Cashier"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${row.is_active ? "badge-good" : "badge-flag"}`}>
                      {row.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td>
                    {isSelf ? (
                      <span className="muted-cell">— (you)</span>
                    ) : (
                      <>
                        <button className="action-link" onClick={() => openEdit(row)}>
                          Edit
                        </button>{" "}
                        <button
                          className="action-link action-danger"
                          disabled={busyId === row.user_id}
                          onClick={() => handleToggleStatus(row)}
                        >
                          {busyId === row.user_id ? "…" : row.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <span className="footer-note">
        Showing {staff.length} staff accounts · Deactivated accounts preserve transaction history
      </span>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Staff Account</h3>
              <button type="button" className="modal-close" aria-label="Close" onClick={() => setShowAddModal(false)}>
                X
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="modal-body">
              <label className="form-row">
                Full Name
                <input value={addForm.full_name} onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} required />
              </label>
              <label className="form-row">
                Username
                <input value={addForm.user_name} onChange={(e) => setAddForm({ ...addForm, user_name: e.target.value })} required />
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
                Role
                <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}>
                  <option value="cashier">Cashier</option>
                  <option value="owner">Owner</option>
                </select>
              </label>
              {addForm.role === "cashier" && (
                <label className="form-row">
                  Branch
                  <select value={addForm.branch_id} onChange={(e) => setAddForm({ ...addForm, branch_id: e.target.value })} required>
                    {activeBranches.length === 0 && <option value="">No active branches</option>}
                    {activeBranches.map((b) => (
                      <option key={b.branch_id} value={String(b.branch_id)}>
                        {b.branch_name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {addError && <p className="form-error">{addError}</p>}

              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowAddModal(false)} disabled={createStaff.isPending}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-navy"
                  disabled={createStaff.isPending || (addForm.role === "cashier" && activeBranches.length === 0)}
                >
                  {createStaff.isPending ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingRow && (
        <div className="modal-overlay" onClick={() => setEditingRow(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit {editingRow.full_name}</h3>
              <button type="button" className="modal-close" aria-label="Close" onClick={() => setEditingRow(null)}>
                X
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-body">
              <label className="form-row">
                Full Name
                <input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} required />
              </label>
              <label className="form-row">
                Role
                <select value={editForm.role} onChange={(e) => handleEditRoleChange(e.target.value)}>
                  <option value="cashier">Cashier</option>
                  <option value="owner">Owner</option>
                </select>
              </label>
              {editForm.role === "cashier" && (
                <label className="form-row">
                  Branch
                  <select value={editForm.branch_id} onChange={(e) => setEditForm({ ...editForm, branch_id: e.target.value })} required>
                    {activeBranches.map((b) => (
                      <option key={b.branch_id} value={String(b.branch_id)}>
                        {b.branch_name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {editError && <p className="form-error">{editError}</p>}

              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setEditingRow(null)} disabled={updateStaff.isPending}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-navy" disabled={updateStaff.isPending}>
                  {updateStaff.isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}