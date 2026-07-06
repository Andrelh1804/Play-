# PLAY+EVENTOS

Enterprise-grade SaaS platform for event planning, ticketing, ERP, CRM, marketplace, and AI assistance. Built with React + Express + Vite, powered by the Gemini API.

## Stack

- **Frontend**: React 19, Tailwind CSS v4, Lucide React, Motion
- **Backend**: Express (TypeScript), served via `tsx`
- **AI**: Google Gemini (`@google/genai`)
- **Build**: Vite 6, esbuild

## Running the app

```bash
npm run dev
```

Starts the Express server (port 5000) with Vite middleware in dev mode.

## Required secrets

| Secret | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key — get one at https://aistudio.google.com/apikey |

## Architecture

- `server.ts` — Express API + Vite dev middleware. All API routes under `/api/`.
- `src/App.tsx` — Root React component / router.
- `src/dbService.ts` — JSON file-based database (`db.json`).
- `src/types.ts` — Shared TypeScript types.
- `src/components/` — UI components.
- `assets/` — Static assets.

## Data persistence

Uses a local `db.json` file (created at runtime). Call `POST /api/db/reset` to restore seed data.

## Deployment

```bash
npm run build   # Vite build + esbuild server bundle
npm run start   # Run production bundle
```
