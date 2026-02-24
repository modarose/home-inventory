import { useState } from "react";

const defaultState = {
  name: "",
  location: "",
  category: "",
  value: "",
  usage: ["insurance"],
  photoUrl: "",
  notes: "",
};

export function ItemForm({ onSubmit }) {
  const [form, setForm] = useState(defaultState);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleUsageChange(tag) {
    setForm(f => {
      const exists = f.usage.includes(tag);
      return {
        ...f,
        usage: exists ? f.usage.filter(t => t !== tag) : [...f.usage, tag],
      };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      ...form,
      value: form.value ? Number(form.value) : null,
    });
    setForm(defaultState);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Name</span>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="E.g. Söderhamn sofa"
          required
        />
      </label>

      <label className="field">
        <span>Room / location</span>
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Living room"
        />
      </label>

      <label className="field">
        <span>Category</span>
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="Furniture, electronics..."
        />
      </label>

      <label className="field">
        <span>Approx. value (MYR/AUD)</span>
        <input
          name="value"
          type="number"
          min="0"
          value={form.value}
          onChange={handleChange}
        />
      </label>

      <label className="field">
        <span>Photo URL</span>
        <input
          name="photoUrl"
          value={form.photoUrl}
          onChange={handleChange}
          placeholder="https://..."
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
              onClick={() => handleUsageChange(tag)}
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
          onChange={handleChange}
          placeholder="Serial numbers, purchase date, retailer..."
        />
      </label>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Add item
        </button>
      </div>
    </form>
  );
}
