import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { api } from "../api/client";

const emptyForm = { name: "", contact_name: "", contact_email: "", contact_phone: "", address: "" };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function load() {
    setLoading(true);
    api
      .get("/suppliers")
      .then(setSuppliers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(supplier) {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      contact_name: supplier.contact_name || "",
      contact_email: supplier.contact_email || "",
      contact_phone: supplier.contact_phone || "",
      address: supplier.address || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await api.put(`/suppliers/${editing.id}`, form);
      } else {
        await api.post("/suppliers", form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(supplier) {
    if (!confirm(`Delete supplier "${supplier.name}"?`)) return;
    try {
      await api.delete(`/suppliers/${supplier.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Suppliers</h1>
        <button onClick={openCreate}>+ Add Supplier</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Products</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.contact_name || "—"}</td>
                <td>{s.contact_email || "—"}</td>
                <td>{s.contact_phone || "—"}</td>
                <td>{s.product_count}</td>
                <td className="table-actions">
                  <button className="btn-link" onClick={() => openEdit(s)}>
                    Edit
                  </button>
                  <button className="btn-link btn-danger" onClick={() => handleDelete(s)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  No suppliers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Supplier" : "Add Supplier"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="form">
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </label>
            <label>
              Contact Name
              <input
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
            </label>
            <div className="form-row">
              <label>
                Contact Email
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                />
              </label>
              <label>
                Contact Phone
                <input
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                />
              </label>
            </div>
            <label>
              Address
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>
            <button type="submit">{editing ? "Save Changes" : "Create Supplier"}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
