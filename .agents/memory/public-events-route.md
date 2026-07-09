---
name: Public events listing route
description: GET /api/public/events added to server.ts for the landing page vitrine
---

# Public events listing route

## Rule
`GET /api/public/events` must be declared BEFORE `GET /api/public/events/:slug` in server.ts, or Express will match `:slug = "events"` on the list path.

## Current query
Selects: id, name, slug, type, date, location, city, state, capacity, ticket_price, image_url, hero_image, organizer, status  
Filter: `status = ANY(PUBLIC_EVENT_STATUSES) AND deleted_at IS NULL`  
Ordered by date ASC, LIMIT 100.

## Important
- The `events` table has NO `time` column (only `date`). Querying `time` causes a 500.
- There is NO `sales_enabled` column either — filter by status only for now.
- PUBLIC_EVENT_STATUSES = ["PUBLISHED", "ACTIVE", "PRODUCTION"]

**Why:** Trying to SELECT a non-existent column returns `{"error":"column \"time\" does not exist"}` with 500. Always verify columns against `information_schema.columns` before adding to SELECT.
