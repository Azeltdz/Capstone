import { format } from "date-fns";
import { formatOrderNumber, formatPeso, ORDER_TYPE_LABELS, paymentLabel } from "../../utils/format";

const row = { display: "flex", justifyContent: "space-between", gap: 8 };
const rule = { border: 0, borderTop: "1px dashed #000", margin: "6px 0" };

export default function Receipt({ receipt, copy = false, ref }) {
  if (!receipt) return <div ref={ref} />;

  const r = receipt;
  const itemCount = r.items.reduce((sum, i) => sum + i.quantity, 0);
  const type = ORDER_TYPE_LABELS[r.order_type] ?? r.order_type;

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
          <div style={row}>
            <span>{it.quantity} x {formatPeso(it.unit_price)}</span>
            <span>{formatPeso(it.subtotal)}</span>
          </div>
        </div>
      ))}

      <hr style={rule} />
      <div style={{ ...row, fontWeight: "bold", fontSize: 14 }}>
        <span>TOTAL</span><span>{formatPeso(r.total_amount)}</span>
      </div>
      <div style={row}><span>Items</span><span>{itemCount}</span></div>
      <div style={row}><span>Payment</span><span>{paymentLabel(r.payment_method)}</span></div>

      {r.footer_message && <p style={{ textAlign: "center", marginTop: 10 }}>{r.footer_message}</p>}
    </div>
  );
}