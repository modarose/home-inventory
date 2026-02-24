import { useState } from "react";

export function Filters({ onChange }) {
  const [query, setQuery] = useState("");
  const [usage, setUsage] = useState("all");

  function emit(nextQuery, nextUsage) {
    onChange?.({ query: nextQuery, usage: nextUsage });
  }

  return (
    <div className="filters">
      <input
        className="filters-search"
        placeholder="Search name, room, category…"
        value={query}
        onChange={e => {
          const v = e.target.value;
          setQuery(v);
          emit(v, usage);
        }}
      />
      <select
        className="filters-select"
        value={usage}
        onChange={e => {
          const v = e.target.value;
          setUsage(v);
          emit(query, v);
        }}
      >
        <option value="all">All uses</option>
        <option value="insurance">Insurance only</option>
        <option value="airbnb">Airbnb relevant</option>
        <option value="general">General</option>
      </select>
    </div>
  );
}
