import { useState } from "react";
import toast from "react-hot-toast";
import { useSettleOrder } from "../../hooks/useOrderActions";
import { formatPeso } from "../../utils/format";
import { buildPaymentBody, isPaymentReady } from "../../validation/orderSchemas";
import { calcChange } from "../../utils/pricing";
import PaymentPanel from "./PaymentPanel";

export default function SettlePayment({ order }) {
  const settle = useSettleOrder();
  const [method, setMethod] = useState("cash");
  const [cashInput, setCashInput] = useState("");
  const [error, setError] = useState("");
  const total = Number(order.total_amount);
  const ready = isPaymentReady(method, cashInput, total) && !settle.isPending;

  async function confirm() {
    if (!ready) return;
    setError("");
    try {
      const body = buildPaymentBody(method, cashInput, total);
      await settle.mutateAsync({ orderId: order.transaction_id, ...body });
      toast.success(
        body.amount_tendered !== undefined
          ? `Payment received · Change ${formatPeso(calcChange(body.amount_tendered, total))}`
          : "Payment received"
      );
    } catch (err) {
      setError(err.message || "Couldn't record the payment. Please try again.");
    }
  }

  return (
    <form className="pay-panel" onSubmit={(e) => { e.preventDefault(); confirm(); }} noValidate>
      <div className="pay-total">
        <span>Amount due</span>
        <strong>{formatPeso(total)}</strong>
      </div>
      <PaymentPanel total={total} method={method} onMethodChange={setMethod} cashInput={cashInput} onCashChange={setCashInput} disabled={settle.isPending} />
      {error && <p className="error-text" role="alert">{error}</p>}
      <button type="submit" className="btn btn-navy" disabled={!ready}>
        {settle.isPending ? "Saving…" : "Confirm payment"}
      </button>
    </form>
  );
}