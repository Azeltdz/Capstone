import { format } from "date-fns";
import { Users } from "lucide-react";
import { formatPeso } from "../utils/format";
import { getTableTone, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "../utils/orderStatus";

export default function TableTile({ table, onClick, disabled = false, selected = false }) {
  const tone = getTableTone(table);
  const occupied = tone !== "available";
  const orderStatus = table.seated_order_status ?? "pending";
  const seatedTime = table.seated_at ? format(new Date(table.seated_at), "h:mm a") : "";
  const total = table.seated_total != null ? formatPeso(Number(table.seated_total)) : "";

  const label = occupied
    ? `Table ${table.table_number}, ${PAYMENT_STATUS_LABELS[tone]}, order ${ORDER_STATUS_LABELS[orderStatus]}` +
      (table.seated_guests ? `, ${table.seated_guests} guests` : "") +
      (total ? `, ${total}` : "")
    : `Table ${table.table_number}, available, ${table.guest_capacity} seats`;

  const className = ["table-tile", `table-tile--${tone}`, selected ? "is-selected" : ""]
    .filter(Boolean)
    .join(" ");

  const body = occupied ? (
    <>
      <span className="table-tile-top">
        <span className="table-tile-cashier">{table.seated_cashier || ""}</span>
        <span className="table-tile-flag">{PAYMENT_STATUS_LABELS[tone]}</span>
      </span>
      <span className="table-tile-name">Table {table.table_number}</span>
      <span className="table-tile-meta">
        <Users size={13} aria-hidden="true" />
        {table.seated_guests ?? "–"} · {ORDER_STATUS_LABELS[orderStatus]}
      </span>
      <span className="table-tile-bottom">
        <span>{seatedTime}</span>
        <strong>{total}</strong>
      </span>
    </>
  ) : (
    <>
      <span className="table-tile-name">Table {table.table_number}</span>
      <span className="table-tile-seats">{table.guest_capacity} seats</span>
    </>
  );

  if (!onClick) {
    return (
      <div className={className} role="group" aria-label={label}>
        {body}
      </div>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled} aria-label={label}>
      {body}
    </button>
  );
}