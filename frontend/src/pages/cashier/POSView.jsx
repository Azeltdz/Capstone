// src/pages/cashier/POSView.jsx
import { useState } from "react";
import OrderTypeStep from "./pos/OrderTypeStep";
import DineInDetailsModal from "./pos/DineInDetailsModal";
import TableStep from "./pos/TableStep";
import MenuStep from "./pos/MenuStep";
import CartPanel from "./pos/CartPanel";

export default function POSView() {
  const [step, setStep] = useState("type"); // "type" | "table" | "menu"
  const [orderType, setOrderType] = useState(null);
  const [customer, setCustomer] = useState(null); // { name, phone, guests } — Dine-in only
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [table, setTable] = useState(null);
  const [cart, setCart] = useState({}); // { [itemId]: { id, name, price, qty } }
  const [paymentMethod, setPaymentMethod] = useState(null); // "Cash" | "GCash" | null

  function resetOrder() {
    setStep("type");
    setOrderType(null);
    setCustomer(null);
    setShowDetailsModal(false);
    setTable(null);
    setCart({});
    setPaymentMethod(null);
  }

  function handleOrderTypeSelect(type) {
    if (type === "Dine-in") {
      // Dine-in collects customer details in a popup first. The order type is only
      // committed once the popup is submitted, so closing it leaves nothing half-selected.
      setShowDetailsModal(true);
    } else {
      // Take-out/Delivery skip straight to the menu.
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

  function handleTableSelect(tableNumber) {
    setTable(tableNumber);
    setStep("menu");
  }

  function handleQtyChange(item, newQty) {
    const next = { ...cart };
    if (newQty <= 0) {
      delete next[item.id];
    } else {
      next[item.id] = { id: item.id, name: item.name, price: item.price, qty: newQty };
    }
    setCart(next);

    // Nothing left in the cart → nothing to pay for, so clear the payment method.
    if (Object.keys(next).length === 0) {
      setPaymentMethod(null);
    }
  }

  function handlePlaceOrder() {
    // Real version later: POST /api/transactions with { orderType, customer, table, cart, paymentMethod }
    alert("Order placed! (this will save to the real backend once that endpoint exists)");
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

  // Dine-in: type → table → menu (step 3). Others: type → menu (step 2).
  const menuStepNumber = orderType === "Dine-in" ? 3 : 2;

  return (
    <div className="pos-layout">
      {step === "type" && <OrderTypeStep onSelect={handleOrderTypeSelect} />}
      {step === "table" && <TableStep onSelect={handleTableSelect} onBack={resetOrder} />}
      {step === "menu" && (
        <MenuStep stepNumber={menuStepNumber} cart={cart} onQtyChange={handleQtyChange} onBack={backFromMenu} />
      )}

      <CartPanel
        step={step}
        orderType={orderType}
        customer={customer}
        table={table}
        cart={cart}
        onQtyChange={handleQtyChange}
        paymentMethod={paymentMethod}
        onSelectPayment={setPaymentMethod}
        onPlaceOrder={handlePlaceOrder}
      />

      {showDetailsModal && (
        <DineInDetailsModal onSubmit={handleDetailsSubmit} onClose={() => setShowDetailsModal(false)} />
      )}
    </div>
  );
}