export function Layout({ children }) {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Home Inventory</h1>
        <p className="app-subtitle">
          Calm, structured overview of everything in your home.
        </p>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
