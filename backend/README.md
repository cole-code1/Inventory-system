# Electronic Stock Keeping System — Backend (Flask + SQLAlchemy)

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # edit if needed
```

## Create & seed the database

```bash
python seed.py
```

This drops and recreates all tables in `instance/inventory.db` (SQLite by
default) and loads sample categories, suppliers, products, users and stock
movements.

Seeded logins:
| username | password  | role  |
|----------|-----------|-------|
| admin    | admin123  | admin |
| staff    | staff123  | staff |

## Run the API

```bash
python app.py
```

Runs at `http://localhost:5000`. `GET /api/health` should return `{"status": "ok"}`.

## Switching to Postgres/MySQL

Set `DATABASE_URL` in `.env`, e.g.:
```
DATABASE_URL=postgresql://user:password@localhost:5432/inventory
```
Install the matching driver (`psycopg2-binary` for Postgres, `PyMySQL` for
MySQL) and re-run `python seed.py`.

## API overview

| Method | Endpoint                     | Auth | Description |
|--------|-------------------------------|------|--------------|
| POST   | /api/auth/register            | –    | Create a user, logs them in |
| POST   | /api/auth/login                | –    | Session login |
| POST   | /api/auth/logout               | ✓    | Session logout |
| GET    | /api/auth/me                   | ✓    | Current user |
| GET    | /api/categories                | –    | List categories |
| POST   | /api/categories                | ✓    | Create category |
| PUT    | /api/categories/:id             | ✓    | Update category |
| DELETE | /api/categories/:id             | ✓    | Delete category |
| GET    | /api/suppliers                 | –    | List suppliers |
| POST   | /api/suppliers                 | ✓    | Create supplier |
| PUT    | /api/suppliers/:id               | ✓    | Update supplier |
| DELETE | /api/suppliers/:id               | ✓    | Delete supplier |
| GET    | /api/products                  | –    | List products (search, filter, paginate) |
| GET    | /api/products/:id                | –    | Get one product |
| POST   | /api/products                  | ✓    | Create product |
| PUT    | /api/products/:id                | ✓    | Update product |
| DELETE | /api/products/:id                | ✓    | Delete product |
| GET    | /api/stock/movements           | –    | List stock movement history |
| POST   | /api/stock/movements           | ✓    | Record IN / OUT / ADJUSTMENT, updates quantity atomically |
| GET    | /api/dashboard/summary         | –    | Totals, low-stock list, recent movements |

`GET /api/products` supports query params: `search`, `category_id`,
`supplier_id`, `low_stock=true`, `sort`, `order`, `page`, `page_size`.

Session auth uses cookies, so the frontend must call `fetch` with
`credentials: "include"` and `CORS_ORIGINS` in `.env` must match the
frontend's origin exactly.
