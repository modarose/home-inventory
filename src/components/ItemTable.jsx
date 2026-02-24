import { useMemo, useState } from "react";
import { Filters } from "./Filters";

export function ItemTable({ items, onUpdate, onDelete }) {
  const [filters, setFilters] = useState({ query: "", usage: "all" });

  const filtered = useMemo(() => {
    return items.filter(item => {
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
  }, [items, filters]);

  return (
    <>
      <Filters onChange={setFilters} />
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
            {filtered.map(item => (
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
                  {item.value != null ? item.value.toLocaleString() : "—"}
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
                    onClick={() => onDelete(item.id)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">
                  No items match your filters yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
