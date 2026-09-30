// src/pages/owner/BranchesView.jsx
import { useState } from "react";
import {
  useBranchesSummary,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from "../../hooks/useBranches";
import ManageTablesModal from "./branches/ManageTablesModal";

const EMPTY_FORM = { branch_name: "", location: "", contact_number: "" };

function statusFor(branch) {
  if (!branch.is_active) return { label: "Deactivated", badgeClass: "badge-muted" };
  if (branch.flagged) return { label: "Flagged", badgeClass: "badge-warn" };
  return { label: "Active", badgeClass: "badge-good" };
}

export default function BranchesView() {
  const { data: branches = [], isLoading, error } = useBranchesSummary();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingStaffCount, setEditingStaffCount] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [reactivatingId, setReactivatingId] = useState(null);
  const [tablesBranch, setTablesBranch] = useState(null);

  function openAddModal() {
    setEditingId(null);
    setEditingStaffCount(0);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(branch) {
    setEditingId(branch.branch_id);
    setEditingStaffCount(branch.staff_count);
    setForm({
      branch_name: branch.branch_name,
      location: branch.location || "",
      contact_number: branch.contact_number || "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (!saving) setModalOpen(false);
  }

  function handleFormChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (!form.branch_name.trim()) throw new Error("Branch name is required.");
      if (editingId == null) {
        await createBranch.mutateAsync(form);
      } else {
        await updateBranch.mutateAsync({ id: editingId, ...form });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openDeleteConfirm(branch) {
    setDeleteError("");
    setDeleteTarget(branch);
  }

  function closeDeleteConfirm() {
    if (!deleteBusy) setDeleteTarget(null);
  }

  async function confirmDeleteAction() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      if (deleteTarget.is_active) {
        // Step 1: deactivate only
        await updateBranch.mutateAsync({ id: deleteTarget.branch_id, is_active: false });
      } else {
        // Step 2: already deactivated -> attempt permanent delete
        await deleteBranch.mutateAsync(deleteTarget.branch_id);
      }
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleReactivate(branch) {
    setReactivatingId(branch.branch_id);
    try {
      await updateBranch.mutateAsync({ id: branch.branch_id, is_active: true });
    } finally {
      setReactivatingId(null);
    }
  }

  if (error) return <p className="error-text">Couldn't load branches. {error.message}</p>;
  if (isLoading) return <p className="loading-text">Loading branches…</p>;

  const activeCount = branches.filter((b) => b.is_active).length;

  return (
    <>
      <div className="view-header-row">
        <h2 className="view-title">Branch Management — {activeCount} Active Branches</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Add Branch
        </button>
      </div>

      <div className="branch-grid">
        {branches.map((b) => {
          const { label, badgeClass } = statusFor(b);
          const cardClass = !b.is_active
            ? "branch-card-deactivated"
            : b.flagged
            ? "branch-card-flag"
            : "branch-card-main";

          return (
            <div className={`branch-card ${cardClass}`} key={b.branch_id}>
              <div className="branch-card-header">
                <h3>{b.branch_name}</h3>
                <span className={`badge ${badgeClass}`}>{label}</span>
              </div>
              <p className="branch-location">{b.location}</p>
              <div className="branch-row">
                <span>Staff count</span>
                <strong>{b.staff_count}</strong>
              </div>
              <div className="branch-row">
                <span>Tables</span>
                <strong>{b.table_count || "None yet"}</strong>
              </div>
              <div className="branch-row">
                <span>Status</span>
                <span className={`badge ${badgeClass}`}>{label}</span>
              </div>
              <div className="branch-row">
                <span>Today's sales</span>
                <strong className={b.flagged && b.is_active ? "orange-text" : "green-text"}>
                  ₱{Number(b.sales_today).toLocaleString()}
                </strong>
              </div>
              <div className="branch-row">
                <span>Contact</span>
                <strong>{b.contact_number || "—"}</strong>
              </div>

              <div className="branch-card-actions">
                {b.is_active ? (
                  <>
                    <button className="btn btn-outline btn-block" onClick={() => setTablesBranch(b)}>
                      Manage Tables
                    </button>
                    <button className="btn btn-outline btn-block" onClick={() => openEditModal(b)}>
                      Edit Branch
                    </button>
                    <button className="btn btn-danger-outline btn-block" onClick={() => openDeleteConfirm(b)}>
                      Deactivate
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-outline btn-block"
                      onClick={() => handleReactivate(b)}
                      disabled={reactivatingId === b.branch_id}
                    >
                      {reactivatingId === b.branch_id ? "Reactivating…" : "Reactivate"}
                    </button>
                    <button className="btn btn-danger-outline btn-block" onClick={() => openDeleteConfirm(b)}>
                      Delete Permanently
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId == null ? "Add New Branch" : `Edit ${form.branch_name || "Branch"}`}</h3>
              <button type="button" className="modal-close" onClick={closeModal} aria-label="Close">×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <p className="error-text">{formError}</p>}

                <div className="form-field">
                  <label htmlFor="branch-name">Branch Name</label>
                  <input
                    id="branch-name"
                    type="text"
                    value={form.branch_name}
                    onChange={(e) => handleFormChange("branch_name", e.target.value)}
                    placeholder="e.g. Alangilan"
                    autoFocus
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="branch-location">Location</label>
                  <input
                    id="branch-location"
                    type="text"
                    value={form.location}
                    onChange={(e) => handleFormChange("location", e.target.value)}
                    placeholder="e.g. Bauan, Batangas"
                  />
                </div>

                {editingId != null && (
                  <div className="form-field">
                    <label>Staff Count</label>
                    <div className="form-readonly-value">
                      {editingStaffCount} {editingStaffCount === 1 ? "staff" : "staff"} assigned
                    </div>
                    <p className="form-field-hint">
                      Set automatically from Staff Management — assign or remove staff there to change this.
                    </p>
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="branch-contact">Contact Number</label>
                  <input
                    id="branch-contact"
                    type="text"
                    value={form.contact_number}
                    onChange={(e) => handleFormChange("contact_number", e.target.value)}
                    placeholder="09XX-XXX-XXXX"
                  />
                </div>

                <button type="submit" className="btn btn-primary modal-submit" disabled={saving}>
                  {saving ? "Saving…" : editingId == null ? "Create Branch" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{!deleteTarget.is_active ? "Delete branch permanently?" : "Deactivate branch?"}</h3>
              <button type="button" className="modal-close" onClick={closeDeleteConfirm} aria-label="Close">×</button>
            </div>

            <div className="modal-body">
              {deleteError && <p className="error-text">{deleteError}</p>}

              {deleteTarget.is_active ? (
                <p>
                  <strong>{deleteTarget.branch_name}</strong> will be marked <strong>Deactivated</strong> and hidden
                  from normal operations. It won't be permanently removed — you can reactivate it later, or delete it
                  for good once it's deactivated.
                </p>
              ) : (
                <p>
                  <strong>{deleteTarget.branch_name}</strong> is already deactivated. This will permanently delete it
                  and its record — but only if it has no staff, tables, inventory, or transaction history.
                  <strong> This can't be undone.</strong>
                </p>
              )}

              <div className="modal-confirm-actions">
                <button type="button" className="btn btn-outline btn-block" onClick={closeDeleteConfirm} disabled={deleteBusy}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger btn-block" onClick={confirmDeleteAction} disabled={deleteBusy}>
                  {deleteBusy ? "Working…" : !deleteTarget.is_active ? "Delete Permanently" : "Deactivate Branch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {tablesBranch && <ManageTablesModal branch={tablesBranch} onClose={() => setTablesBranch(null)} />}
    </>
  );
}