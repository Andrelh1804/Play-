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

Starts the Express server (port 5000) with Vite middleware in dev mode. Bound to the `Start application` workflow, which is what runs when you hit Run.

Setup notes for this Replit import:
- Dependencies installed via `npm install`; the `tsx` dev dependency needed a reinstall to populate `node_modules/.bin` after import.
- `schema.sql` has been applied to the Replit-managed PostgreSQL database (33 tables + seed data, including the default admin login above).
- `SESSION_SECRET` is set. `GEMINI_API_KEY` has not been provided yet — AI features return 503 until it's set.

## Database setup

The PostgreSQL database schema is in `schema.sql`. Run it once to initialize:

```bash
psql $DATABASE_URL -f schema.sql
```

This creates all 33 tables (including new ticketing and financial planning tables) and seeds:
- Default tenant: **PLAY+EVENTOS Demo**
- Admin account: **admin@eventflow.com.br** / **Admin@123**
- 25 reusable cost templates (Estrutura, Sonorização, Iluminação, Esportes, Segurança, Marketing…)

## Required secrets

| Secret | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key — get one at https://aistudio.google.com/apikey |
| `JWT_SECRET` | JWT signing secret (optional — has a fallback default, set for production) |

AI features (executive summary, document analysis, risk assessment) will return 503 until `GEMINI_API_KEY` is configured.

## Architecture

- `server.ts` — Express API + Vite dev middleware. All API routes under `/api/`. Public routes (no auth) under `/api/public/`.
- `src/main.tsx` — Entry point. Detects `/e/:slug` / `/evento/:slug` and renders EventoPublico; otherwise renders App.
- `src/App.tsx` — Authenticated root component with full sidebar navigation.
- `src/auth.ts` — JWT authentication & RBAC middleware.
- `src/pgService.ts` — PostgreSQL connection pool helpers.
- `src/components/` — UI components:
  - `EventoPublico.tsx` — Public event landing page (FASE 1 — Master Prompt V8.2)
  - `LotesCupons.tsx` — Category, batch & coupon management (FASES 2 & 3)
  - `TicketingEnterprise.tsx` — Full ticketing dashboard (FASES 4 & 5)
  - `PlanejamentoFinanceiro.tsx` — Financial planning, budget & proposals (FASES 6, 7 & 8)
  - `DashboardExecutivo.tsx` — Executive KPI dashboard (FASE 9)
  - `GestaoEventos.tsx`, `CentroOperacoes.tsx`, `AgendaInteligente.tsx`, …
- `schema.sql` — Full PostgreSQL schema + seed data.

## Public Event Pages

Each event gets an auto-generated public URL (no login required):

```
/e/{slug}       → e.g. /e/corrida-play-10k-2025
/evento/{slug}  → same page, alternate path
```

Public API (no auth):
- `GET  /api/public/events/:slug` — Event data + categories + active batches + sponsors
- `POST /api/public/coupons/validate` — Validate discount coupon
- `POST /api/public/tickets/buy` — Purchase tickets (transactional, prevents oversell)

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
