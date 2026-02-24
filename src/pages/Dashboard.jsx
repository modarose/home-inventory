import { ItemForm } from "../components/ItemForm";
import { ItemTable } from "../components/ItemTable";
import { Filters } from "../components/Filters";
import { useInventory } from "../hooks/useInventory";

export function Dashboard() {
  const { items, addItem, updateItem, removeItem } = useInventory();

  return (
    <div className="grid">
      <section className="panel panel-form">
        <h2>Add item</h2>
        <ItemForm onSubmit={addItem} />
      </section>

      <section className="panel panel-list">
        <div className="panel-header">
          <h2>Inventory</h2>
          <span>{items.length} items</span>
        </div>
        <Filters />
        <ItemTable
          items={items}
          onUpdate={updateItem}
          onDelete={removeItem}
        />
      </section>
    </div>
  );
}
