// src/pages/owner/OwnerLayout.jsx
import { Outlet } from "react-router-dom";
import Topbar from "../../components/Topbar";
import Sidebar from "../../components/Sidebar";

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { to: "/owner", icon: "📊", label: "Dashboard", end: true },
      { to: "/owner/transactions", icon: "📋", label: "Transactions" },
      { to: "/owner/inventory", icon: "📦", label: "Inventory" },
      { to: "/owner/menu", icon: "🍜", label: "Menu" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/owner/food-costing", icon: "🍽️", label: "Food Costing" },
      { to: "/owner/analytics", icon: "📈", label: "AI Analytics" },
    ],
  },
  {
    label: "Admin",
    items: [
      { to: "/owner/staff", icon: "👥", label: "Staff" },
      { to: "/owner/branches", icon: "🏪", label: "Branches" },
      { to: "/owner/settings", icon: "⚙️", label: "Settings" },
    ],
  },
];

export default function OwnerLayout() {
  return (
    <>
      <Topbar branchLabel="All Branches" dateLabel="March 6, 2026" />
      <div className="layout">
        <Sidebar sections={NAV_SECTIONS} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
