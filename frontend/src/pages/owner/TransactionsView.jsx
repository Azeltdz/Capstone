// src/pages/owner/TransactionsView.jsx
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import StatCard from "../../components/StatCard";
import { useBranches } from "../../hooks/useBranches";
import { useDebounce } from "../../hooks/useDebounce";
import {
  useTransactions, useTransactionSummary, useTransactionTrend, useExportTransactions,
} from "../../hooks/useTransactions";
import { buildBranchColors } from "../../utils/branchColors";
import { formatPeso, paymentLabel } from "../../utils/format";
import TrendChart from "./transactions/TrendChart";
import TransactionsTable from "./transactions/TransactionsTable";
import TransactionModal from "./transactions/TransactionModal";
import ExportConfirmModal from "./transactions/ExportConfirmModal";

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "365d", label: "Last 12 months" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "dine-in", label: "Dine-in" },
  { value: "take-out", label: "Take-out" },
  { value: "delivery", label: "Delivery" },
];

const PAYMENT_ORDER = ["cash", "gcash"];

function PaymentLines({ payments }) {
  const amounts = new Map(payments.map((p) => [p.method, p.amount]));
  const methods = [
    ...PAYMENT_ORDER,
    ...payments.map((p) => p.method).filter((m) => !PAYMENT_ORDER.includes(m)),
  ];

  return methods.map((method) => (
    <span key={method} style={{ display: "block" }}>
      {paymentLabel(method)} {formatPeso(amounts.get(method) ?? 0)}
    </span>
  ));
}

export default function TransactionsView() {
  const [branchId, setBranchId] = useState("all");
  const [period, setPeriod] = useState("today");
  const [orderType, setOrderType] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState("time");
  const [dir, setDir] = useState("desc");
  const [pageSize, setPageSize] = useState(25);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const search = useDebounce(searchInput.trim(), 300);

  const { data: branches = [] } = useBranches();
  const colors = useMemo(() => buildBranchColors(branches), [branches]);

  // The chart ignores the branch and search filters so branches stay comparable side by side.
  const scope = { period, orderType: orderType === "all" ? undefined : orderType };
  const filters = { ...scope, branchId: branchId === "all" ? undefined : branchId, search: search || undefined };
  const listParams = { ...filters, sort, dir, pageSize };

  const filterKey = JSON.stringify(listParams);
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const requestedPage = pageState.key === filterKey ? pageState.page : 1;

  const list = useTransactions({ ...listParams, page: requestedPage });
  const summary = useTransactionSummary(filters);
  const trend = useTransactionTrend(scope);
  const exportCsv = useExportTransactions();

  const page = list.data?.page ?? requestedPage; // the server clamps pages past the end
  const goToPage = (p) => setPageState({ key: filterKey, page: p });

  const toggleBranch = useCallback(
    (id) => setBranchId((prev) => (prev === String(id) ? "all" : String(id))),
    []
  );

  function handleSort(key) {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc"); // newest / largest first
    }
  }

  const hasActiveFilters = branchId !== "all" || orderType !== "all" || period !== "today" || searchInput !== "";

  function clearFilters() {
    setBranchId("all");
    setOrderType("all");
    setPeriod("today");
    setSearchInput("");
    setSort("time");
    setDir("desc");
  }

  function handleExport() {
    exportCsv.mutate(
      {
        params: { ...filters, sort, dir },
        filename: `transactions-${period}-${format(new Date(), "yyyyMMdd-HHmm")}.csv`,
      },
      {
        onSuccess: () => {
          setShowExport(false);
          toast.success("Export downloaded");
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label;
  const branchLabel =
    branchId === "all" ? "All branches" : branches.find((b) => String(b.branch_id) === branchId)?.branch_name ?? "";
  const s = summary.data;

  return (
    <>
      <div className="view-header">
        <h2 className="view-title">All Transactions</h2>
        <div className="view-filters">
          <select className="select-input" value={branchId} onChange={(e) => setBranchId(e.target.value)} aria-label="Filter by branch">
            <option value="all">All branches</option>
            {branches.map((b) => (
              <option key={b.branch_id} value={String(b.branch_id)}>
                {b.branch_name}{b.is_active ? "" : " (inactive)"}
              </option>
            ))}
          </select>

          <select className="select-input" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Filter by period">
            {PERIOD_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          <select className="select-input" value={orderType} onChange={(e) => setOrderType(e.target.value)} aria-label="Filter by order type">
            {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {summary.isLoading ? (
        <div className="stat-grid stat-grid-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-stat-card" />)}
        </div>
      ) : summary.error && !s ? (
        <p className="error-text">
          Couldn't load totals. {summary.error.message}{" "}
          <button type="button" className="btn-text" onClick={() => summary.refetch()}>Try again</button>
        </p>
      ) : (
        <div className="stat-grid stat-grid-4">
          <StatCard label="Total Sales" value={formatPeso(s.total_sales)} change={`${periodLabel} · ${branchLabel}`} changeType="muted" />
          <StatCard label="Transactions" value={s.count} />
          <StatCard label="Avg Order Value" value={formatPeso(s.avg_order_value)} />
          <StatCard
            label="Payments"
            value={<PaymentLines payments={s.by_payment} />}
            valueClassName="stat-value-sm"
          />
        </div>
      )}

      <TrendChart
        trend={trend.data}
        colors={colors}
        selectedBranchId={branchId === "all" ? null : branchId}
        onSelectBranch={toggleBranch}
        isLoading={trend.isLoading}
        error={trend.error}
        onRetry={() => trend.refetch()}
      />

      <div className="panel table-panel">
        <div className="table-toolbar">
          <div className="search-wrap">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search order #, cashier, or customer…"
              aria-label="Search transactions"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" className="search-clear" onClick={() => setSearchInput("")} aria-label="Clear search">✕</button>
            )}
          </div>

          {hasActiveFilters && (
            <button type="button" className="btn-text" onClick={clearFilters}>Clear filters</button>
          )}

          <button type="button" className="btn-outline" onClick={() => setShowExport(true)} disabled={!list.data?.total}>
            ⬇ Export CSV
          </button>
        </div>

        <TransactionsTable
          rows={list.data?.rows ?? []}
          total={list.data?.total ?? 0}
          page={page}
          pageCount={list.data?.page_count ?? 1}
          pageSize={pageSize}
          isLoading={list.isLoading}
          isFetching={list.isFetching}
          error={list.error}
          onRetry={() => list.refetch()}
          sort={sort}
          dir={dir}
          onSort={handleSort}
          onPage={goToPage}
          onPageSize={setPageSize}
          onView={setSelectedOrderId}
          colors={colors}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />
      </div>

      {selectedOrderId && <TransactionModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />}

      {showExport && (
        <ExportConfirmModal
          count={list.data?.total ?? 0}
          busy={exportCsv.isPending}
          onCancel={() => setShowExport(false)}
          onConfirm={handleExport}
        />
      )}
    </>
  );
}