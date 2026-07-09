---
name: Lotes & Financial Plan Routes
description: Architecture decisions for the ticket batches, categories, financial planning, and cost template API routes added in V8.2.
---

## Key decisions

**Tenant isolation helper**: `assertEventOwnership(eventId, user)` — checks `events.tenant_id = user.tenantId` unless SUPER_ADMIN. Must be called at the top of every route that touches event-scoped data.

**Auto-switch logic**: On GET `/api/events/:id/batches`, status is recalculated from date/sold count. When a batch transitions to SOLD_OUT or EXPIRED and `auto_next=true`, the next SCHEDULED batch in the same category (by sort_order) is activated.

**sold_count tracking**: Ticket purchase (`POST /api/tickets/buy`) increments `ticket_batches.sold_count` via `UPDATE ... SET sold_count = sold_count + 1` when `batchId` is provided.

**Response format**: All new routes return camelCase via dedicated mappers: `mapCategory`, `mapBatch`, `mapCostTemplate`, `mapRevenue`, `mapExpense`, `mapCoupon`. POST/PUT must call the mapper before `res.json()`.

**Why:** Code review found IDOR vulnerability (no tenant scope on UPDATE/DELETE), raw snake_case responses breaking the React components, and sold_count never being updated.

**How to apply:** Any new route touching categories/batches/financial-plan must (1) call assertEventOwnership first, (2) scope WHERE clauses by both resource id AND event_id, (3) return mapped camelCase.
