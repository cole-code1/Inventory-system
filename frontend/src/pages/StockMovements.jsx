import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function StockMovements() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [movementType, setMovementType] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (movementType) params.set("movement_type", movementType);
    params.set("page", page);

    api
      .get(`/stock/movements?${params.toString()}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [movementType, page]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Stock Movements</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <select
          value={movementType}
          onChange={(e) => {
            setPage(1);
            setMovementType(e.target.value);
          }}
        >
          <option value="">All types</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>
      </div>

      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Before → After</th>
                <th>Reason</th>
                <th>Reference</th>
                <th>User</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.product_name} <span className="text-muted">({m.product_sku})</span>
                  </td>
                  <td>
                    <span className={`badge badge-${m.movement_type.toLowerCase()}`}>
                      {m.movement_type}
                    </span>
                  </td>
                  <td>{m.quantity}</td>
                  <td>
                    {m.quantity_before} → {m.quantity_after}
                  </td>
                  <td>{m.reason || "—"}</td>
                  <td>{m.reference || "—"}</td>
                  <td>{m.user || "—"}</td>
                  <td>{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No stock movements recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </button>
            <span>
              Page {data.page} of {data.pages || 1} ({data.total} movements)
            </span>
            <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
