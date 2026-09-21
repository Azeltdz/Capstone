// src/pages/cashier/CashierLayout.jsx
import { Outlet } from "react-router-dom";
import Topbar from "../../components/Topbar";
import Sidebar from "../../components/Sidebar";

const NAV_SECTIONS = [
  {
    label: "Menu",
    items: [
      { to: "/cashier/pos", icon: "🧾", label: "POS" },
      { to: "/cashier/orders", icon: "📋", label: "Orders" },
    ],
  },
];

export default function CashierLayout() {
  return (
    <>
      <Topbar branchLabel="Poblacion Branch" showClock />
      <div className="layout">
        <Sidebar sections={NAV_SECTIONS} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
