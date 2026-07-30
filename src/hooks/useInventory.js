import { useEffect, useState } from "react";

const STORAGE_KEY = "homeInventory_v1";

export function useInventory() {
  const [items, setItems] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(item) {
    setItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...item,
      },
    ]);
  }

  function updateItem(id, updates) {
    setItems(prev =>
      prev.map(it => (it.id === id ? { ...it, ...updates } : it)),
    );
  }

  function removeItem(id) {
    setItems(prev => prev.filter(it => it.id !== id));
  }

  return { items, addItem, updateItem, removeItem };
}
