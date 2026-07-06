---
name: Enterprise V2.0 Architecture
description: PostgreSQL + JWT + RBAC migration decisions, critical quirks, and verified working state.
---

## Architecture decisions

- **Database**: Replit built-in PostgreSQL via `DATABASE_URL`. Pool in `src/pgService.ts` with `ssl: { rejectUnauthorized: false }` for prod.
- **Auth**: JWT access tokens (15min) + refresh tokens (7d) in `src/auth.ts`. Middleware: `requireAuth` and `requireRole(roles[])`.
- **Frontend auth**: `src/authService.ts` wraps all API calls via `authFetch()` — handles 401 → refresh → retry loop automatically. All sub-components (GestaoEventos, TicketingEnterprise) import `authFetch` from `../authService`.
- **Server**: `server.ts` uses ESM `.js` extensions for all local imports (required for tsx).
- **Login page**: `src/components/LoginPage.tsx` gates App.tsx. The `useEffect` that calls `fetchDatabase()` is conditioned on `isAuthenticated` to avoid 401 spam on load.

## Critical quirk: bcrypt hash prefix

`bcryptjs` generates hashes with `$2b$` prefix (not `$2a$`). Seeds that used `$2a$` hash strings will fail `bcrypt.compare()`. Always generate fresh hashes with `node -e "require('bcryptjs').hash('pwd',12).then(console.log)"` and run an `UPDATE users SET password_hash = $1` to fix existing rows.

**Why:** The bcrypt library used (`bcryptjs`) outputs `$2b$` but many online hash generators output `$2a$`. They are NOT interchangeable when comparing.

## Seeded credentials (dev/demo)
- Email: `admin@eventflow.com.br` | Password: `Admin@123` | Role: `SUPER_ADMIN`
- All users in tenants `tenant-1` and `tenant-2` share the same password hash.

## Verified working (2026-07-06)
- `/api/health` → PostgreSQL up, 2ms latency
- `/api/auth/login` → returns JWT access + refresh tokens
- `/api/db` (authenticated) → 3 events, 5 finance, 3 tickets, 4 suppliers from PostgreSQL
