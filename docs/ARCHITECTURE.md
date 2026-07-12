# SKYWAVE — Architecture

> See also: `HANDOFF.md` §3 and §7 for the canonical reference. This document expands on those sections.

## Guiding constraints

1. **Single file** — `index.html` contains all HTML, CSS, and JS. No build step, no bundler, no CDN links. The file must be usable by double-clicking it in Finder.
2. **Offline-first** — Every feature that does not *require* a live network connection must work without one. Network features (EiBi update, live nets, K-index) must cache their last result and render a meaningful offline/failure state.
3. **No runtime dependencies** — Zero third-party libraries loaded at runtime. Dev-only tools (`jsdom` for tests) are fine.
4. **`"use strict"`** — The entire script block runs in strict mode.

## High-level structure

```
index.html
├─ <head>
│   ├─ <meta>   viewport, apple-mobile-web-app-*, theme-color, description/og
│   └─ <style>  all CSS (custom properties in :root; [data-theme="light"] overrides)
└─ <body>
    ├─ #layout
    │   ├─ nav.sidenav        desktop sidebar (≥860 px)
    │   ├─ .wrap
    │   │   ├─ <header>       brand · #hdrGrid (Maidenhead) · UTC/local clocks · dbstat
    │   │   ├─ #tab-listen    seg · sub-now / sub-search / sub-freq / sub-nets
    │   │   ├─ #tab-log       seg · sub-stars / sub-mine        ← “Saved” tab (historical ID)
    │   │   ├─ #tab-tools     antenna card · grayline card · export card
    │   │   ├─ #tab-ref       display card · loadbox (EiBi update) · band tables · code key
    │   │   ├─ #tab-prop      status banner · solar widget · K-index · link tiles
    │   │   └─ #printArea     hidden; filled on demand for @media print
    │   └─ #rightRail         ≥1280 px: live K-index · grayline · band digest
    ├─ #moreSheet / #moreScrim   mobile “More” bottom sheet (Ref/Prop)
    ├─ nav.bottomnav          mobile bottom nav (Listen/Saved/Tools/More)
    ├─ #wizardModal           3-step first-run location wizard
    ├─ #toast                 transient notification
    └─ <script>               entire application
```

## Data pipeline

```
buildBase()
  ├─ TIME stations (hard-coded)     ← always present, even offline
  ├─ NETDIR major scheduled nets    ← hard-coded, offline, on-air aware
  └─ MINE (user custom freqs)       ← from localStorage

EIBI[]  ← parseEibi(raw CSV)        ← from localStorage or fetched on demand

DATA = buildBase().concat(EIBI)     ← single source of truth for Listen tab

rebuildData()                       ← recomputes DATA + pre-computed search blobs
                                      + filter dropdowns + re-renders everything
```

Live nets (NetLogger) flow through a small separate pipeline — they are
transient “in session” state, not schedule entries:

```
openNets(force)
  └─ getNets()                      ← NetLogger API × relay chain
  └─ parseNets()                    ← tolerant: JSON or ~/| delimited
  └─ NETS = {list, ts}              ← cached to localStorage (skywave_nets_v1)
  └─ renderNets()                   ← live rows + built-in NETDIR rows below
```

## Rendering model

- Full `innerHTML` replacement per view; no virtual DOM, no diffing.
- Search capped at 1200 rows to avoid jank; the count shows the true total.
- **Event delegation**: a single `document` click handler reads
  `closest("[data-act]")` and dispatches on `dataset.act`
  (`fav`, `heard`, `delmine`). Dynamic row payloads travel in `data-*`
  attributes, escaped via `attr()` (`&` first, then `"`).

## State management

All persistent state lives in `localStorage` under `skywave_*` keys (see
`HANDOFF.md` §6). Access is always wrapped in `try/catch` so the app degrades
gracefully when storage is blocked (private browsing, in-app webviews).

In-memory state: `DATA`, `EIBI`, `FAVS`, `MINE`, `GEO`, `PREFS`, `HEARD`, `NETS`.

## Theming

CSS custom properties in `:root`, flipped by `[data-theme="light"]`:

| Property      | Role                          |
|---------------|-------------------------------|
| `--bg`        | page background               |
| `--panel` / `--panel2` | card / sheet backgrounds |
| `--line`      | borders / dividers            |
| `--amber`     | primary accent (brand, freqs) |
| `--green`     | live / positive accent        |
| `--blue`      | grid square accent            |
| `--ink` / `--ink-dim` | text / de-emphasized  |
| `--wkd` / `--wkd-dim` | “heard today” sage greens (scoped) |

Font stack: `"SF Mono", ui-monospace, Menlo, Consolas, monospace` — all system
fonts, zero network requests. `theme-color` meta is updated on theme switch.

## Key algorithms

### `onAir(e, date)` — is an entry broadcasting right now?

1. Parse `start` / `end` as HHMM integers.
2. `start === end` or `0000–2400` → 24-hour broadcast.
3. `start < end` → on when `start ≤ now < end`.
4. `start > end` (wraps midnight) → evening portion checked against today's
   EiBi weekday; post-midnight portion against yesterday's (EiBi day codes
   name the *start* day).
5. `dayAllowed(daysStr)` → `Set<number>` (1=Mon … 7=Sun) or `null` (all days).
   Intentionally permissive for irregular codes.

### `sunTimes(date, lat, lng)` — offline solar calculation

Compact SunCalc (Agafonkin algorithm): Julian day → mean anomaly → ecliptic
longitude → declination → hour angle at `h0 = −0.833°` → `Date` objects for
sunrise / solar-noon / sunset. Polar edge cases return `{polar: "day"|"night"}`.

### `toGrid(lat, lng)` — Maidenhead locator

6-character grid square from decimal coordinates, computed on-device.
Inputs are validated by `validGeo()` (±90 / ±180) before they reach it.

### `fetchSchedule(code)` / `getNets()` — resilient fetch

Iterates candidate base URLs × relay wrappers (`relays()`); first response
passing a sanity check (EiBi: >200 `;`; nets: ≥1 parsed entry) wins. Returns
`null` on total failure so callers keep cached data.

### `parseNets(text)` — tolerant nets parser

Tries JSON first (array or `{nets:[…]}`), then the NetLogger delimited form
(`~` records, `|` fields), locating the frequency field heuristically and
sanity-checking it into a 1.5 MHz – 1.3 GHz window. Unparseable input yields
`[]` — the UI falls back to the cached list.

## Adding a new feature — checklist

- [ ] Does it need the network? → cache the last result; render an offline/failed state.
- [ ] Does it write to `localStorage`? → wrap in `try/catch`; use a `skywave_*` key; document in `HANDOFF.md` §6.
- [ ] Does it add a dynamic row? → use `data-act` + `attr()` escaping; wire to the delegation handler.
- [ ] Does it belong in PileUp instead (logging, spots, ADIF)? → put it there.
- [ ] Does it introduce a third-party library? → don't, unless executing a named roadmap item.
