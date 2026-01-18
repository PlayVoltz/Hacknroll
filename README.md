# GoBroke.com (Localhost Only)

Virtual credits only. No real money or payments.

## Prereqs

- Node.js 18+
- SQLite (bundled via Prisma)

## Setup

```bash
npm install
```

### Backend

Create `backend/.env`:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me"
CLIENT_ORIGIN="http://localhost:3000"
PORT=4000
```

Run migrations + generate client:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

Seed demo users + group:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

### Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:4000`

## Monorepo Dev

From repo root:

```bash
npm run dev
```

## Demo Accounts (seed)

- `alex@example.com` / `password123`
- `sam@example.com` / `password123`

## Game Logic

Unit-testable logic is kept in `backend/src/services/games`.
