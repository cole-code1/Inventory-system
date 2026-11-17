import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { api } from "../api/client";

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  category_id: "",
  supplier_id: "",
  quantity: 0,
  unit_price: 0,
  reorder_level: 10,
};

export default function Products() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null); // product object or null
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [movementProduct, setMovementProduct] = useState(null);
  const [movementForm, setMovementForm] = useState({
    movement_type: "IN",
    quantity: 1,
    reason: "",
    reference: "",
  });

  function loadProducts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category_id", categoryFilter);
    if (lowStockOnly) params.set("low_stock", "true");
    params.set("page", page);

    api
      .get(`/products?${params.toString()}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    api.get("/categories").then(setCategories).catch(() => {});
    api.get("/suppliers").then(setSuppliers).catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, lowStockOnly, page]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description || "",
      category_id: product.category_id || "",
      supplier_id: product.supplier_id || "",
      quantity: product.quantity,
      unit_price: product.unit_price,
      reorder_level: product.reorder_level,
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      category_id: form.category_id || null,
      supplier_id: form.supplier_id || null,
      quantity: Number(form.quantity),
      unit_price: Number(form.unit_price),
      reorder_level: Number(form.reorder_level),
    };
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      setShowForm(false);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  function openMovement(product) {
    setMovementProduct(product);
    setMovementForm({ movement_type: "IN", quantity: 1, reason: "", reference: "" });
  }

  async function handleMovementSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/stock/movements", {
        product_id: movementProduct.id,
        movement_type: movementForm.movement_type,
        quantity: Number(movementForm.quantity),
        reason: movementForm.reason,
        reference: movementForm.reference,
      });
      setMovementProduct(null);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Products</h1>
        <button onClick={openCreate}>+ Add Product</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <input
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setPage(1);
            setCategoryFilter(e.target.value);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setPage(1);
              setLowStockOnly(e.target.checked);
            }}
          />
          Low stock only
        </label>
      </div>

      {loading ? (
        <div className="page-loading">Loading products…</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className={p.is_low_stock ? "row-warning" : ""}>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.category || "—"}</td>
                  <td>{p.supplier || "—"}</td>
                  <td>
                    {p.quantity}
                    {p.is_low_stock && <span className="badge badge-low">low</span>}
                  </td>
                  <td>${p.unit_price.toFixed(2)}</td>
                  <td>${p.stock_value.toFixed(2)}</td>
                  <td className="table-actions">
                    <button className="btn-link" onClick={() => openMovement(p)}>
                      Adjust Stock
                    </button>
                    <button className="btn-link" onClick={() => openEdit(p)}>
                      Edit
                    </button>
                    <button className="btn-link btn-danger" onClick={() => handleDelete(p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No products found.
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
              Page {data.page} of {data.pages || 1} ({data.total} products)
            </span>
            <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        </>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Product" : "Add Product"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="form">
            <label>
              SKU
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                required
              />
            </label>
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="form-row">
              <label>
                Category
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Supplier
                <select
                  value={form.supplier_id}
                  onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                >
                  <option value="">None</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                Quantity
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  disabled={!!editing}
                  title={editing ? "Use 'Adjust Stock' to change quantity" : ""}
                  required
                />
              </label>
              <label>
                Unit Price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                  required
                />
              </label>
              <label>
                Reorder Level
                <input
                  type="number"
                  min="0"
                  value={form.reorder_level}
                  onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                  required
                />
              </label>
            </div>
            <button type="submit">{editing ? "Save Changes" : "Create Product"}</button>
          </form>
        </Modal>
      )}

      {movementProduct && (
        <Modal title={`Adjust Stock — ${movementProduct.name}`} onClose={() => setMovementProduct(null)}>
          <form onSubmit={handleMovementSubmit} className="form">
            <p className="modal-subtitle">Current quantity: {movementProduct.quantity}</p>
            <label>
              Movement Type
              <select
                value={movementForm.movement_type}
                onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
              >
                <option value="IN">Stock In</option>
                <option value="OUT">Stock Out</option>
                <option value="ADJUSTMENT">Adjustment (set exact quantity)</option>
              </select>
            </label>
            <label>
              {movementForm.movement_type === "ADJUSTMENT" ? "New Quantity" : "Quantity"}
              <input
                type="number"
                min="1"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                required
              />
            </label>
            <label>
              Reason
              <input
                value={movementForm.reason}
                onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                placeholder="e.g. Sold to customer, damaged goods, stock count"
              />
            </label>
            <label>
              Reference
              <input
                value={movementForm.reference}
                onChange={(e) => setMovementForm({ ...movementForm, reference: e.target.value })}
                placeholder="e.g. PO-1001, SO-2002"
              />
            </label>
            <button type="submit">Record Movement</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
