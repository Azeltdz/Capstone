// src/pages/owner/InventoryView.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { getInventory } from "../../api/mockOwner";

export default function InventoryView() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [items, setItems] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");

  const debounceTimer = useRef(null);
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(debounceTimer.current);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const data = await getInventory({ search, status });
      setItems(data);
      setLoadState("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setLoadState("error");
    }
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

  function stockPercent(item) {
    const pct = (item.onHand / (item.reorder * 2)) * 100;
    return Math.max(6, Math.min(100, pct));
  }

  return (
    <>
      <div className="alert-banner">⚠ Low Stock Alert: Egg Noodles are below reorder level</div>

      <div className="view-header">
        <h2 className="view-title">Inventory — All Branches</h2>
        <div className="view-filters">
          <select className="select-input" defaultValue="All Branches">
            <option>All Branches</option>
            <option>Poblacion</option>
            <option>San Roque</option>
          </select>
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search ingredient..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select className="select-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="Good">Good</option>
            <option value="Low">Low</option>
          </select>
          <button className="btn btn-navy">+ Add Item</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Unit</th>
              <th>On Hand</th>
              <th>Reorder Lvl</th>
              <th>Stock Bar</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadState === "loading" && (
              <tr>
                <td colSpan={8} className="table-status">Loading inventory…</td>
              </tr>
            )}
            {loadState === "error" && (
              <tr>
                <td colSpan={8} className="table-status table-status-error">Couldn't load inventory. {errorMsg}</td>
              </tr>
            )}
            {loadState === "ready" && items.length === 0 && (
              <tr>
                <td colSpan={8} className="table-status">No ingredients match your filters.</td>
              </tr>
            )}
            {loadState === "ready" &&
              items.map((item) => (
                <tr key={item.name}>
                  <td className={item.status === "Low" ? "orange-text" : ""}>{item.name}</td>
                  <td>{item.unit}</td>
                  <td className={item.status === "Low" ? "orange-text" : "cell-strong"}>{item.onHand}</td>
                  <td>{item.reorder}</td>
                  <td>
                    <div className="mini-bar-track">
                      <div className={`mini-bar ${item.status === "Low" ? "orange" : "green"}`} style={{ width: `${stockPercent(item)}%` }} />
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${item.status === "Low" ? "badge-warn" : "badge-good"}`}>
                      {item.status === "Low" ? "⚠ Low" : "Good"}
                    </span>
                  </td>
                  <td>{item.updated}</td>
                  <td>
                    <button className="btn btn-orange btn-sm">Edit</button> <button className="btn btn-red btn-sm">Del</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span className="footer-note">6 ingredients shown · Auto-deducted via BOM on each transaction</span>
        <button className="btn btn-green">🚚 Log Delivery / Restock</button>
      </div>
    </>
  );
}
