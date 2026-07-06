---
name: Dashboard integration pattern
description: How DashboardExecutivo is integrated, props it needs, and the dark mode/notification wiring approach.
---

## DashboardExecutivo integration

DashboardExecutivo receives 17 props from App.tsx:
events, filteredEvents, filteredFinance, filteredLeads, filteredStaff,
filteredCampaigns, filteredContracts, tickets, sponsorships,
selectedTenantId, activeTenant, selectedRole,
totalIncome, totalExpense, netBalance, finance,
setActiveTab, handleSendAiMessage, onRefresh

**Why:** Monolithic App.tsx had ~200 lines of inline executive dashboard inside a ternary; extracted to DashboardExecutivo.tsx for maintainability.

**How to apply:** Edit DashboardExecutivo.tsx for KPI/chart changes. Update both props interfaces when adding new data.

## Dark mode wiring

useEffect toggles `dark` class on `document.documentElement` when darkMode state flips. Root div dynamically switches bg/text classes. Tailwind dark: variants not yet applied across sub-components.

## Notification center

Dropdown uses `data-notifications` attribute for outside-click detection. useEffect registers Escape + mousedown listeners only while open (cleanup on close). Accessible: aria-label, aria-expanded, aria-haspopup, role="dialog".
