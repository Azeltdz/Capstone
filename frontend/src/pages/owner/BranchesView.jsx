// src/pages/owner/BranchesView.jsx
import { useEffect, useState } from "react";
import {
  getBranchesData,
  createBranch,
  updateBranch,
  deactivateBranch,
  reactivateBranch,
  deleteBranch,
} from "../../api/mockOwner";

const EMPTY_FORM = { name: "", location: "", contact: "" };

export default function BranchesView() {
  const [branches, setBranches] = useState(null);
  const [error, setError] = useState("");

  // ---- Add/Edit modal + form state ----
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = "Add Branch" mode, otherwise the branch id being edited
  const [editingStaffCount, setEditingStaffCount] = useState(0); // read-only, shown in the Edit modal only
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // ---- Deactivate/Delete confirmation popup state ----
  // deleteTarget is the branch the popup refers to; the popup's copy and
  // action (deactivate vs. permanently delete) are derived from whether
  // that branch is already deactivated.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [reactivatingId, setReactivatingId] = useState(null);

  function loadBranches() {
    return getBranchesData()
      .then((d) => setBranches(d))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    let cancelled = false;
    getBranchesData()
      .then((d) => !cancelled && setBranches(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------- Add / Edit modal ----------------

  function openAddModal() {
    setEditingId(null);
    setEditingStaffCount(0);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(branch) {
    setEditingId(branch.id);
    setEditingStaffCount(branch.staffCount);
    setForm({
      name: branch.name,
      location: branch.location,
      contact: branch.contact,
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return; // don't let a backdrop click cut off an in-flight save
    setModalOpen(false);
  }

  function handleFormChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingId == null) {
        await createBranch(form);
      } else {
        await updateBranch(editingId, form);
      }
      await loadBranches();
      setModalOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ---------------- Deactivate / Delete popup ----------------

  function openDeleteConfirm(branch) {
    setDeleteError("");
    setDeleteTarget(branch);
  }

  function closeDeleteConfirm() {
    if (deleteBusy) return;
    setDeleteTarget(null);
  }

  async function confirmDeleteAction() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      if (!deleteTarget.deactivated) {
        // Step 1: deactivate. The branch stays in the list (now shown as
        // "Deactivated") — it is NOT removed yet.
        await deactivateBranch(deleteTarget.id);
      } else {
        // Step 2: the branch was already deactivated, so this confirm
        // actually removes it for good.
        await deleteBranch(deleteTarget.id);
      }
      await loadBranches();
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleReactivate(branch) {
    setReactivatingId(branch.id);
    setError("");
    try {
      await reactivateBranch(branch.id);
      await loadBranches();
    } catch (err) {
      setError(err.message);
    } finally {
      setReactivatingId(null);
    }
  }

  if (error) return <p className="error-text">Couldn't load branches. {error}</p>;
  if (!branches) return <p className="loading-text">Loading branches…</p>;

  const activeCount = branches.filter((b) => !b.deactivated).length;

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
          const cardClass = b.deactivated
            ? "branch-card-deactivated"
            : b.flagged
            ? "branch-card-flag"
            : "branch-card-main";
          const badgeClass = b.deactivated ? "badge-muted" : b.flagged ? "badge-flag" : "badge-good";
          const statusBadgeClass = b.deactivated ? "badge-muted" : b.flagged ? "badge-warn" : "badge-good";

          return (
            <div className={`branch-card ${cardClass}`} key={b.id}>
              <div className="branch-card-header">
                <h3>{b.name}</h3>
                <span className={`badge ${badgeClass}`}>{b.tag}</span>
              </div>
              <p className="branch-location">{b.location}</p>
              <div className="branch-row">
                <span>Staff count</span>
                <strong>{b.staffCount}</strong>
              </div>
              <div className="branch-row">
                <span>Status</span>
                <span className={`badge ${statusBadgeClass}`}>{b.status}</span>
              </div>
              <div className="branch-row">
                <span>Today's sales</span>
                <strong className={b.flagged && !b.deactivated ? "orange-text" : "green-text"}>
                  ₱{b.sales.toLocaleString()}
                </strong>
              </div>
              <div className="branch-row">
                <span>Contact</span>
                <strong>{b.contact}</strong>
              </div>

              <div className="branch-card-actions">
                {!b.deactivated ? (
                  <>
                    <button className="btn btn-outline btn-block" onClick={() => openEditModal(b)}>
                      Edit Branch
                    </button>
                    <button className="btn btn-danger-outline btn-block" onClick={() => openDeleteConfirm(b)}>
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-outline btn-block"
                      onClick={() => handleReactivate(b)}
                      disabled={reactivatingId === b.id}
                    >
                      {reactivatingId === b.id ? "Reactivating…" : "Reactivate"}
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

      {/* ---------------- Add / Edit Branch modal ---------------- */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId == null ? "Add New Branch" : `Edit ${form.name || "Branch"}`}</h3>
              <button type="button" className="modal-close" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <p className="error-text">{formError}</p>}

                <div className="form-field">
                  <label htmlFor="branch-name">Branch Name</label>
                  <input
                    id="branch-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
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
                    value={form.contact}
                    onChange={(e) => handleFormChange("contact", e.target.value)}
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

      {/* ---------------- Deactivate / Delete confirmation popup ---------------- */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{deleteTarget.deactivated ? "Delete branch permanently?" : "Deactivate branch?"}</h3>
              <button type="button" className="modal-close" onClick={closeDeleteConfirm} aria-label="Close">
                ×
              </button>
            </div>

            <div className="modal-body">
              {deleteError && <p className="error-text">{deleteError}</p>}

              {!deleteTarget.deactivated ? (
                <p>
                  <strong>{deleteTarget.name}</strong> will be marked <strong>Deactivated</strong> and hidden from
                  normal operations. It won't be permanently removed — you can reactivate it later, or delete it for
                  good once it's deactivated.
                </p>
              ) : (
                <p>
                  <strong>{deleteTarget.name}</strong> is already deactivated. This will permanently delete it and
                  its record. <strong>This can't be undone.</strong>
                </p>
              )}

              <div className="modal-confirm-actions">
                <button type="button" className="btn btn-outline btn-block" onClick={closeDeleteConfirm} disabled={deleteBusy}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-block"
                  onClick={confirmDeleteAction}
                  disabled={deleteBusy}
                >
                  {deleteBusy
                    ? "Working…"
                    : deleteTarget.deactivated
                    ? "Delete Permanently"
                    : "Deactivate Branch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}