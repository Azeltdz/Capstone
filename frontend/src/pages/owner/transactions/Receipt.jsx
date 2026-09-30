import { format } from "date-fns";
import { formatOrderNumber, formatPeso, ORDER_TYPE_LABELS, paymentLabel } from "../../../utils/format";

const row = { display: "flex", justifyContent: "space-between", gap: 8 };

export default function Receipt({ order, settings, ref }) {
  return (
    <div ref={ref} style={{ width: 280, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#000", background: "#fff" }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <strong style={{ fontSize: 14 }}>{settings.business_name}</strong>
        <div>{order.branch_name}</div>
      </div>
      <div>{formatOrderNumber(order.transaction_id)}</div>
      <div>{format(new Date(order.transaction_at), "MMM d, yyyy h:mm a")}</div>
      <div>Cashier: {order.cashier_name}</div>
      <div>
        {ORDER_TYPE_LABELS[order.order_type] ?? order.order_type}
        {order.table_number ? ` · Table ${order.table_number}` : ""}
      </div>
      {order.customer_name && (
        <div>Customer: {order.customer_name}{order.guest_count ? ` (${order.guest_count} guests)` : ""}</div>
      )}
      <hr />
      {order.items.map((it) => (
        <div key={it.tx_item_id} style={row}>
          <span>{it.quantity}× {it.item_name}</span>
          <span>{formatPeso(it.subtotal)}</span>
        </div>
      ))}
      <hr />
      <div style={{ ...row, fontWeight: "bold" }}><span>TOTAL</span><span>{formatPeso(order.total_amount)}</span></div>
      <div style={row}><span>Payment</span><span>{paymentLabel(order.payment_method)}</span></div>
      {settings.footer_message && <p style={{ textAlign: "center", marginTop: 12 }}>{settings.footer_message}</p>}
    </div>
  );
}