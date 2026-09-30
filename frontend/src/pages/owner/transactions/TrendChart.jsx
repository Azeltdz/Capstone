import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { format, parseISO } from "date-fns";
import { formatPeso, formatPesoWhole } from "../../../utils/format";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const TITLES = { hour: "Hourly", day: "Daily", month: "Monthly" };

function bucketLabel(key, granularity) {
  if (granularity === "hour") return format(new Date(2000, 0, 1, Number(key)), "h a");
  if (granularity === "month") return format(parseISO(`${key}-01`), "MMM yyyy");
  return format(parseISO(key), "MMM d");
}

const sum = (values) => values.reduce((a, b) => a + b, 0);

export default function TrendChart({ trend, colors, selectedBranchId, onSelectBranch, isLoading, error, onRetry }) {
  const chart = useMemo(() => {
    if (!trend || trend.buckets.length === 0) return null;
    return {
      data: {
        labels: trend.buckets.map((key) => bucketLabel(key, trend.granularity)),
        datasets: trend.branches.map((b) => {
          const base = colors.get(b.branch_id) ?? "#1e3a5f";
          const dimmed = selectedBranchId && String(b.branch_id) !== selectedBranchId;
          return {
            label: b.branch_name,
            data: b.values,
            backgroundColor: dimmed ? `${base}33` : base,
            borderRadius: 4,
            maxBarThickness: 32,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        // Only a bar the cursor is actually over counts as a click.
        onClick: (event, _elements, chartInstance) => {
          const hit = chartInstance.getElementsAtEventForMode(event, "nearest", { intersect: true }, true);
          if (hit.length) onSelectBranch(trend.branches[hit[0].datasetIndex].branch_id);
        },
        onHover: (event, elements) => {
          if (event.native?.target) event.native.target.style.cursor = elements.length ? "pointer" : "default";
        },
        plugins: {
          legend: {
            position: "top",
            labels: { usePointStyle: true, boxWidth: 8 },
            onClick: (_event, item) => onSelectBranch(trend.branches[item.datasetIndex].branch_id),
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${formatPeso(ctx.parsed.y ?? 0)}`,
              footer: (items) =>
                items.length > 1 ? `Total: ${formatPeso(sum(items.map((i) => i.parsed.y ?? 0)))}` : "",
            },
          },
        },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, grid: { color: "#eee" }, ticks: { callback: (v) => formatPesoWhole(v) } },
        },
      },
    };
  }, [trend, colors, selectedBranchId, onSelectBranch]);

  return (
    <div className="panel">
      <h3 className="panel-title">📊 Sales per Branch — {TITLES[trend?.granularity] ?? ""} Trend</h3>
      <p className="panel-hint">Click a bar or legend item to filter the page by that branch.</p>

      {isLoading && <div className="skeleton skeleton-chart" />}

      {error && !trend && (
        <div>
          <p className="error-text">Couldn't load the chart. {error.message}</p>
          <button type="button" className="btn-outline" onClick={onRetry}>Try again</button>
        </div>
      )}

      {trend && !chart && <p className="loading-text">No sales in this period.</p>}

      {chart && (
        <div className="trend-chart-rc" style={{ width: "100%", height: 280 }}>
          <Bar
            data={chart.data}
            options={chart.options}
            role="img"
            aria-label={`Stacked bar chart of sales per branch. ${trend.branches
              .map((b) => `${b.branch_name}: ${formatPeso(sum(b.values))}`)
              .join(". ")}`}
          />
        </div>
      )}
    </div>
  );
}