import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { api } from "../api/client";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  function load() {
    setLoading(true);
    api
      .get("/categories")
      .then(setCategories)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "" });
    setShowForm(true);
  }

  function openEdit(category) {
    setEditing(category);
    setForm({ name: category.name, description: category.description || "" });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
      } else {
        await api.post("/categories", form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(category) {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    try {
      await api.delete(`/categories/${category.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Categories</h1>
        <button onClick={openCreate}>+ Add Category</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Products</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.description || "—"}</td>
                <td>{c.product_count}</td>
                <td className="table-actions">
                  <button className="btn-link" onClick={() => openEdit(c)}>
                    Edit
                  </button>
                  <button className="btn-link btn-danger" onClick={() => handleDelete(c)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-state">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Category" : "Add Category"} onClose={() => setShowForm(false)}>
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
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <button type="submit">{editing ? "Save Changes" : "Create Category"}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
