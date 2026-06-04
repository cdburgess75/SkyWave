# SKYWAVE — Architecture

> See also: `HANDOFF.md` §3 and §7 for the canonical reference. This document expands on those sections.

## Guiding constraints

1. **Single file** — `index.html` contains all HTML, CSS, and JS. No build step, no bundler, no CDN links. The file must be usable by double-clicking it in Finder.
2. **Offline-first** — Every feature that does not *require* a live network connection must work without one. Network features (EiBi update, POTA/SOTA spots) must cache their last result and render a meaningful offline/failure state.
3. **No runtime dependencies** — Zero third-party libraries loaded at runtime. Dev-only tools (`jsdom` for tests) are fine.
4. **`"use strict"`** — The entire script block runs in strict mode.

## High-level structure

```
index.html
├─ <head>
│   ├─ <meta>   viewport, apple-mobile-web-app-*, theme-color
│   └─ <style>  all CSS (CSS custom properties in :root for theming)
└─ <body>
    ├─ .wrap
    │   ├─ <header>          brand · UTC/local clocks · dbstat · nav.tabs
    │   ├─ #tab-listen       seg · sub-now / sub-search / sub-freq
    │   ├─ #tab-log          seg · sub-logbook / sub-stars / sub-mine
    │   ├─ #tab-tools        antenna card · grayline card · export card
    │   ├─ #tab-spots        seg(POTA/SOTA) · chips · filter · rows
    │   └─ #tab-ref          loadbox · band tables · code key
    ├─ #printArea            hidden; filled on demand for @media print
    ├─ #logModal             log entry sheet (modal overlay)
    ├─ #toast                transient notification
    └─ <script>              entire application (~72 KB at v0.6)
```

## Data pipeline

```
buildBase()
  └─ TIME stations (hard-coded)     ← always present, even offline
  └─ MINE (user custom freqs)       ← from localStorage

EIBI[]  ← parseEibi(raw CSV)        ← from localStorage or fetched on demand

DATA = buildBase().concat(EIBI)     ← single source of truth for Listen tab

rebuildData()                       ← recomputes DATA + filters + re-renders
```

Spots (`POTA` / `SOTA`) flow through a separate pipeline:

```
getSpots(prog)
  └─ fetchSchedule / fetch relays
  └─ normPota / normSota
  └─ SPOTS[prog] = {list, ts}       ← cached to localStorage
  └─ renderSpots()
```

## Rendering model

- Full `innerHTML` replacement per view; no virtual DOM, no diffing.
- Capped at 1200 rows in Search to avoid browser jank.
- **Event delegation**: a single `document` click handler reads `closest("[data-act]")` and dispatches on `dataset.act`. Dynamic row payloads travel in `data-*` attributes, escaped via `attr()`.

## State management

All persistent state lives in `localStorage` under `skywave_*` keys (see `HANDOFF.md` §6). Access is always wrapped in `try/catch` so the app degrades gracefully when storage is blocked (private-browsing, in-app webviews).

In-memory state: `DATA`, `EIBI`, `LOG`, `FAVS`, `MINE`, `GEO`, `PREFS`, `SPOTS`.

## Theming

CSS custom properties in `:root`:

| Property     | Role                        |
|--------------|-----------------------------|
| `--amber`    | primary text / highlights   |
| `--green`    | secondary accent            |
| `--ink`      | background                  |
| `--panel`    | card / panel background     |
| `--dim`      | de-emphasized text          |
| `--border`   | borders / dividers          |

Font stack: `"SF Mono", ui-monospace, Menlo, Consolas, monospace` — all system fonts, zero network requests.

## Key algorithms

### `onAir(e, date)` — is an entry broadcasting right now?

1. Parse `start` / `end` as HHMM integers.
2. `start === end` or `0000–2400` → 24-hour broadcast.
3. `start < end` → on when `start ≤ now < end`.
4. `start > end` (wraps midnight) → evening portion checked against today's EiBi weekday; post-midnight portion against yesterday's (because EiBi day codes name the *start* day).
5. `dayAllowed(daysStr)` → `Set<number>` (1=Mon … 7=Sun) or `null` (all days). Intentionally permissive for irregular codes.

### `sunTimes(date, lat, lng)` — offline solar calculation

Compact SunCalc (Agafonkin algorithm): Julian day → mean anomaly → ecliptic longitude → declination → hour angle at `h0 = −0.833°` → `Date` objects for sunrise / solar-noon / sunset. Polar edge cases return `{polar: "day"|"night"}`.

### `fetchSchedule(code)` / `getSpots(prog)` — resilient fetch

Iterates candidate base URLs × relay wrappers; first response passing a sanity check (EiBi: >200 `;`; spots: non-empty array) wins. Returns `null` on total failure.

## Adding a new feature — checklist

- [ ] Does it need the network? → cache the last result; render an offline/failed state.
- [ ] Does it write to `localStorage`? → wrap in `try/catch`; use a `skywave_*` key; document in `HANDOFF.md` §6.
- [ ] Does it add a dynamic row? → use `data-act` + `attr()` escaping; wire to the delegation handler.
- [ ] Does it change the log schema? → ask before doing it; bump the key if breaking.
- [ ] Does it introduce a third-party library? → don't, unless executing a named roadmap item.
