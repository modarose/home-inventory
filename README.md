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

## Cloud deployment

The repository now includes an optional cloud setup:

- **Vercel** serves the Vite frontend
- **Render** runs the API in `server/`
- **MongoDB Atlas** stores inventory records

The frontend remains local-only when `VITE_API_URL` is not set. When it is set, the app shows a private password screen and uses the Render API instead of browser storage.

### 1. Create the MongoDB database

In MongoDB Atlas:

1. Create a cluster and database named `hemlist`.
2. Create a database user.
3. Allow your Render service to connect. For an initial deployment, Atlas Network Access can use `0.0.0.0/0`; restrict this later if your hosting setup provides fixed egress IPs.
4. Copy the connection string for the Render environment variables.

### 2. Deploy the API to Render

Create a new Render Web Service from the repository with:

```text
Root directory: server
Build command: npm install
Start command: npm start
Health check path: /api/health
```

Set these environment variables in Render:

```text
NODE_ENV=production
MONGODB_URI=your MongoDB Atlas connection string
MONGODB_DB=hemlist
APP_PASSWORD=a long private password
SESSION_SECRET=a long random secret
CLIENT_ORIGIN=your Vercel URL
```

The included `render.yaml` can also be used as a starting point for a Blueprint deployment.

### 3. Deploy the frontend to Vercel

Import the repository into Vercel and use the default Vite settings. Add this environment variable:

```text
VITE_API_URL=https://your-render-service.onrender.com/api
```

After the Vercel deployment is available, update `CLIENT_ORIGIN` in Render to the final Vercel URL and redeploy the API.

### Security notes

The first cloud release uses one configured password and a signed, HTTP-only session cookie. Inventory records already contain an `ownerId` field so the API can later switch to real user accounts without changing the item model. Do not commit `.env` files or production secrets.

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
