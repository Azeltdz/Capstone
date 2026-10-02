import { Outlet } from "react-router-dom";
import Topbar from "../../components/Topbar";
import Sidebar from "../../components/Sidebar";
import OfflineBanner from "../../components/OfflineBanner";
import { useMyBranch } from "../../hooks/useMyBranch";
import { useSessionSync } from "../../hooks/useSessionSync";

const NAV_SECTIONS = [
  {
    label: "Menu",
    items: [
      { to: "/cashier/pos", icon: "🧾", label: "POS" },
      { to: "/cashier/tables", icon: "🪑", label: "Tables" },
      { to: "/cashier/orders", icon: "📋", label: "Orders" },
    ],
  },
];

export default function CashierLayout() {
  useSessionSync();
  const { branch, isLoading, error } = useMyBranch();

  const branchLabel = isLoading
    ? "Loading…"
    : error
    ? "Branch unavailable"
    : branch
    ? `${branch.branch_name}${branch.is_active ? "" : " (inactive)"}`
    : "No branch assigned";

  return (
    <>
      <Topbar branchLabel={branchLabel} showClock />
      <OfflineBanner />
      <div className="layout">
        <Sidebar sections={NAV_SECTIONS} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </>
  );
}