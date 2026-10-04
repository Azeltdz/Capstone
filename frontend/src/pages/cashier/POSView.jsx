import { useState } from "react";
import toast from "react-hot-toast";
import OrderTypeStep from "./pos/OrderTypeStep";
import DineInDetailsModal from "./pos/DineInDetailsModal";
import TableStep from "./pos/TableStep";
import MenuStep from "./pos/MenuStep";
import CartPanel from "./pos/CartPanel";
import OrderPlacedModal from "./pos/OrderPlacedModal";
import { usePlaceOrder } from "../../hooks/useOrders";

const PENDING_ORDER_LABEL = "New Order";
const ORDER_TYPE_MAP = { "Dine-in": "dine-in", "Take-out": "take-out", "Delivery": "delivery" };

export default function POSView() {
  const [step, setStep] = useState("type");
  const [orderType, setOrderType] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [table, setTable] = useState(null); // { table_id, table_number }
  const [cart, setCart] = useState({});
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [placedOrder, setPlacedOrder] = useState(null);

  const { mutate: submitOrder, isPending: isPlacingOrder } = usePlaceOrder();

  function resetOrder() {
    setStep("type");
    setOrderType(null);
    setCustomer(null);
    setShowDetailsModal(false);
    setTable(null);
    setCart({});
    setPaymentMethod(null);
    setPlacedOrder(null);
  }

  function handleOrderTypeSelect(type) {
    if (type === "Dine-in") {
      setShowDetailsModal(true);
    } else {
      setOrderType(type);
      setStep("menu");
    }
  }

  function handleDetailsSubmit(details) {
    setCustomer(details);
    setOrderType("Dine-in");
    setShowDetailsModal(false);
    setStep("table");
  }

  function handleTableSelect(tableInfo) {
    setTable(tableInfo);
    setStep("menu");
  }

  function handleQtyChange(item, newQty) {
    const id = item.item_id ?? item.id;
    const next = { ...cart };
    if (newQty <= 0) {
      delete next[id];
    } else {
      next[id] = {
        id,
        name: item.item_name ?? item.name,
        price: item.selling_price !== undefined ? Number(item.selling_price) : item.price,
        image_url: item.image_url ?? null,
        category: item.category ?? null,
        qty: newQty,
      };
    }
    setCart(next);

    if (Object.keys(next).length === 0) {
      setPaymentMethod(null);
    }
  }

  function handlePlaceOrder() {
    const items = Object.values(cart).map((line) => ({
      item_id: line.id,
      quantity: line.qty,
    }));

    const payload = {
      order_type: ORDER_TYPE_MAP[orderType],
      payment_method: paymentMethod.toLowerCase(),
      items,
      ...(orderType === "Dine-in"
        ? {
            table_id: table.table_id,
            customer_name: customer?.name?.trim() || undefined,
            guest_count: customer?.guests ? Number(customer.guests) : undefined,
          }
        : {}),
    }

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
    if (Object.keys(cart).length > 0 && !window.confirm("Discard this order and start over?")) return;
    resetOrder();
  }

  function backFromMenu() {
    if (orderType === "Dine-in") {
      setStep("table");
      setTable(null);
      setCart({});
      setPaymentMethod(null);
    } else {
      resetOrder();
    }
  }

  const menuStepNumber = orderType === "Dine-in" ? 3 : 2;

  return (
    <div className="pos-layout">
      {step === "type" && <OrderTypeStep onSelect={handleOrderTypeSelect} />}
      {step === "table" && <TableStep onSelect={handleTableSelect} onBack={resetOrder} guests={customer?.guests} />}
      {step === "menu" && (
        <MenuStep stepNumber={menuStepNumber} cart={cart} onQtyChange={handleQtyChange} onBack={backFromMenu} />
      )}

      <CartPanel
        orderId={PENDING_ORDER_LABEL}
        step={step}
        orderType={orderType}
        customer={customer}
        table={table}
        cart={cart}
        onQtyChange={handleQtyChange}
        paymentMethod={paymentMethod}
        onSelectPayment={setPaymentMethod}
        onPlaceOrder={handlePlaceOrder}
        onCancel={handleCancelOrder}
        isPlacing={isPlacingOrder}
      />

      {placedOrder && <OrderPlacedModal order={placedOrder} onClose={resetOrder} />}

      {showDetailsModal && (
        <DineInDetailsModal onSubmit={handleDetailsSubmit} onClose={() => setShowDetailsModal(false)} />
      )}
    </div>
  );
}