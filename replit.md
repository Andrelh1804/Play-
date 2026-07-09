# PLAY+EVENTOS Enterprise V2.0

Enterprise-grade SaaS platform for event planning, ticketing, ERP, CRM, marketplace, and AI assistance. Built with React + Express + Vite, powered by the Gemini API.

## Stack

- **Frontend**: React 19, Tailwind CSS v4, Lucide React, Motion
- **Backend**: Express (TypeScript), served via `tsx`
- **Database**: PostgreSQL 16 (Replit-managed, `$DATABASE_URL`)
- **AI**: Google Gemini (`@google/genai`)
- **Build**: Vite 6, esbuild

## Running the app

```bash
npm run dev
```

Starts the Express server (port 5000) with Vite middleware in dev mode.

## Database setup

The PostgreSQL database schema is in `schema.sql`. Run it once to initialize:

```bash
psql $DATABASE_URL -f schema.sql
```

This creates all 27 tables and seeds:
- Default tenant: **PLAY+EVENTOS Demo**
- Admin account: **admin@eventflow.com.br** / **Admin@123**

## Required secrets

| Secret | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key — get one at https://aistudio.google.com/apikey |
| `JWT_SECRET` | JWT signing secret (optional — has a fallback default, set for production) |

AI features (executive summary, document analysis, risk assessment) will return 503 until `GEMINI_API_KEY` is configured.

## Architecture

- `server.ts` — Express API + Vite dev middleware. All API routes under `/api/`.
- `src/App.tsx` — Root React component / router.
- `src/auth.ts` — JWT authentication & RBAC middleware.
- `src/pgService.ts` — PostgreSQL connection pool helpers.
- `src/components/` — UI components (GestaoEventos, TicketingEnterprise, DashboardExecutivo, etc.).
- `schema.sql` — Full PostgreSQL schema + seed data.

## Authentication & roles

RBAC roles (lowest → highest): `VIEWER → STAFF → COORDINATOR → PRODUCER → ADMIN → SUPER_ADMIN`

Login via `POST /api/auth/login` with `{ email, password }`.

## Deployment

```bash
npm run build   # Vite build + esbuild server bundle
npm run start   # Run production bundle
```

## User preferences

- Keep Brazilian Portuguese for all business logic, component names, and UI strings.
