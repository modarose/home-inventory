const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const cloudEnabled = Boolean(API_URL);

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "The server could not complete that request.");
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  me: () => request("/auth/me"),
  login: password => request("/auth/login", { method: "POST", body: JSON.stringify({ password }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  listItems: () => request("/items"),
  createItem: item => request("/items", { method: "POST", body: JSON.stringify(item) }),
  updateItem: (id, item) => request(`/items/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(item) }),
  deleteItem: id => request(`/items/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
