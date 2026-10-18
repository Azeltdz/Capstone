import { formatPeso } from "../../utils/format";

export function getTableTone(t) {
  if (t.status !== "occupied") return "free";
  if (t.seated_payment_status === "unpaid") return "unpaid";
  if (t.seated_payment_status === "paid") return "paid";
  return "busy";
}

export const TONE_LABEL = { free: "Available", unpaid: "Unpaid", paid: "Paid", busy: "Occupied" };

const timeFmt = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

export default function TableTile({ table: t, onClick, disabled = false }) {
  const tone = getTableTone(t);
  const seated = tone !== "free";

  return (
    <button
      type="button"
      className={`tt tt--${tone}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Table ${t.table_number}, ${TONE_LABEL[tone]}${seated && t.seated_total != null ? `, ${formatPeso(t.seated_total)}` : ""}`}
    >
      {seated ? (
        <>
          <span className="tt-top">{t.seated_cashier}</span>
          <span className="tt-mid">
            <span className="tt-name">Table {t.table_number}</span>
            {t.seated_guests ? <span className="tt-guests">{t.seated_guests}</span> : null}
          </span>
          <span className="tt-bottom">
            <span>{t.seated_at ? timeFmt.format(new Date(t.seated_at)) : ""}</span>
            {t.seated_total != null && <strong>{formatPeso(t.seated_total)}</strong>}
          </span>
        </>
      ) : (
        <span className="tt-name">Table {t.table_number}</span>
      )}
    </button>
  );
}