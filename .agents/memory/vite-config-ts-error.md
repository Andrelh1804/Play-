---
name: Pre-existing Vite config TypeScript error
description: The vite.config.ts has a type mismatch that shows in tsc --noEmit but does NOT affect runtime
---

## The Error

```
vite.config.ts: error TS2769: Type 'boolean' is not assignable to type 'true | string[]' (server.allowedHosts)
```

**Why it exists:** The vite.config.ts uses `allowedHosts: true` (or `allowedHosts: false`) but the Vite type definition only accepts `true | string[]`. This is a quirk of the Vite 6 type definitions.

**Impact:** None on runtime. Vite and tsx both accept the config and run correctly. The app starts and serves on port 5000 without issues.

**How to apply:** Do NOT try to "fix" this unless explicitly asked by the user. The fix would be to change `allowedHosts: boolean` to `allowedHosts: true` in the config, but that could break host-blocking behavior in production.
