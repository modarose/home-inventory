import { useState } from "react";
import "./App.css";

const STORAGE_KEY = "homeInventory_v1";

function loadItems() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function App() {
  const [items, setItems] = useState(() => loadItems());
  const [form, setForm] = useState({
    name: "",
    location: "",
    category: "",
    value: "",
    usage: ["insurance"],
    photoUrl: "",
    notes: "",
  });
  const [filters, setFilters] = useState({ query: "", usage: "all" });

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function toggleUsage(tag) {
    setForm(f => {
      const exists = f.usage.includes(tag);
      return {
        ...f,
        usage: exists ? f.usage.filter(t => t !== tag) : [...f.usage, tag],
      };
    });
  }

  function handleAddItem(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const next = [
      ...items,
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        name: form.name.trim(),
        location: form.location.trim(),
        category: form.category.trim(),
        value: form.value ? Number(form.value) : null,
        usage: form.usage,
        photoUrl: form.photoUrl.trim(),
        notes: form.notes.trim(),
      },
    ];

    setItems(next);
    saveItems(next);

    setForm({
      name: "",
      location: "",
      category: "",
      value: "",
      usage: ["insurance"],
      photoUrl: "",
      notes: "",
    });
  }

  function handleDelete(id) {
    const next = items.filter(item => item.id !== id);
    setItems(next);
    saveItems(next);
  }

  const visibleItems = items.filter(item => {
    const q = filters.query.toLowerCase();
    const matchesQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.location || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q);

    const matchesUsage =
      filters.usage === "all" ||
      (item.usage || []).includes(filters.usage);

    return matchesQuery && matchesUsage;
  });

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Home Inventory</h1>
        <p className="app-subtitle">
          Calm overview of everything in your home for insurance, Airbnb, or peace of mind.
        </p>
      </header>

      <main className="app-main">
        <div className="grid">
          <section className="panel panel-form">
            <h2>Add item</h2>
            <form className="form" onSubmit={handleAddItem}>
              <label className="field">
                <span>Name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Söderhamn sofa"
                  required
                />
              </label>

              <label className="field">
                <span>Room / location</span>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleFormChange}
                  placeholder="Living room"
                />
              </label>

              <label className="field">
                <span>Category</span>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  placeholder="Furniture, electronics…"
                />
              </label>

              <label className="field">
                <span>Approx. value</span>
                <input
                  name="value"
                  type="number"
                  min="0"
                  value={form.value}
                  onChange={handleFormChange}
                  placeholder="e.g. 4500"
                />
              </label>

              <label className="field">
                <span>Photo URL</span>
                <input
                  name="photoUrl"
                  value={form.photoUrl}
                  onChange={handleFormChange}
                  placeholder="https://…"
                />
              </label>

              <label className="field">
                <span>Usage</span>
                <div className="tag-row">
                  {["insurance", "airbnb", "general"].map(tag => (
                    <button
                      type="button"
                      key={tag}
                      className={
                        form.usage.includes(tag) ? "tag tag-active" : "tag"
                      }
                      onClick={() => toggleUsage(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </label>

              <label className="field">
                <span>Notes</span>
                <textarea
                  name="notes"
                  rows={3}
                  value={form.notes}
                  onChange={handleFormChange}
                  placeholder="Serials, purchase date, retailer…"
                />
              </label>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Add item
                </button>
              </div>
            </form>
          </section>

          <section className="panel panel-list">
            <div className="panel-header">
              <h2>Inventory</h2>
              <span>{visibleItems.length} items</span>
            </div>

            <div className="filters">
              <input
                className="filters-search"
                placeholder="Search name, room, category…"
                value={filters.query}
                onChange={e =>
                  setFilters(f => ({ ...f, query: e.target.value }))
                }
              />
              <select
                className="filters-select"
                value={filters.usage}
                onChange={e =>
                  setFilters(f => ({ ...f, usage: e.target.value }))
                }
              >
                <option value="all">All uses</option>
                <option value="insurance">Insurance</option>
                <option value="airbnb">Airbnb</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Value</th>
                    <th>Use</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="cell-main">
                          {item.photoUrl && (
                            <img
                              src={item.photoUrl}
                              alt={item.name}
                              className="thumb"
                            />
                          )}
                          <div>
                            <div className="cell-title">{item.name}</div>
                            {item.notes && (
                              <div className="cell-sub">{item.notes}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{item.location}</td>
                      <td>{item.category}</td>
                      <td>
                        {item.value != null
                          ? item.value.toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        <div className="tag-row">
                          {(item.usage || []).map(u => (
                            <span key={u} className="tag tag-pill">
                              {u}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button
                          className="icon-btn"
                          onClick={() => handleDelete(item.id)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}

                  {visibleItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="empty-row">
                        No items yet. Add your first sofa, TV, or appliance on the left.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
