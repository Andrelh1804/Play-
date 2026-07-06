---
name: Ticketing Enterprise module
description: Architecture and key decisions for the V3.0 Ticketing Enterprise implementation
---

# Ticketing Enterprise Module

## What was built
`src/components/TicketingEnterprise.tsx` — replaces the old inline ticketing tab in App.tsx.

**7 sub-tabs:**
1. Dashboard — KPIs (tickets, revenue, check-in rate, occupancy, credentials), type breakdown bars, zone occupancy, latest tickets table
2. Venda & Emissão — full sales form with 16 ticket types, 8 payment methods, coupon validation, server-side price calc
3. Credenciamento — credential CRUD for 10 types (Participant/Staff/Sponsor/Press/Authority/etc.), zone assignment, print tracking
4. Controle de Acesso — QR scanner simulation (typed input), zone capacity grid, real-time access log, calls /api/tickets/checkin
5. Inscrições Esportivas — sports data form (category/distance/team/shirt size/medical cert/terms) + filtered athlete table
6. Transferências & Reembolsos — transfer form, cancel/refund form, history with approve/reject
7. IA & Analytics — Gemini-powered insights via /api/ai/ticketing-insights, 6 KPI insight cards, revenue projection chart

## Backend routes added (server.ts)
- `POST /api/tickets/buy` — extended to persist paymentMethod, couponCode, discountAmount, sports fields; server-side coupon validation; server-side pricing
- `POST /api/tickets/transfer` — tenant ownership check; blocks checked-in/cancelled tickets
- `POST /api/tickets/cancel` — idempotent (409 on repeat); blocks checked-in tickets; tenant ownership check; creates finance EXPENSE entry once
- `POST /api/ai/ticketing-insights` — passes ticketing snapshot to Gemini 2.0 Flash

## Types added (src/types.ts)
New enums: PaymentMethod (8), PaymentStatus (5), CredentialType (10), AccessZoneType (9), RefundStatus (5)
Extended Ticket interface with ~20 optional fields (sports, payment, credential, transfer/cancel)
New interfaces: Credential, AccessZone, TicketTransfer

## Key decisions
**Why server-side pricing:** Client sends coupon/type but server recomputes final price from trusted rules. Coupon codes are validated server-side against a hardcoded map (real prod: DB lookup).

**Why tenant ownership guard:** transfer and cancel routes check req.body.tenantId vs ticket.tenantId to prevent IDOR — any caller knowing a QR code could mutate another tenant's ticket without this.

**Why idempotency on cancel:** Without the cancelledAt guard, repeated POSTs would append multiple refund EXPENSE finance entries.

## Props contract
```tsx
interface Props {
  events: Event[];
  tickets: Ticket[];         // from /api/db — all tickets
  finance: FinanceTransaction[];
  selectedEventId: string;
  selectedTenantId: string;
  onSelectEvent: (id: string) => void;
  onRefresh: () => void;      // re-fetches /api/db
}
```

## Seed data
Credentials and AccessZones are seeded in-component (local state) — not persisted to db.json. Transfers are partially seeded. Access log is seeded in local state.
