// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";

import CashierLayout from "./pages/cashier/CashierLayout";
import POSView from "./pages/cashier/POSView";
import TablesView from "./pages/cashier/TablesView";
import OrdersView from "./pages/cashier/OrdersView";

import OwnerLayout from "./pages/owner/OwnerLayout";
import DashboardView from "./pages/owner/DashboardView";
import TransactionsView from "./pages/owner/TransactionsView";
import InventoryView from "./pages/owner/InventoryView";
import MenuView from "./pages/owner/MenuView";
import FoodCostingView from "./pages/owner/FoodCostingView";
import AIAnalyticsView from "./pages/owner/AIAnalyticsView";
import StaffView from "./pages/owner/StaffView";
import BranchesView from "./pages/owner/BranchesView";
import SettingsView from "./pages/owner/SettingsView";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route
            path="/cashier"
            element={
              <ProtectedRoute allowedRoles={["cashier"]}>
                <CashierLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="pos" replace />} />
            <Route path="pos" element={<POSView />} />
            <Route path="tables" element={<TablesView />} />
            <Route path="orders" element={<OrdersView />} />
          </Route>

          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <OwnerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardView />} />
            <Route path="transactions" element={<TransactionsView />} />
            <Route path="inventory" element={<InventoryView />} />
            <Route path="menu" element={<MenuView />} />
            <Route path="food-costing" element={<FoodCostingView />} />
            <Route path="analytics" element={<AIAnalyticsView />} />
            <Route path="staff" element={<StaffView />} />
            <Route path="branches" element={<BranchesView />} />
            <Route path="settings" element={<SettingsView />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
