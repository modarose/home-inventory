import { useState } from "react";
import "./App.css";

const STORAGE_KEY = "homeInventory_v1";
const ROOMS = ["Living room","Bedroom","Kitchen","Bathroom","Garage","Office","Outdoor","Other"];
const CATEGORIES = ["Furniture","Electronics","Appliance","Lighting","Decor","Clothing","Tools","Other"];
const EMPTY_FORM = { name:"", location:"", category:"", value:"", usage:["insurance"], photoUrl:"", notes:"" };

function loadItems() {
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveItems(items) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ── OUTSIDE App so it never gets recreated ────────────
function FormFields({ f, setF }) {
  function toggleTag(tag) {
    setF(p => ({
      ...p,
      usage: p.usage.includes(tag)
        ? p.usage.filter(t => t !== tag)
        : [...p.usage, tag],
    }));
  }

  return (
    <>
      <div className="field">
        <span>Item name *</span>
        <input
          value={f.name}
          onChange={e => setF(p => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Söderhamn sofa"
        />
      </div>

      <div className="field-row">
        <div className="field">
          <span>Room</span>
          <select
            value={f.location}
            onChange={e => setF(p => ({ ...p, location: e.target.value }))}
          >
            <option value="">Select room</option>
            {ROOMS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="field">
          <span>Category</span>
          <select
            value={f.category}
            onChange={e => setF(p => ({ ...p, category: e.target.value }))}
          >
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <span>Estimated value (AUD)</span>
        <div className="input-prefix-wrap">
          <span className="input-prefix">$</span>
          <input
            className="input-prefixed"
            inputMode="decimal"
            value={f.value}
            onChange={e => setF(p => ({ ...p, value: e.target.value }))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="field">
        <span>Photo URL</span>
        <input
          value={f.photoUrl}
          onChange={e => setF(p => ({ ...p, photoUrl: e.target.value }))}
          placeholder="https://…"
        />
      </div>

      <div className="field">
        <span>Purpose</span>
        <div className="tag-row">
          {["insurance","airbnb","general"].map(tag => (
            <button
              key={tag}
              type="button"
              className={f.usage.includes(tag) ? "tag tag-active" : "tag"}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>Notes</span>
        <textarea
          rows={3}
          value={f.notes}
          onChange={e => setF(p => ({ ...p, notes: e.target.value }))}
          placeholder="Serial number, purchase date, brand…"
        />
      </div>
    </>
  );
}

// ── App ───────────────────────────────────────────────
export default function App() {
  const [items,       setItems]       = useState(loadItems);
  const [view,        setView]        = useState("list");
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [filters,     setFilters]     = useState({ query:"", usage:"all" });
  const [sortBy,      setSortBy]      = useState("newest");
  const [editingItem, setEditingItem] = useState(null);
  const [editForm,    setEditForm]    = useState(null);

  function persist(next) { setItems(next); saveItems(next); }

  // ── add ──────────────────────────────────────────────
  function addItem() {
    if (!form.name.trim()) {
      alert("Please enter an item name.");
      return;
    }
    persist([...items, {
      id:       crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name:     form.name.trim(),
      location: form.location,
      category: form.category,
      value:    form.value ? Number(form.value) : null,
      usage:    form.usage,
      photoUrl: form.photoUrl.trim(),
      notes:    form.notes.trim(),
    }]);
    setForm(EMPTY_FORM);
    setView("list");
  }

  // ── edit ─────────────────────────────────────────────
  function openEdit(item) {
    setEditingItem(item);
    setEditForm({
      name:     item.name,
      location: item.location || "",
      category: item.category || "",
      value:    item.value != null ? String(item.value) : "",
      usage:    item.usage || [],
      photoUrl: item.photoUrl || "",
      notes:    item.notes || "",
    });
  }

  function closeEdit() { setEditingItem(null); setEditForm(null); }

  function saveEdit() {
    if (!editForm.name.trim()) {
      alert("Item name cannot be empty.");
      return;
    }
    persist(items.map(it => it.id !== editingItem.id ? it : {
      ...it,
      name:      editForm.name.trim(),
      location:  editForm.location,
      category:  editForm.category,
      value:     editForm.value ? Number(editForm.value) : null,
      usage:     editForm.usage,
      photoUrl:  editForm.photoUrl.trim(),
      notes:     editForm.notes.trim(),
      updatedAt: new Date().toISOString(),
    }));
    closeEdit();
  }

  function deleteItem(id) {
    if (!window.confirm("Delete this item?")) return;
    persist(items.filter(it => it.id !== id));
    closeEdit();
  }

  // ── derived ───────────────────────────────────────────
  const totalValue = items.reduce((s, i) => s + (i.value || 0), 0);

  const visible = [...items]
    .filter(item => {
      const q = filters.query.toLowerCase();
      const matchQ = !q
        || item.name.toLowerCase().includes(q)
        || (item.location||"").toLowerCase().includes(q)
        || (item.category||"").toLowerCase().includes(q);
      const matchU = filters.usage === "all"
        || (item.usage||[]).includes(filters.usage);
      return matchQ && matchU;
    })
    .sort((a, b) => {
      if (sortBy === "newest")     return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest")     return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "value-high") return (b.value||0) - (a.value||0);
      if (sortBy === "value-low")  return (a.value||0) - (b.value||0);
      if (sortBy === "name")       return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="app-root">

      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div>
            <h1 className="app-title">HEMLIST</h1>
            <p className="app-subtitle">Your home, documented.</p>
          </div>
          <button
            type="button"
            className={view === "add" ? "btn-ghost" : "btn-primary"}
            onClick={() => setView(v => v === "add" ? "list" : "add")}
          >
            {view === "add" ? "← Back" : "+ Add item"}
          </button>
        </div>

        {view === "list" && (
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-value">{items.length}</span>
              <span className="stat-label">Items</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-value">
                {[...new Set(items.map(i => i.location).filter(Boolean))].length}
              </span>
              <span className="stat-label">Rooms</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-value">${totalValue.toLocaleString()}</span>
              <span className="stat-label">Total value</span>
            </div>
          </div>
        )}
      </header>

      <main className="app-main">

        {/* ── Add view ── */}
        {view === "add" && (
          <div className="panel fade-in">
            <h2 className="panel-title">New item</h2>
            <div className="form">
              <FormFields f={form} setF={setForm} />
              <div className="form-actions">
                <button type="button" className="btn-ghost"
                  onClick={() => setView("list")}>
                  Cancel
                </button>
                <button type="button" className="btn-primary"
                  onClick={addItem}>
                  Save item
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── List view ── */}
        {view === "list" && (
          <div className="fade-in">
            <div className="filters-bar">
              <div className="search-wrap">
                <span className="search-icon">⌕</span>
                <input
                  className="search-input"
                  placeholder="Search items, rooms, categories…"
                  value={filters.query}
                  onChange={e => setFilters(f => ({ ...f, query: e.target.value }))}
                />
              </div>
              <div className="filter-row">
                <select className="filter-select" value={filters.usage}
                  onChange={e => setFilters(f => ({ ...f, usage: e.target.value }))}>
                  <option value="all">All purposes</option>
                  <option value="insurance">Insurance</option>
                  <option value="airbnb">Airbnb</option>
                  <option value="general">General</option>
                </select>
                <select className="filter-select" value={sortBy}
                  onChange={e => setSortBy(e.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">Name A–Z</option>
                  <option value="value-high">Value: high–low</option>
                  <option value="value-low">Value: low–high</option>
                </select>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⬜</div>
                <p>No items yet.</p>
                <p className="empty-sub">
                  Tap <strong>+ Add item</strong> to get started.
                </p>
              </div>
            ) : (
              <div className="card-grid">
                {visible.map(item => (
                  <div key={item.id} className="item-card"
                    onClick={() => openEdit(item)}>
                    {item.photoUrl
                      ? <img src={item.photoUrl} alt={item.name} className="card-photo" />
                      : <div className="card-photo-placeholder">
                          <span>{item.category?.[0] || "?"}</span>
                        </div>
                    }
                    <div className="card-body">
                      <div className="card-top">
                        <span className="card-name">{item.name}</span>
                        <span className="card-edit-hint">Edit</span>
                      </div>
                      <div className="card-meta">
                        {item.location && <span className="meta-pill">{item.location}</span>}
                        {item.category && <span className="meta-pill">{item.category}</span>}
                      </div>
                      {item.notes && <p className="card-notes">{item.notes}</p>}
                      <div className="card-footer">
                        <span className="card-value">
                          {item.value != null ? `$${item.value.toLocaleString()}` : "—"}
                        </span>
                        <div className="tag-row">
                          {(item.usage||[]).map(u => (
                            <span key={u} className={`tag tag-pill tag-${u}`}>{u}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Edit modal ── */}
      {editingItem && editForm && (
        <>
          <div className="modal-backdrop" onClick={closeEdit} />
          <div className="modal fade-in">
            <div className="modal-header">
              <h2 className="panel-title">Edit item</h2>
              <button type="button" className="modal-close"
                onClick={closeEdit}>✕</button>
            </div>
            <div className="form">
              <FormFields f={editForm} setF={setEditForm} />
              <div className="form-actions form-actions-edit">
                <button type="button" className="btn-danger"
                  onClick={() => deleteItem(editingItem.id)}>
                  Delete
                </button>
                <div className="form-actions-right">
                  <button type="button" className="btn-ghost"
                    onClick={closeEdit}>Cancel</button>
                  <button type="button" className="btn-primary"
                    onClick={saveEdit}>Save changes</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
