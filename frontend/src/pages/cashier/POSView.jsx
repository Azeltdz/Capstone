import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import TableStep from "./pos/TableStep";
import GuestsModal from "./pos/GuestsModal";
import MenuStep from "./pos/MenuStep";
import CartPanel from "./pos/CartPanel";
import OrderPlacedModal from "./pos/OrderPlacedModal";
import PaymentModal from "../../components/payment/PaymentModal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { usePlaceOrder } from "../../hooks/useOrders";
import { validateOrderForm } from "../../validation/orderSchemas";
import { calcOrderTotals } from "../../utils/pricing";

const NO_PWD = { enabled: false, name: "", id: "" };

export default function POSView() {
  const [step, setStep] = useState("start"); // "start" (table or no table) -> "menu"
  const [mode, setMode] = useState(null); // "dine-in" | "take-out" | "delivery" (read-only once chosen)
  const [table, setTable] = useState(null);
  const [guests, setGuests] = useState(null);
  const [pendingTable, setPendingTable] = useState(null); // table waiting for its guest count
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState("");
  const [pwd, setPwd] = useState(NO_PWD);
  const [payTiming, setPayTiming] = useState("now");
  const [submitted, setSubmitted] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [payError, setPayError] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(null); // "cancel" | "back" | null
  const [placedOrder, setPlacedOrder] = useState(null);

  const { mutate: submitOrder, isPending: isPlacing } = usePlaceOrder();

  const lines = useMemo(() => Object.values(cart), [cart]);
  const form = useMemo(() => validateOrderForm({ lines, customerName, pwd }), [lines, customerName, pwd]);
  const total = useMemo(
    () => calcOrderTotals(lines.map((l) => ({ price: l.price, qty: l.qty, pwd: pwd.enabled && l.pwd }))).total,
    [lines, pwd.enabled]
  );

  function resetOrder() {
    setStep("start");
    setMode(null);
    setTable(null);
    setGuests(null);
    setPendingTable(null);
    setCart({});
    setCustomerName("");
    setPwd(NO_PWD);
    setPayTiming("now");
    setSubmitted(false);
    setShowPayment(false);
    setPayError("");
    setConfirmDiscard(null);
    setPlacedOrder(null);
  }

  // Step 1 choices
  function pickTable(t) {
    setPendingTable(t);
  }
  function confirmGuests(n) {
    setMode("dine-in");
    setTable(pendingTable);
    setGuests(n);
    setPendingTable(null);
    setStep("menu");
  }
  function pickNoTable(type) {
    setMode(type);
    setTable(null);
    setGuests(null);
    setStep("menu");
  }

  // Cart edits
  function handleQtyChange(item, newQty) {
    const id = item.item_id ?? item.id;
    setCart((prev) => {
      const next = { ...prev };
      if (newQty <= 0) {
        delete next[id];
      } else {
        const old = prev[id];
        next[id] = {
          id,
          name: item.item_name ?? item.name,
          price: item.selling_price !== undefined ? Number(item.selling_price) : item.price,
          image_url: item.image_url ?? null,
          category: item.category ?? null,
          qty: Math.min(99, newQty),
          note: old?.note ?? "",
          pwd: old ? old.pwd : pwd.enabled, // new dishes join the PWD discount while it's on
        };
      }
      return next;
    });
  }
  const handleNote = (id, note) => setCart((prev) => ({ ...prev, [id]: { ...prev[id], note } }));
  const handleTogglePwd = (id) => setCart((prev) => ({ ...prev, [id]: { ...prev[id], pwd: !prev[id].pwd } }));
  function handlePwdChange(patch) {
    setPwd((prev) => ({ ...prev, ...patch }));
    if (patch.enabled === true) {
      setCart((prev) => Object.fromEntries(Object.entries(prev).map(([k, l]) => [k, { ...l, pwd: true }])));
    }
  }

  // Place the order
  function handleSubmit() {
    setSubmitted(true);
    if (!form.ok) return;
    if (payTiming === "later") placeOrder({ payment_status: "unpaid" });
    else {
      setPayError("");
      setShowPayment(true);
    }
  }

  function placeOrder(payment) {
    const v = form.values;
    const pwdDetails = pwd.enabled ? { name: v.pwdName, id_number: v.pwdId } : null;
    const payload = {
      order_type: mode,
      ...payment,
      items: lines.map((l) => ({
        item_id: l.id,
        quantity: l.qty,
        ...(l.note?.trim() ? { note: l.note.trim() } : {}),
        ...(pwd.enabled && l.pwd ? { pwd: true } : {}),
      })),
      ...(v.customerName ? { customer_name: v.customerName } : {}),
      ...(mode === "dine-in" ? { table_id: table.table_id, guest_count: guests } : {}),
      ...(pwdDetails && (pwdDetails.name || pwdDetails.id_number) ? { pwd: pwdDetails } : {}),
    };

    submitOrder(payload, {
      onSuccess: (data) => {
        setShowPayment(false);
        setPlacedOrder(data.order);
      },
      onError: (err) => {
        const unsure = err.status >= 500 || err.status === undefined;
        const message = unsure
          ? "Couldn't confirm the order. Check the Orders page before trying again, in case it was saved."
          : err.message;
        if (showPayment) setPayError(message);
        else toast.error(message);
        // Someone else took the table meanwhile: go back to pick another, keep the cart.
        if (err.status === 409 && mode === "dine-in") {
          setShowPayment(false);
          setTable(null);
          setGuests(null);
          setMode(null);
          setStep("start");
        }
      },
    });
  }

  // Leaving
  const askDiscard = (kind) => (lines.length > 0 ? setConfirmDiscard(kind) : resetOrder());

  return (
    <div className={`pos-layout ${step === "start" ? "pos-layout--single" : ""}`}>
      {step === "start" && <TableStep onSelectTable={pickTable} onSelectNoTable={pickNoTable} />}

      {step === "menu" && (
        <>
          <MenuStep stepNumber={2} cart={cart} onQtyChange={handleQtyChange} onBack={() => askDiscard("back")} />
          <CartPanel
            orderLabel="New Order"
            mode={mode}
            table={table}
            guests={guests}
            cart={cart}
            onQtyChange={handleQtyChange}
            onNoteChange={handleNote}
            onTogglePwd={handleTogglePwd}
            customerName={customerName}
            onCustomerName={setCustomerName}
            pwd={pwd}
            onPwdChange={handlePwdChange}
            payTiming={payTiming}
            onPayTimingChange={setPayTiming}
            errors={form.errors}
            submitted={submitted}
            onSubmit={handleSubmit}
            onCancel={() => askDiscard("cancel")}
            isPlacing={isPlacing}
          />
        </>
      )}

      {pendingTable && <GuestsModal table={pendingTable} onSubmit={confirmGuests} onClose={() => setPendingTable(null)} />}

      {showPayment && (
        <PaymentModal
          total={total}
          busy={isPlacing}
          error={payError}
          confirmLabel="Confirm & place order"
          onConfirm={placeOrder}
          onClose={() => setShowPayment(false)}
        />
      )}

      {confirmDiscard && (
        <ConfirmDialog
          title="Discard this order?"
          message="The items in the cart will be removed and you'll go back to Step 1."
          confirmLabel="Discard order"
          onConfirm={resetOrder}
          onCancel={() => setConfirmDiscard(null)}
        />
      )}

      {placedOrder && <OrderPlacedModal order={placedOrder} onClose={resetOrder} />}
    </div>
  );
}