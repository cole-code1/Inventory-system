# Inventory Management — Frontend (Vite + React)

## Setup

Requires Node.js 18+.

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`. The dev server proxies `/api/*` requests to
the Flask backend at `http://localhost:5000` (see `vite.config.js`), so make
sure the backend is running first.

## Build for production

```bash
npm run build
```

Outputs static files to `frontend/dist/`. Serve them with any static host or
behind the same reverse proxy as the Flask API. If you serve the frontend
from a different origin in production, update `CORS_ORIGINS` in the
backend's `.env` and point API calls at the deployed backend URL instead of
relying on the dev-only Vite proxy.

## What's included

- **Login / Register** — session-based auth against the Flask backend
  (cookies, `credentials: "include"`)
- **Dashboard** — stock value, unit counts, low-stock alerts, recent
  stock movements
- **Products** — search, filter by category, low-stock filter, pagination,
  create/edit/delete, and an "Adjust Stock" action that records an audited
  IN / OUT / ADJUSTMENT movement
- **Categories** and **Suppliers** — simple CRUD screens
- **Stock Movements** — full paginated audit log, filterable by type
