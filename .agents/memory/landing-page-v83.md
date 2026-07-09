---
name: LandingPage V8.3/V8.4 redesign
description: Notes on the full LandingPage.tsx rewrite implementing Master Prompts V8.3 and V8.4
---

# LandingPage V8.3/V8.4 redesign

## What changed
- Completely rewrote `src/components/LandingPage.tsx`
- Removed fake metrics section (R$48M+, 1.5M+ tickets, 15+ portais — all fabricated)
- Added `PublicEvent` interface and `useEffect` fetch from `/api/public/events`
- Added events vitrine section (#eventos): search bar, type filter buttons, event cards with image/date/city/price/badges, "Ver"/"Comprar" buttons linking to `/e/{slug}`
- Added institutional section (#sobre): Quem somos, Missão, Visão, Valores + Benefícios list + FAQ accordion
- Added contact/demo section (#contato): contact info + demo request form (local state, no backend wiring)
- Updated nav links: Eventos, Plataforma, Tecnologia, Sobre, Contato
- Footer expanded with 4-column grid (brand, platform links, company links, copyright)

## Why
V8.3 FASE 2 (event vitrine), FASE 5 (remove fake metrics, add institutional section), V8.4 FASE 1 (audit/fix inconsistencies).

## How to apply
- Props remain `{ onEnter: () => void }` — no breaking change in App.tsx call site
- Events vitrine shows empty state with CTA when no published events exist
- Demo form is purely local state — no backend endpoint wired (future task)
