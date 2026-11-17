import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!summary) return <div className="page-loading">Loading dashboard…</div>;

  return (
    <div className="page">
      <h1>Dashboard</h1>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total Products</span>
          <span className="stat-value">{summary.total_products}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Units in Stock</span>
          <span className="stat-value">{summary.total_units_in_stock}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Stock Value</span>
          <span className="stat-value">${summary.total_stock_value.toFixed(2)}</span>
        </div>
        <div className={`stat-card ${summary.low_stock_count > 0 ? "stat-warning" : ""}`}>
          <span className="stat-label">Low Stock Alerts</span>
          <span className="stat-value">{summary.low_stock_count}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Categories</span>
          <span className="stat-value">{summary.total_categories}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Suppliers</span>
          <span className="stat-value">{summary.total_suppliers}</span>
        </div>
      </div>

      <div className="dashboard-columns">
        <section className="panel">
          <h2>Low Stock Products</h2>
          {summary.low_stock_products.length === 0 ? (
            <p className="empty-state">Nothing is low on stock right now.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Qty</th>
                  <th>Reorder Level</th>
                </tr>
              </thead>
              <tbody>
                {summary.low_stock_products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td className="text-danger">{p.quantity}</td>
                    <td>{p.reorder_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h2>Recent Stock Movements</h2>
          {summary.recent_movements.length === 0 ? (
            <p className="empty-state">No stock movements recorded yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent_movements.map((m) => (
                  <tr key={m.id}>
                    <td>{m.product_name}</td>
                    <td>
                      <span className={`badge badge-${m.movement_type.toLowerCase()}`}>
                        {m.movement_type}
                      </span>
                    </td>
                    <td>{m.quantity}</td>
                    <td>{new Date(m.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
