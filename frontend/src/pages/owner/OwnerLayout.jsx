import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import Topbar from "../../components/Topbar";
import Sidebar from "../../components/Sidebar";
import OfflineBanner from "../../components/OfflineBanner";
import { useLowStock } from "../../hooks/useInventory";
import { useSessionSync } from "../../hooks/useSessionSync";

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { to: "/owner", icon: "📊", label: "Dashboard", end: true },
      { to: "/owner/transactions", icon: "📋", label: "Transactions" },
      { to: "/owner/inventory", icon: "📦", label: "Inventory", badgeLabel: "low-stock alerts" },
      { to: "/owner/menu", icon: "🍜", label: "Menu" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/owner/food-costing", icon: "🍽️", label: "Food Costing" },
      { to: "/owner/analytics", icon: "📈", label: "Analytics" },
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
  useSessionSync();
  const { data: lowStock = [] } = useLowStock("all", { refetchInterval: 60 * 1000 });
  const lowStockCount = lowStock.length;

  const sections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.to === "/owner/inventory" ? { ...item, badge: lowStockCount } : item
        ),
      })),
    [lowStockCount]
  );

  return (
    <>
      <Topbar branchLabel="All Branches" showDate />
      <OfflineBanner />
      <div className="layout">
        <Sidebar sections={sections} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </>
  );
}