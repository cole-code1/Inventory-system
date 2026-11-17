# Inventory / Stock Management System

Full-stack inventory management app:

- **Backend** — Flask + SQLAlchemy REST API (`/backend`)
- **Frontend** — Vite + React SPA (`/frontend`)

## Quick start

**1. Backend** (run first)

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python seed.py          # creates + seeds the database
python app.py           # runs at http://localhost:5000
```

**2. Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev             # runs at http://localhost:5173
```

Open `http://localhost:5173` and log in with `admin` / `admin123`
(or `staff` / `staff123`).

## Architecture

- SQLite by default (zero setup); swap to Postgres/MySQL by changing
  `DATABASE_URL` in `backend/.env` — see `backend/README.md`.
- Session-cookie auth (Flask-Login) — the Vite dev server proxies `/api`
  to Flask so cookies work without extra CORS configuration in dev.
- Every stock change (in / out / manual adjustment) is written to a
  `stock_movements` audit table alongside the product's running quantity,
  so history is never lost even if a product is edited directly.

## Data model

```
Category ──< Product >── Supplier
                │
                └──< StockMovement >── User
```

See `backend/README.md` and `frontend/README.md` for full setup and API
details.
