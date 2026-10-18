import { format } from "date-fns";
import { formatOrderNumber, formatPeso, ORDER_TYPE_LABELS, paymentLabel } from "../../utils/format";

const row = { display: "flex", justifyContent: "space-between", gap: 8 };
const rule = { border: 0, borderTop: "1px dashed #000", margin: "6px 0" };
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export default function Receipt({ receipt, copy = false, ref }) {
  if (!receipt) return <div ref={ref} />;

  const r = receipt;
  const itemCount = r.items.reduce((sum, i) => sum + i.quantity, 0);
  const type = ORDER_TYPE_LABELS[r.order_type] ?? r.order_type;

  const isPaid = (r.payment_status ?? "paid") === "paid";
  const total = Number(r.total_amount);
  const subtotal = Number(r.subtotal_amount ?? r.total_amount);
  const discount = Number(r.pwd_discount ?? 0);
  const vatExemption = Math.max(0, round2(subtotal - total - discount));
  const hasPwd = discount > 0;
  const hasVat = r.vat_amount != null; // old orders (before VAT) have no VAT breakdown

  return (
    <div
      ref={ref}
      style={{
        width: "72mm", padding: "2mm", fontFamily: "'Courier New', monospace",
        fontSize: 12, lineHeight: 1.35, color: "#000", background: "#fff",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <strong style={{ fontSize: 15 }}>{r.business_name}</strong>
        <div>{r.branch}</div>
        {copy && <div style={{ marginTop: 4, fontWeight: "bold" }}>*** REPRINT ***</div>}
        {!isPaid && <div style={{ marginTop: 4, fontWeight: "bold" }}>*** UNPAID ***</div>}
      </div>

      <hr style={rule} />
      <div style={row}><span>Order</span><span>{formatOrderNumber(r.order_number)}</span></div>
      <div style={row}><span>Date</span><span>{format(new Date(r.transaction_at), "MMM d, yyyy h:mm a")}</span></div>
      <div style={row}><span>Cashier</span><span>{r.cashier}</span></div>
      <div style={row}><span>Type</span><span>{type}{r.table_number ? ` · Table ${r.table_number}` : ""}</span></div>
      {r.customer_name && <div style={row}><span>Customer</span><span>{r.customer_name}</span></div>}
      {r.guest_count && <div style={row}><span>Guests</span><span>{r.guest_count}</span></div>}

      <hr style={rule} />
      {r.items.map((it) => (
        <div key={it.item_id} style={{ marginBottom: 3 }}>
          <div>{it.item_name}</div>
          {it.note && <div style={{ fontStyle: "italic", fontSize: 11 }}>  Note: {it.note}</div>}
          <div style={row}>
            <span>{it.quantity} x {formatPeso(it.unit_price)}</span>
            <span>{formatPeso(it.subtotal)}</span>
          </div>
        </div>
      ))}

      <hr style={rule} />
      {hasPwd && (
        <>
          <div style={row}><span>Subtotal (VAT incl.)</span><span>{formatPeso(subtotal)}</span></div>
          <div style={row}><span>Less VAT exemption</span><span>-{formatPeso(vatExemption)}</span></div>
          <div style={row}><span>Less PWD discount (20%)</span><span>-{formatPeso(discount)}</span></div>
        </>
      )}
      <div style={{ ...row, fontWeight: "bold", fontSize: 14 }}>
        <span>{isPaid ? "TOTAL" : "AMOUNT DUE"}</span><span>{formatPeso(total)}</span>
      </div>
      <div style={row}><span>Items</span><span>{itemCount}</span></div>

      {hasVat && (
        <>
          <hr style={rule} />
          <div style={row}><span>VATable Sales</span><span>{formatPeso(r.vatable_sales)}</span></div>
          <div style={row}><span>VAT (12%)</span><span>{formatPeso(r.vat_amount)}</span></div>
          <div style={row}><span>VAT-Exempt Sales</span><span>{formatPeso(r.vat_exempt_sales ?? 0)}</span></div>
        </>
      )}

      <hr style={rule} />
      <div style={row}><span>Payment</span><span>{isPaid ? paymentLabel(r.payment_method) : "UNPAID"}</span></div>
      {hasPwd && (
        <>
          <div style={row}><span>PWD</span><span>{r.pwd_name}</span></div>
          <div style={row}><span>PWD ID No.</span><span>{r.pwd_id_number}</span></div>
        </>
      )}

      {r.footer_message && <p style={{ textAlign: "center", marginTop: 10 }}>{r.footer_message}</p>}
    </div>
  );
}