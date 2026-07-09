---
name: Lotes merged into Ticketing Enterprise
description: The "lotes" standalone tab was removed and LotesCupons is now a sub-tab inside TicketingEnterprise
---

# Lotes merged into Ticketing Enterprise

## Rule
"lotes" no longer exists as a top-level tab in App.tsx. Any code that references `activeTab === "lotes"` or adds "lotes" to rolePermissions is incorrect.

## What was done
- Removed `{ id: "lotes", ... }` from the sidebar items array in App.tsx
- Removed "lotes" from ALL rolePermissions entries (was in ALL_NEW_MODULES and "Financeiro" and "Gestor do Evento")
- Removed `{activeTab === "lotes" && <LotesCupons .../>}` render block from App.tsx
- Removed `import LotesCupons from "./components/LotesCupons"` from App.tsx
- Added `import LotesCupons from "./LotesCupons"` to TicketingEnterprise.tsx
- Added "lotes" to `Tab` type in TicketingEnterprise.tsx
- Added `{ id: "lotes", icon: <Tag size={13} />, label: "Categorias & Lotes" }` to TABS array (3rd position)
- Added `{tab === "lotes" && <LotesCupons events={events} selectedEventId={selectedEventId} selectedTenantId={selectedTenantId} onRefresh={onRefresh} />}` render block

**Why:** V8.3 FASE 7 and V8.4 require Ticket Enterprise to unify Lotes, Cupons, Check-in, Credenciamento in one module. Having "lotes" as both a sidebar item AND inside TicketingEnterprise was a duplicate.
