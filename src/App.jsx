import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { api, cloudEnabled } from "./lib/api";

const STORAGE_KEY = "homeInventory_v1";
const DEFAULT_ROOMS = ["Living room", "Bedroom", "Kitchen", "Bathroom", "Garage", "Office", "Outdoor", "Other"];
const CATEGORIES = ["Furniture", "Electronics", "Appliance", "Lighting", "Decor", "Clothing", "Tools", "Other"];
const PURPOSES = ["insurance", "airbnb", "general"];
const EMPTY_FORM = {
  name: "", location: "", category: "", quantity: "1", value: "", condition: "Good",
  usage: ["general"], photoUrl: "", photoData: "", receiptName: "", notes: "",
};

function loadItems() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored.map(item => ({ quantity: 1, condition: "Good", ...item })) : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  catch { window.alert("Your browser storage is full. Try removing a large photo or export your inventory before continuing."); }
}

function loadRooms() {
  try {
    const stored = JSON.parse(window.localStorage.getItem("homeInventory_rooms_v1") || "null");
    return Array.isArray(stored) && stored.length ? stored : DEFAULT_ROOMS;
  } catch { return DEFAULT_ROOMS; }
}

function saveRooms(rooms) {
  try { window.localStorage.setItem("homeInventory_rooms_v1", JSON.stringify(rooms)); }
  catch { window.alert("Your browser storage is full. Room changes could not be saved."); }
}

function formatMoney(value) {
  return value == null ? "—" : `$${Number(value).toLocaleString("en-AU", { maximumFractionDigits: 0 })}`;
}

function roomIcon(room) {
  const icons = {
    "All rooms": "⌂",
    "Living room": "▱",
    Bedroom: "▱",
    Kitchen: "♨",
    Bathroom: "≋",
    Garage: "▥",
    Office: "▣",
    Outdoor: "❧",
    Other: "□",
  };
  return icons[room] || "□";
}

async function readFile(file, onLoad) {
  if (!file) return;
  if (file.type.startsWith("image/")) {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      onLoad(canvas.toDataURL("image/webp", 0.78), file.name);
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); window.alert("That image could not be processed."); };
    image.src = objectUrl;
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onLoad(reader.result, file.name);
  reader.readAsDataURL(file);
}

