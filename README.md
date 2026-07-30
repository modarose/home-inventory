# HEMLIST

> A calm, room-first way to document what you own.

HEMLIST is a local-first home inventory app for keeping track of household items, where they live, how many you have, and what they are worth. It is designed for everyday household organisation, with room to grow into insurance and Airbnb use cases later.

## What it does

- Browse your inventory by room
- Add, edit, and remove household items
- Track quantity and value per item
- Calculate total household value
- Organise items by category
- Record condition and intended use
- Add notes such as brand, model, or serial number
- Upload item photos from a phone or computer
- Attach receipts locally
- Search across item names, rooms, categories, and notes
- Use a responsive interface on desktop and mobile

## Design direction

HEMLIST uses a Japandi-inspired visual language: warm neutrals, muted sage accents, generous spacing, soft borders, and a quiet editorial feel. The interface is intentionally room-first so the inventory feels connected to the home rather than like a spreadsheet.

## Getting started

### Requirements

- Node.js 18 or newer
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Vite will print the local development URL in the terminal.

### Create a production build

```bash
npm run build
```

### Run lint checks

```bash
npm run lint
```

## Data and privacy

HEMLIST is currently local-only. Inventory records, uploaded photos, and receipt attachments are stored in the browser on the device being used.

This means:

- No account or server is required
- Your inventory is not sent to a cloud service
- Data is not automatically available on another device
- Clearing browser storage can remove your inventory
- Large uploads may exceed browser storage limits

Cloud synchronisation, multi-property support, and more durable file storage are intentionally deferred until the core experience is mature.

## Project structure

```text
src/
├── App.jsx              # Main application and inventory workflows
├── App.css              # Japandi design system and responsive layout
├── index.css            # Global browser and focus styles
├── components/          # Reusable inventory UI components
├── hooks/               # Inventory state helpers
├── pages/               # Page-level components
└── styles/              # Supporting style modules
```

The current active experience is built in `src/App.jsx`. Some earlier component and styling modules remain in the repository as a foundation for future refactoring.

## Item data

An inventory item can contain:

```js
{
  id,
  name,
  location,
  category,
  quantity,
  value,
  condition,
  usage,
  photoData,
  receiptData,
  receiptName,
  notes,
  createdAt,
  updatedAt
}
```

`value` represents the value of one item. The dashboard calculates the total using `quantity × value`.

## Roadmap

Potential future improvements include:

- Export and import backups
- IndexedDB storage for larger photos and receipts
- Insurance report generation
- Receipt preview and download
- Multiple properties
- Cloud sync and optional authentication
- Bulk editing and item selection
- More detailed room and category summaries

## Contributing

This is currently a small personal project. For changes, keep the interface calm and practical, preserve local-first behaviour, and run both checks before submitting:

```bash
npm run lint
npm run build
```

## License

No license has been selected yet.
