import { useState } from "react";
import toast from "react-hot-toast";
import TableStep from "./pos/TableStep";
import GuestsModal from "./pos/GuestsModal";
import MenuStep from "./pos/MenuStep";
import CartPanel from "./pos/CartPanel";
import OrderPlacedModal from "./pos/OrderPlacedModal";
import { usePlaceOrder } from "../../hooks/useOrders";

const PENDING_ORDER_LABEL = "New Order";
const EMPTY_PWD = { enabled: false, name: "", idNumber: "" };

export default function POSView() {
  const [step, setStep] = useState("table"); // "table" | "menu"
  const [orderType, setOrderType] = useState("dine-in");
  const [table, setTable] = useState(null); // { table_id, table_number, guest_capacity }
  const [guests, setGuests] = useState(null);
  const [pendingTable, setPendingTable] = useState(null); // table waiting for a guest count
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState({});
  const [pwd, setPwd] = useState(EMPTY_PWD);
  const [payNow, setPayNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState(null); // "cash" | "gcash"
  const [placedOrder, setPlacedOrder] = useState(null);

  const { mutate: submitOrder, isPending: isPlacingOrder } = usePlaceOrder();

  function resetOrder() {
    setStep("table");
    setOrderType("dine-in");
    setTable(null);
    setGuests(null);
    setPendingTable(null);
    setCustomerName("");
    setCart({});
    setPwd(EMPTY_PWD);
    setPayNow(true);
    setPaymentMethod(null);
    setPlacedOrder(null);
  }

  /* ---------- step 1: table / no table ---------- */
  function handleTablePick(tableInfo) {
    setPendingTable(tableInfo);
  }

  function handleGuestsSubmit(count) {
    setTable(pendingTable);
    setGuests(count);
    setOrderType("dine-in");
    setPendingTable(null);
    setStep("menu");
  }

  function handleSkipTable() {
    setOrderType("take-out");
    setTable(null);
    setGuests(null);
    setStep("menu");
  }

  /* ---------- order type (cart panel) ---------- */
  function handleOrderTypeChange(type) {
    setOrderType(type);
    if (type === "dine-in") {
      if (!table) setStep("table");
    } else {
      setTable(null);
      setGuests(null);
      setStep("menu");
    }
  }

  /* ---------- cart ---------- */
  function handleQtyChange(item, newQty) {
    const id = item.item_id ?? item.id;
    setCart((prev) => {
      const next = { ...prev };
      if (newQty <= 0) {
        delete next[id];
        return next;
      }
      const existing = prev[id];
      next[id] = {
        ...existing, // keeps the line's note and PWD flag when quantity changes
        id,
        name: item.item_name ?? item.name,
        price: item.selling_price !== undefined ? Number(item.selling_price) : item.price,
        image_url: item.image_url ?? null,
        category: item.category ?? null,
        qty: newQty,
        note: existing?.note ?? "",
      };
      return next;
    });
  }

  function handleNoteChange(id, note) {
    setCart((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], note } } : prev));
  }

  function handleTogglePwdLine(id) {
    setCart((prev) =>
      prev[id] ? { ...prev, [id]: { ...prev[id], pwd: prev[id].pwd === false } } : prev
    );
  }

  function handlePwdChange(patch) {
    setPwd((prev) => ({ ...prev, ...patch }));
  }

  /* ---------- validation ---------- */
  const lines = Object.values(cart);
  const nameRequired = orderType === "dine-in" || !payNow;

  const blockers = [];
  if (orderType === "dine-in" && !table) blockers.push("Select a table");
  if (lines.length === 0) blockers.push("Add at least one item");
  if (nameRequired && !customerName.trim()) blockers.push("Enter the customer's name");
  if (pwd.enabled && lines.length > 0 && lines.every((l) => l.pwd === false)) {
    blockers.push("Tick at least one PWD item");
  }
  if (pwd.enabled && (!pwd.name.trim() || !pwd.idNumber.trim())) {
    blockers.push("Enter the PWD's name and ID number");
  }
  if (payNow && !paymentMethod) blockers.push("Choose Cash or GCash");

  /* ---------- submit ---------- */
  function handlePlaceOrder() {
    if (blockers.length > 0) return;

    const items = lines.map((line) => ({
      item_id: line.id,
      quantity: line.qty,
      ...(line.note?.trim() ? { note: line.note.trim() } : {}),
      ...(pwd.enabled ? { pwd: line.pwd !== false } : {}),
    }));

    const payload = {
      order_type: orderType,
      payment_status: payNow ? "paid" : "unpaid",
      ...(payNow ? { payment_method: paymentMethod } : {}),
      customer_name: customerName.trim() || undefined,
      items,
      ...(orderType === "dine-in" ? { table_id: table.table_id, guest_count: Number(guests) } : {}),
      ...(pwd.enabled ? { pwd: { name: pwd.name.trim(), id_number: pwd.idNumber.trim() } } : {}),
    };

    submitOrder(payload, {
      onSuccess: (data) => {
        setPlacedOrder(data.order);
      },
      onError: (err) => {
        toast.error(
          err.status >= 500 || err.status === undefined
            ? "Couldn't confirm the order. Check the Orders page before trying again, in case it was saved."
            : err.message
        );
      },
    });
  }

  function handleCancelOrder() {
    if (lines.length > 0 && !window.confirm("Discard this order and start over?")) return;
    resetOrder();
  }

  return (
    <div className="pos-layout">
      {step === "table" && (
        <TableStep
          selectedId={table?.table_id}
          onSelect={handleTablePick}
          onSkip={handleSkipTable}
          onBack={lines.length > 0 ? () => setStep("menu") : undefined}
        />
      )}
      {step === "menu" && (
        <MenuStep stepNumber={2} cart={cart} onQtyChange={handleQtyChange} onBack={() => setStep("table")} />
      )}

      <CartPanel
        orderLabel={PENDING_ORDER_LABEL}
        orderType={orderType}
        onOrderTypeChange={handleOrderTypeChange}
        table={table}
        guests={guests}
        onChangeTable={() => setStep("table")}
        customerName={customerName}
        nameRequired={nameRequired}
        onCustomerNameChange={setCustomerName}
        cart={cart}
        onQtyChange={handleQtyChange}
        onNoteChange={handleNoteChange}
        onTogglePwdLine={handleTogglePwdLine}
        pwd={pwd}
        onPwdChange={handlePwdChange}
        payNow={payNow}
        onPayNowChange={setPayNow}
        paymentMethod={paymentMethod}
        onSelectPayment={setPaymentMethod}
        blockers={blockers}
        onPlaceOrder={handlePlaceOrder}
        onCancel={handleCancelOrder}
        isPlacing={isPlacingOrder}
      />

      {pendingTable && (
        <GuestsModal
          table={pendingTable}
          initial={guests ?? 1}
          onSubmit={handleGuestsSubmit}
          onClose={() => setPendingTable(null)}
        />
      )}

      {placedOrder && <OrderPlacedModal order={placedOrder} onClose={resetOrder} />}
    </div>
  );
}