function FormFields({ form, setForm, rooms }) {
  function update(key, value) { setForm(previous => ({ ...previous, [key]: value })); }
  function togglePurpose(purpose) {
    setForm(previous => ({
      ...previous,
      usage: previous.usage.includes(purpose)
        ? previous.usage.filter(item => item !== purpose)
        : [...previous.usage, purpose],
    }));
  }

  return (
    <div className="form-fields">
      <section className="form-section">
        <div className="section-kicker">The essentials</div>
        <div className="field">
          <label htmlFor="item-name">What are you keeping track of?</label>
          <input id="item-name" value={form.name} onChange={event => update("name", event.target.value)} placeholder="e.g. Oak dining table" autoFocus />
        </div>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="item-room">Room</label>
            <select id="item-room" value={form.location} onChange={event => update("location", event.target.value)}>
              <option value="">Choose a room</option>
              {rooms.map(room => <option key={room}>{room}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="item-category">Category</label>
            <select id="item-category" value={form.category} onChange={event => update("category", event.target.value)}>
              <option value="">Choose a category</option>
              {CATEGORIES.map(category => <option key={category}>{category}</option>)}
            </select>
          </div>
        </div>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="item-quantity">Quantity</label>
            <input id="item-quantity" type="number" min="1" step="1" value={form.quantity} onChange={event => update("quantity", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="item-value">Value per item <span className="label-hint">AUD</span></label>
            <div className="money-input"><span>$</span><input id="item-value" type="number" min="0" step="1" value={form.value} onChange={event => update("value", event.target.value)} placeholder="0" /></div>
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="section-kicker">Make it yours</div>
        <div className="field">
          <label>Condition</label>
          <div className="choice-row">
            {["New", "Good", "Worn", "Needs attention"].map(condition => <button key={condition} type="button" className={form.condition === condition ? "choice choice-active" : "choice"} onClick={() => update("condition", condition)}>{condition}</button>)}
          </div>
        </div>
        <div className="field">
          <label>Use this item for</label>
          <div className="choice-row">
            {PURPOSES.map(purpose => <button key={purpose} type="button" className={form.usage.includes(purpose) ? "choice choice-active" : "choice"} onClick={() => togglePurpose(purpose)}>{purpose}</button>)}
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="section-kicker">Keep the details close</div>
        <div className="upload-grid">
          <label className="upload-card">
            <input type="file" accept="image/*" onChange={event => readFile(event.target.files?.[0], (data, name) => setForm(previous => ({ ...previous, photoData: data, photoUrl: "", photoName: name })))} />
            {form.photoData || form.photoUrl ? <><img src={form.photoData || form.photoUrl} alt="Item preview" /><button type="button" className="upload-remove" onClick={event => { event.preventDefault(); event.stopPropagation(); setForm(previous => ({ ...previous, photoData: "", photoUrl: "", photoName: "" })); }}>Remove photo</button></> : <><span className="upload-icon">＋</span><strong>Add a photo</strong><small>From your phone or computer</small></>}
          </label>
          <label className="upload-card upload-receipt">
            <input type="file" accept="image/*,.pdf" onChange={event => readFile(event.target.files?.[0], (data, name) => setForm(previous => ({ ...previous, receiptData: data, receiptName: name })))} />
            <span className="upload-icon">▤</span><strong>{form.receiptName || "Add a receipt"}</strong><small>Optional, {cloudEnabled ? "stored with your inventory" : "stored on this device"}</small>{form.receiptName && <button type="button" className="upload-remove upload-remove-receipt" onClick={event => { event.preventDefault(); event.stopPropagation(); setForm(previous => ({ ...previous, receiptData: "", receiptName: "" })); }}>Remove receipt</button>}
          </label>
        </div>
        <div className="field">
          <label htmlFor="item-notes">Notes</label>
          <textarea id="item-notes" rows={4} value={form.notes} onChange={event => update("notes", event.target.value)} placeholder="Brand, model, serial number, purchase details..." />
        </div>
      </section>
    </div>
  );
}

function ItemCard({ item, onOpen }) {
  const total = (item.value || 0) * (item.quantity || 1);
  const image = item.photoData || item.photoUrl;
  return <div className="item-card">
    <button className="item-image item-image-button" type="button" onClick={() => onOpen(item)} aria-label={`View details for ${item.name}`}>
      {image ? <img src={image} alt="" /> : <span>{item.name?.[0]?.toUpperCase() || "?"}</span>}
    </button>
    <button className="item-card-body" type="button" onClick={() => onOpen(item)}><div className="item-card-heading"><strong>{item.name}</strong><span className="item-arrow">↗</span></div><div className="item-card-meta">{item.category || "Uncategorised"}<span>·</span>{item.quantity || 1} {item.quantity === 1 ? "item" : "items"}</div><div className="item-card-footer"><span>{formatMoney(total)}</span><span className="condition-dot">{item.condition || "Good"}</span></div></button>
  </div>;
}

function ItemDetail({ item, onBack, onEdit, onImage }) {
  const image = item.photoData || item.photoUrl;
  const total = (item.value || 0) * (item.quantity || 1);
  return <main className="detail-page"><button className="back-link" type="button" onClick={onBack}>← Back to inventory</button><div className="detail-card"><div className={image ? "detail-image" : "detail-image detail-image-placeholder"}>{image ? <button type="button" onClick={() => onImage(image, item.name)} aria-label={`View full size photo of ${item.name}`}><img src={image} alt={item.name} /></button> : <span>{item.name?.[0]?.toUpperCase() || "?"}</span>}</div><div className="detail-content"><div className="detail-heading"><div><span className="eyebrow">{item.location || "Unassigned room"}</span><h1>{item.name}</h1></div><button className="button button-quiet" type="button" onClick={onEdit}>Edit item</button></div><div className="detail-summary"><div><span>Quantity</span><strong>{item.quantity || 1}</strong></div><div><span>Value per item</span><strong>{formatMoney(item.value)}</strong></div><div><span>Total value</span><strong>{formatMoney(total)}</strong></div></div><div className="detail-tags"><span>{item.category || "Uncategorised"}</span><span>{item.condition || "Good"}</span>{(item.usage || []).map(use => <span key={use}>{use}</span>)}</div>{item.notes && <section className="detail-notes"><span className="eyebrow">Notes</span><p>{item.notes}</p></section>}{item.receiptName && <div className="receipt-line">▤ Receipt attached: {item.receiptName}</div>}<p className="detail-hint">Tap the image to view it full size.</p></div></div></main>;
}

function LoginScreen({ onLogin, error }) {
  const [password, setPassword] = useState("");
  return <div className="login-shell"><div className="login-card"><div className="brand">HEMLIST<span>home, documented</span></div><span className="eyebrow">Your private inventory</span><h1>Welcome home.</h1><p>Enter your password to access your household inventory.</p><form onSubmit={event => { event.preventDefault(); onLogin(password); }}><label className="login-label" htmlFor="login-password">Password</label><input id="login-password" className="login-input" type="password" value={password} onChange={event => setPassword(event.target.value)} autoFocus /><button className="button button-primary login-button" type="submit">Unlock inventory</button>{error && <div className="login-error" role="alert">{error}</div>}</form><small className="login-note">Your data is stored securely in your private cloud database.</small></div></div>;
}

function SideMenu({ open, onClose, onHome, onAdd, onSettings, onLogout, cloudMode }) {
  if (!open) return null;
  return <><div className="menu-backdrop" onClick={onClose} /><aside className="side-menu"><div className="side-menu-top"><div className="brand">HEMLIST<span>home, documented</span></div><button className="modal-close" type="button" onClick={onClose} aria-label="Close menu">×</button></div><nav className="side-nav"><button type="button" onClick={onHome}>⌂ <span>Home</span></button><button type="button" onClick={onAdd}>＋ <span>Add item</span></button><button type="button" onClick={onSettings}>⚙ <span>Settings</span></button></nav>{cloudMode && <button className="side-logout" type="button" onClick={onLogout}>Log out</button>}</aside></>;
}

function RoomSettings({ rooms, onAdd, onRename, onRemove }) {
  const [newRoom, setNewRoom] = useState("");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  function add(event) { event.preventDefault(); if (newRoom.trim()) { onAdd(newRoom.trim()); setNewRoom(""); } }
  return <section className="settings-section"><span className="eyebrow">Personalise your home</span><h1>Rooms</h1><p className="settings-copy">Create the places that make sense for your home. Removing a room won’t delete its items.</p><form className="room-add" onSubmit={add}><input value={newRoom} onChange={event => setNewRoom(event.target.value)} placeholder="Add a room" aria-label="New room name" /><button className="button button-primary" type="submit">Add room</button></form><div className="room-list">{rooms.map(room => <div className="room-list-row" key={room}>{editing === room ? <input className="room-edit-input" value={draft} onChange={event => setDraft(event.target.value)} autoFocus /> : <span>{room}</span>}{editing === room ? <div className="room-row-actions"><button type="button" onClick={() => { onRename(room, draft); setEditing(null); }}>Save</button><button type="button" onClick={() => setEditing(null)}>Cancel</button></div> : <div className="room-row-actions"><button type="button" onClick={() => { setEditing(room); setDraft(room); }}>Edit</button><button type="button" onClick={() => onRemove(room)}>Remove</button></div>}</div>)}</div></section>;
}

function ImageLightbox({ image, alt, onClose }) {
  useEffect(() => { function closeOnEscape(event) { if (event.key === "Escape") onClose(); } window.addEventListener("keydown", closeOnEscape); return () => window.removeEventListener("keydown", closeOnEscape); }, [onClose]);
  if (!image) return null;
  return <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Full size image of ${alt}`} onClick={onClose}><button className="lightbox-close" type="button" onClick={onClose} aria-label="Close image">×</button><img src={image} alt={alt} onClick={event => event.stopPropagation()} /></div>;
}

export default function App() {
  const [items, setItems] = useState(() => cloudEnabled ? [] : loadItems());
  const [roomNames, setRoomNames] = useState(() => cloudEnabled ? DEFAULT_ROOMS : loadRooms());
  const [authStatus, setAuthStatus] = useState(cloudEnabled ? "loading" : "local");
  const [authError, setAuthError] = useState("");
  const [view, setView] = useState("home");
  const [activeRoom, setActiveRoom] = useState("All rooms");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!cloudEnabled) return;
    api.me().then(result => {
      if (result.authenticated) return Promise.all([api.listItems(), api.listRooms()]).then(([remoteItems, remoteRooms]) => { setItems(remoteItems); setRoomNames(remoteRooms); setAuthStatus("authenticated"); });
      setAuthStatus("logged-out");
    }).catch(error => { setAuthError(error.message); setAuthStatus("error"); });
  }, []);

  useEffect(() => {
    document.querySelectorAll(".room-card").forEach(card => {
      const room = card.querySelector("strong")?.textContent;
      card.style.setProperty("--room-icon", `"${roomIcon(room)}"`);
    });
  }, [roomNames, items, activeRoom]);

  function persist(next) { setItems(next); saveItems(next); }
  function startNew() { setEditingId(null); setForm(EMPTY_FORM); setView("form"); }
  function openItem(item) { setDetailItem(item); setView("detail"); }
  function editItem(item) { setEditingId(item.id); setForm({ ...EMPTY_FORM, ...item, quantity: String(item.quantity || 1), value: item.value == null ? "" : String(item.value) }); setView("form"); }
  async function saveForm(event) {
    event.preventDefault();
    if (!form.name.trim()) return;
    const item = { ...form, name: form.name.trim(), quantity: Math.max(1, Number(form.quantity) || 1), value: form.value === "" ? null : Math.max(0, Number(form.value) || 0), updatedAt: new Date().toISOString() };
    try {
      if (cloudEnabled) {
        if (editingId) await api.updateItem(editingId, item);
        else await api.createItem({ ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
        setItems(await api.listItems());
      } else if (editingId) persist(items.map(existing => existing.id === editingId ? { ...existing, ...item } : existing));
      else persist([...items, { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
      setView("home");
    } catch (error) { window.alert(error.message); }
  }
  async function deleteItem() {
    if (!editingId || !window.confirm("Remove this item from your home inventory?")) return;
    try {
      if (cloudEnabled) { await api.deleteItem(editingId); setItems(await api.listItems()); }
      else persist(items.filter(item => item.id !== editingId));
      setView("home");
    } catch (error) { window.alert(error.message); }
  }

  async function login(password) {
    try { const [, remoteRooms] = await Promise.all([api.login(password), api.listRooms()]); setItems(await api.listItems()); setRoomNames(remoteRooms); setAuthStatus("authenticated"); setAuthError(""); }
    catch (error) { setAuthError(error.message); }
  }

  async function logout() {
    if (cloudEnabled) await api.logout().catch(() => {});
    setItems([]);
    setView("home");
    setAuthStatus(cloudEnabled ? "logged-out" : "local");
  }
  async function addRoom(room) {
    const next = [...roomNames, room].filter((name, index, list) => list.indexOf(name) === index);
    if (next.length === roomNames.length) return;
    try { if (cloudEnabled) await api.saveRooms(next); else saveRooms(next); setRoomNames(next); } catch (error) { window.alert(error.message); }
  }
  async function renameRoom(previousName, nextName) {
    const cleanName = nextName.trim();
    if (!cleanName || (cleanName !== previousName && roomNames.includes(cleanName))) return;
    const nextRooms = roomNames.map(room => room === previousName ? cleanName : room);
    const affected = items.filter(item => item.location === previousName);
    try {
      if (cloudEnabled) { await Promise.all(affected.map(item => api.updateItem(item.id, { ...item, location: cleanName }))); await api.saveRooms(nextRooms); setItems(await api.listItems()); }
      else { persist(items.map(item => item.location === previousName ? { ...item, location: cleanName } : item)); saveRooms(nextRooms); }
      setRoomNames(nextRooms); if (activeRoom === previousName) setActiveRoom(cleanName);
    } catch (error) { window.alert(error.message); }
  }
  async function removeRoom(room) {
    if (!window.confirm(`Remove ${room}? Items in this room will become unassigned.`)) return;
    const nextRooms = roomNames.filter(name => name !== room);
    const affected = items.filter(item => item.location === room);
    try {
      if (cloudEnabled) { await Promise.all(affected.map(item => api.updateItem(item.id, { ...item, location: "" }))); await api.saveRooms(nextRooms); setItems(await api.listItems()); }
      else { persist(items.map(item => item.location === room ? { ...item, location: "" } : item)); saveRooms(nextRooms); }
      setRoomNames(nextRooms); if (activeRoom === room) setActiveRoom("All rooms");
    } catch (error) { window.alert(error.message); }
  }
  const totalValue = items.reduce((sum, item) => sum + ((item.value || 0) * (item.quantity || 1)), 0);
  const roomGroups = useMemo(() => roomNames.map(room => ({ room, items: items.filter(item => item.location === room) })).filter(group => group.items.length), [items, roomNames]);
  const visibleItems = useMemo(() => items.filter(item => {
    const matchesRoom = activeRoom === "All rooms" || item.location === activeRoom;
    const needle = query.toLowerCase();
    return matchesRoom && (!needle || [item.name, item.location, item.category, item.notes].some(value => (value || "").toLowerCase().includes(needle)));
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [items, activeRoom, query]);

  if (authStatus === "loading") return <div className="login-shell"><div className="login-card login-loading">Loading your inventory…</div></div>;
  if (cloudEnabled && authStatus !== "authenticated") return <LoginScreen onLogin={login} error={authError} />;

  if (view === "detail" && detailItem) return <div className="app-shell"><header className="topbar"><button className="brand brand-button" type="button" onClick={() => setView("home")}>HEMLIST<span>home, documented</span></button><button className="menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button></header><SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onHome={() => { setMenuOpen(false); setView("home"); }} onAdd={() => { setMenuOpen(false); startNew(); }} onSettings={() => { setMenuOpen(false); setView("settings"); }} onLogout={logout} cloudMode={cloudEnabled} /><ItemDetail item={detailItem} onBack={() => setView("home")} onEdit={() => editItem(detailItem)} onImage={(image, alt) => setLightbox({ image, alt })} /><ImageLightbox image={lightbox?.image} alt={lightbox?.alt || "Inventory item"} onClose={() => setLightbox(null)} /></div>;

  if (view === "form") return <div className="app-shell"><header className="topbar"><button className="brand brand-button" type="button" onClick={() => setView("home")}>HEMLIST<span>home, documented</span></button><div className="topbar-actions"><button className="text-button" type="button" onClick={() => setView("home")}>Cancel</button><button className="menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button></div></header><SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onHome={() => { setMenuOpen(false); setView("home"); }} onAdd={() => { setMenuOpen(false); startNew(); }} onSettings={() => { setMenuOpen(false); setView("settings"); }} onLogout={logout} cloudMode={cloudEnabled} /><main className="form-page"><div className="form-intro"><span className="eyebrow">{editingId ? "Update your inventory" : "A little more clarity at home"}</span><h1>{editingId ? "Edit item" : "Add something to your home"}</h1><p>Capture the details now. You’ll thank yourself later.</p></div><form onSubmit={saveForm}><FormFields form={form} setForm={setForm} rooms={roomNames} /><div className="form-actions"><button type="button" className="button button-quiet" onClick={() => setView("home")}>Cancel</button>{editingId && <button type="button" className="button button-danger" onClick={deleteItem}>Delete</button>}<button className="button button-primary" type="submit">{editingId ? "Save changes" : "Save item"}</button></div></form></main></div>;

  if (view === "settings") return <div className="app-shell"><header className="topbar"><button className="brand brand-button" type="button" onClick={() => setView("home")}>HEMLIST<span>home, documented</span></button><button className="menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button></header><SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onHome={() => { setMenuOpen(false); setView("home"); }} onAdd={() => { setMenuOpen(false); startNew(); }} onSettings={() => setMenuOpen(false)} onLogout={logout} cloudMode={cloudEnabled} /><main className="settings-page"><RoomSettings rooms={roomNames} onAdd={addRoom} onRename={renameRoom} onRemove={removeRoom} /></main></div>;

  return <div className="app-shell"><header className="topbar"><div className="brand">HEMLIST<span>home, documented</span></div><div className="topbar-actions"><button className="button button-primary button-small" type="button" onClick={startNew}>＋ Add item</button><button className="menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button></div></header><SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onHome={() => setMenuOpen(false)} onAdd={() => { setMenuOpen(false); startNew(); }} onSettings={() => { setMenuOpen(false); setView("settings"); }} onLogout={logout} cloudMode={cloudEnabled} /><main className="home-page"><section className="welcome"><div><span className="eyebrow">Your home, at a glance</span><h1>A calmer way to keep track.</h1><p>See what you own, where it lives, and what it’s worth.</p></div><div className="stats"><div><strong>{items.length}</strong><span>things</span></div><div><strong>{roomGroups.length}</strong><span>rooms</span></div><div><strong>{formatMoney(totalValue)}</strong><span>total value</span></div></div></section><section className="room-section"><div className="section-heading"><div><span className="eyebrow">Browse by place</span><h2>Rooms</h2></div><span className="result-count">{items.length} {items.length === 1 ? "item" : "items"}</span></div><div className="room-grid"><button type="button" className={activeRoom === "All rooms" ? "room-card room-card-active" : "room-card"} onClick={() => setActiveRoom("All rooms")}><span className="room-symbol">⌂</span><strong>All rooms</strong><small>{items.length} items</small></button>{roomGroups.map(group => <button type="button" key={group.room} className={activeRoom === group.room ? "room-card room-card-active" : "room-card"} onClick={() => setActiveRoom(group.room)}><span className="room-symbol">{group.room === "Outdoor" ? "◌" : "⌂"}</span><strong>{group.room}</strong><small>{group.items.length} {group.items.length === 1 ? "item" : "items"}</small></button>)}</div></section><section className="items-section"><div className="section-heading"><div><span className="eyebrow">{activeRoom}</span><h2>{activeRoom === "All rooms" ? "Recently added" : "Everything here"}</h2></div><div className="search-box"><span>⌕</span><input aria-label="Search your inventory" placeholder="Search" value={query} onChange={event => setQuery(event.target.value)} /></div></div>{visibleItems.length ? <div className="item-grid">{visibleItems.map(item => <ItemCard key={item.id} item={item} onOpen={openItem} onImage={(image, alt) => setLightbox({ image, alt })} />)}</div> : <div className="empty-state"><div className="empty-mark">○</div><h3>{query ? "Nothing found" : activeRoom === "All rooms" ? "Your home is ready to be documented" : `Nothing in the ${activeRoom.toLowerCase()} yet`}</h3><p>{query ? "Try another search." : "Start with one item. Small steps make a useful inventory."}</p><button className="button button-primary" type="button" onClick={startNew}>＋ Add your first item</button></div>}</section></main><ImageLightbox image={lightbox?.image} alt={lightbox?.alt || "Inventory item"} onClose={() => setLightbox(null)} /></div>;
}
