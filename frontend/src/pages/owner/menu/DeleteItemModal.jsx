import { useState } from "react";
import toast from "react-hot-toast";
import ModalShell from "../../../components/ModalShell";
import { useDeleteMenuItem, useUpdateMenuItem } from "../../../hooks/useMenuItems";

export default function DeleteItemModal({ item, onClose }) {
  const remove = useDeleteMenuItem();
  const hide = useUpdateMenuItem();
  const [error, setError] = useState("");
  const [hasHistory, setHasHistory] = useState(false);
  const busy = remove.isPending || hide.isPending;

  async function confirmDelete() {
    setError("");
    try {
      await remove.mutateAsync(item.item_id);
      toast.success(`${item.item_name} deleted`);
      onClose();
    } catch (err) {
      setError(err.message);
      setHasHistory(err.status === 409);
    }
  }

  async function hideInstead() {
    setError("");
    try {
      await hide.mutateAsync({ id: item.item_id, body: JSON.stringify({ is_available: false }) });
      toast.success(`${item.item_name} hidden from the menu`);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ModalShell title="Delete menu item?" width={440} onClose={() => !busy && onClose()}>
      <p>
        <strong>{item.item_name}</strong> and its recipe will be removed. This can't be undone. Items with sales
        history can't be deleted, but they can be hidden.
      </p>
      {error && <p className="error-text" role="alert">{error}</p>}
      <div className="menu-modal-actions">
        <button type="button" className="menu-btn" onClick={onClose} disabled={busy}>Cancel</button>
        {hasHistory ? (
          <button type="button" className="menu-btn menu-btn-primary" onClick={hideInstead} disabled={busy}>
            {hide.isPending ? "Hiding…" : "Hide from menu instead"}
          </button>
        ) : (
          <button type="button" className="menu-btn menu-btn-danger" onClick={confirmDelete} disabled={busy} autoFocus>
            {remove.isPending ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
    </ModalShell>
  );
}