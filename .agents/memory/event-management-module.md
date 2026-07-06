---
name: Event Management Module (GestaoEventos)
description: Architecture decisions for the Core Event Management module in PLAY+EVENTOS
---

## Architecture

`src/components/GestaoEventos.tsx` is the standalone Events ERP component. It was created to replace the inline JSX block that was previously inside `activeTab === "events"` in App.tsx.

**Props it receives from App.tsx:**
- `events`, `tickets`, `finance`, `staff` (filtered by tenant)
- `selectedEventId`, `selectedTenantId`
- `onSelectEvent`, `onRefresh`

**Internal 7-tab layout:**
1. Visão Geral — KPIs, phases summary, objectives
2. Cadastro — Full create/edit form for all 25+ fields
3. Programação — Schedule CRUD with status per activity
4. Checklists — Categorized (PLANEJAMENTO, INFRAESTRUTURA, SEGURANCA, MARKETING, FINANCEIRO, POS_EVENTO) with priority and deadline
5. Infraestrutura — Infrastructure items with category and supplier
6. Logística — Transport / Accommodation / Flight / Transfer entries
7. Localização — Full address, coordinates, emergency routes, map link

**Why:** Replaced the 200-line inline events tab JSX with a fully self-contained component to support rich sub-navigation and all spec-required fields.

**How to apply:** All event writes go through `PUT /api/events/:id` with the full updated sub-array (checklist, schedule, infrastructure, logistics). The PUT endpoint in server.ts does a spread-merge `{ ...existing, ...req.body }` so partial updates are safe.

## Event Type Expansion

25 EventType enum values are now defined in src/types.ts. The seed data in dbService.ts uses `modality: "PRESENCIAL" as any` because the EventModality enum values match the string exactly.

## Seed Data Reset

If db.json needs to be regenerated with the new seed data (new fields), delete `db.json` from the project root and restart the workflow. Or call `POST /api/db/reset`.
