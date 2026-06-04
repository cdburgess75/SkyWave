# SKYWAVE — Engineering Handoff

**Project:** SKYWAVE · Shortwave Band Guide (offline-first PWA-style single-file web app)
**Artifact:** `index.html`
**Version at handoff:** v0.6
**Date:** June 2026
**Primary user / owner:** Dave — licensed amateur operator (IC-7300), SWL/DX, Loranger LA. Army Signal Corps background. Thinks in UTC.
**Purpose of this doc:** Hand the project to Claude Code (and a Git repo) with enough detail that a fresh agent can extend it safely without re-reverse-engineering anything.

---

## 0. TL;DR for the next agent (read this first)

- It is **one self-contained HTML file**. No build step, no framework, no external JS/CSS. ~72 KB.
- **Vanilla JS in `"use strict"`**, all inside a single `<script>` at the bottom of the file.
- **Offline-first is the prime directive.** Everything except live network features (EiBi auto-update, POTA/SOTA spots) must work with the radio off and the phone in airplane mode.
- **State persists in `localStorage`** under `skywave_*` keys (see §6). All access is wrapped in `try/catch`.
- **Dynamic rows use event delegation** from `document` on `[data-act]` attributes; row payloads ride in `data-*` attributes (escaped via `attr()`).
- **To test:** Node + jsdom smoke harness (see §9). There is no in-repo test suite yet — adding one is roadmap item R4.
- **Do not** add third-party libraries, break the single-file model, or introduce `localStorage` usage that isn't `try/catch`-guarded, unless you are deliberately executing the PWA refactor (R2).
- **Known sharp edge:** live features fail inside in-app browsers (e.g. the Claude app preview) because those webviews block `fetch`. The app now detects/explains this. Real Safari (or any hosted HTTPS deploy) is required for live data.

---

## 1. What the app is

A communications-receiver-styled (amber phosphor on black, monospace) reference + logging tool for shortwave listening and ham field operation. Think "TV Guide for shortwave" plus an operating logbook plus field tools.

Five top-level tabs:

1. **Listen** — the broadcast schedule (On Air / Search / By Freq)
2. **Log** — operating layer (Logbook / Favorites / My Freq)
3. **Tools** — Antenna calculator / Grayline & band planner / Export & print
4. **Spots** — live POTA & SOTA activations
5. **Ref** — schedule update/load + band tables + code key

Two-level navigation: top tab bar, plus a segmented sub-control on tabs that hold genuinely distinct lists (Listen, Log) and a program toggle on Spots (POTA/SOTA).

---

## 2. How to run & deploy

### For the user (current method — portable single file)

1. Open `index.html` in **Safari** (not an in-app preview).
2. **Share → Add to Home Screen** → launches full-screen like a native app.
3. Everything offline works immediately. Live spots + EiBi auto-update require a connection.

### Why Safari specifically

In-app webviews (Claude app preview, Messages preview, etc.) sandbox outbound `fetch`, so live data silently fails there. The app now surfaces a clear message telling the user to open in Safari. **This is a platform limitation, not a bug.**

### Recommended hosting (enables the PWA path — roadmap R2)

Drop the file on any static HTTPS host (GitHub Pages, Cloudflare Pages, Netlify, or PARATECH web space). Hosting over HTTPS is a prerequisite for a service worker, which gives durable offline storage (mitigates iOS ITP eviction) and a real installable PWA.

---

## 3. Architecture

### File layout (within the single HTML)

```
<head>
  <meta> viewport / apple-mobile-web-app-* / theme-color
  <style>  ... all CSS (CSS custom props in :root) ...
<body>
  <div class="wrap">
    <header> brand + UTC/local clocks + dbstat + nav.tabs
    <section id="tab-listen"> seg + sub-now / sub-search / sub-freq
    <section id="tab-log">    seg + sub-logbook / sub-stars / sub-mine
    <section id="tab-tools">  antenna card / grayline card / export card
    <section id="tab-spots">  seg(POTA/SOTA) + chips + filter + rows
    <section id="tab-ref">    loadbox(update) + band tables + code key
    <div id="printArea">      (hidden; filled on demand for print)
  <div class="modal" id="logModal"> log entry sheet
  <div class="toast" id="toast">
  <script> ... entire app ...
```

### Design language

- Colors are CSS custom properties in `:root` (`--amber`, `--green`, `--ink`, `--panel`, …). Change the theme there.
- Font stack is monospace-first (`"SF Mono", ui-monospace, Menlo, …`) — chosen so it renders with character **offline** (no web fonts). On iOS this resolves to SF Mono/Menlo.
- `@media print` hides all chrome and renders only `#printArea` as black-on-white.

### Data flow

```
buildBase() = TIME stations (built-in) + MINE (user custom)   ── always present
EIBI[]      = parsed EiBi schedule (loaded/updated; may be empty)
DATA        = buildBase().concat(EIBI)        ← single source the Listen tab reads
rebuildData() recomputes DATA + filters + re-renders
```

- `entry(freq,time,days,itu,station,lang,target,tx,src)` is the normalized record. `parseTime()` precomputes integer `start`/`end` HHMM.
- Listen renders from `DATA`. Spots render from `SPOTS[prog].list` (separate pipeline).
- Rows are rendered by full `innerHTML` replacement (no diffing). Fine at these sizes; Search caps at 1200 rows.

### No build, no modules

Intentional for portability. The cost is that testing/diffing is whole-file. Refactor-to-modules-with-a-bundler-that-still-emits-one-file is roadmap R4.

---

## 4. Feature reference (by tab)

### 4.1 Listen

- **On Air** (`refreshNow`): filters `DATA` by `onAir(e)`; sorts by frequency; shows live UTC. Quick chips (All / ★ Favorites / English / Spanish / French) + free-text filter + meter-band dropdown. Auto-re-renders every 30 s while visible.
- **Search** (`refreshSearch`): full-text over station/lang/country/target + band/lang/target dropdowns. Capped at 1200 results.
- **By Freq** (`refreshFreq`): enter kHz or MHz; shows entries within ±2/5/10 kHz, on-air first. The "I hear something on 9.420, who is it?" workflow.
- **Mode badges** via `modeOf(e)` (DRM / CW / TIME / USB / LSB / DATA), inferred from lang/tx/station text.

### 4.2 Log

- **Logbook** (`renderLog`, `openLog`, `saveLog`): entries stored in `LOG[]`. Modal fields: Date(UTC), Time(UTC), Freq, **Mode**, Station/call, **RST/SINPO**, **Reference**, Notes. `+ New entry` and `Export CSV`.
- **Favorites** (`toggleFav`, `renderStars`): star any listing; `FAVS[]` stores enough to re-render and recompute on-air. Favorites that are on the air are highlighted.
- **My Freq** (`addMine`, `renderMine`, `delMine`): user custom frequencies merged into `DATA` (src `"mine"`, amber left-bar). `+ Add LA regional example set` seeds 3.856/7.256/14.156 (editable/deletable).
- **CSV export** (`exportLogCSV`): columns `date_utc, time_utc, freq_khz, mode, station, reference, rst_sinpo, notes`.

### 4.3 Tools

- **Antenna calculator** (`calcAnt`): input MHz or kHz (auto-detect: ≥1000 ⇒ kHz). Outputs:
  - Wavelength λ(m) = `300 / f_MHz`
  - ½-wave dipole = `468 / f_MHz` ft (`142.5 / f_MHz` m); each leg = half
  - ¼-wave vertical = `234 / f_MHz` ft
  - Full-wave loop = `1005 / f_MHz` ft
  - Static doublet/balun cheat-sheet (135/88/44 ft; 4:1 Guanella vs 1:1 current balun).
- **Grayline & band planner** (`sunTimes`, `renderGray`, `renderAdvise`): SunCalc-derived solar algorithm, **fully offline**, computed from `GEO {lat,lng}` (default Loranger 30.61/-90.36). Shows sunrise/sunset/solar-noon (UTC + local), day length, current state (☀/☾/◐ grayline), and rule-of-thumb band advice.
- **Export & print** (`onAirText`, `bandCardText`, `doPrint`): copy on-air list to clipboard, download a band card `.txt`, or print a clean reference card.

### 4.4 Spots (live)

- **POTA** and **SOTA** via `getSpots(prog)` → `normPota` / `normSota` → `SPOTS[prog] = {list, ts}` → cached in `localStorage`.
- Whole row is tappable (`data-act="spotlog"`) → `logFromSpot()` opens a **prefilled log** (freq, callsign, mode, reference, UTC date/time, default RST 599 CW-or-data / 59 phone, auto notes line). Confirm-and-save.
- Mode chips (All / CW / Phone / Data) + free-text filter. Auto-refresh every 60 s while visible and online. Stale spots (>45 min) faded.
- `spotStatus` ∈ `{"", "loading", "failed", "offline"}` drives the status label and empty-state messaging.

### 4.5 Ref

- **EiBi update** (`doUpdate`, `fetchSchedule`, `seasonCode`, `seasonList`): one-tap update, season auto-detect, manual season override, manual file load fallback, auto-update-on-launch toggle, "last updated / stale" indicator, network dot.
- **Reference tables**: SW broadcast meter bands, US amateur HF bands, time/frequency standards, language & target-area code key.

---

## 5. Data sources & external contracts

### 5.1 EiBi shortwave schedule

- **Source:** `http://www.eibispace.de/dx/sked-<code>.csv`
- **Season code** (`seasonCode`): `a` = summer (≈ last Sun Mar → last Sun Oct), `b` = winter; 2-digit year. e.g. `a26`, `b26`.
- **CSV format** (semicolon, ≥11 fields). `parseEibi` maps:
  `[0]=freq(kHz) [1]=time"HHMM-HHMM" [2]=days [3]=ITU [4]=station [5]=lang [6]=target [7]=tx`.
- `loadText` rejects files with <20 parsed entries and caches raw text if <4.5 MB.

### 5.2 POTA (Parks on the Air)

- **Endpoint:** `GET https://api.pota.app/spot/activator` → JSON array.
- **Fields used** (`normPota`): `activator, frequency` (kHz string), `mode, reference`, `name`/`parkName`, `spotTime` (ISO **without** Z — must append `"Z"`), `comments, locationDesc`.

### 5.3 SOTA (Summits on the Air)

- **Endpoints tried in order:** `https://api-db2.sota.org.uk/api/spots/40/all`, `https://api2.sota.org.uk/api/spots/40/all`, `https://api2.sota.org.uk/api/spots/40/`.
- **Fields used** (`normSota`): `activatorCallsign`||`activator`, `frequency` (**MHz** → ×1000 for kHz), `mode` (lowercase → upper), `summitCode`, `summitDetails`||`summitName`, `timeStamp`, `comments, associationCode`.

### 5.4 CORS relays — `relays(rawUrl)`

Tried in order: **direct** → `api.allorigins.win/raw` → `corsproxy.io` → `thingproxy.freeboard.io`.
Used for EiBi update **and** spots. **This is the single biggest fragility** (see Compromise C1).

---

## 6. localStorage schema

All keys defined in the `K` object. All reads/writes via `loadJSON`/`saveJSON` (try/catch).

| Key                    | Shape                                                             | Notes                  |
|------------------------|-------------------------------------------------------------------|------------------------|
| `skywave_eibi_raw_v1`  | string (raw CSV)                                                  | cached only if <4.5 MB |
| `skywave_eibi_meta_v1` | `{code, ts, count}`                                               | freshness/season display |
| `skywave_favs_v1`      | `[{freq, station, time, lang?, target?, itu?}]`                   | favorites              |
| `skywave_log_v1`       | `[{date, time, freq, mode, station, sinpo, ref, notes, created}]` | logbook                |
| `skywave_mine_v1`      | `[{freq, mode, station, time, days, lang, target, notes}]`        | user frequencies       |
| `skywave_geo_v1`       | `{lat, lng, label}`                                               | grayline location      |
| `skywave_prefs_v1`     | `{autoUpd}`                                                       | preferences            |
| `skywave_pota_v1`      | `{list:[...], ts}`                                                | last POTA batch        |
| `skywave_sota_v1`      | `{list:[...], ts}`                                                | last SOTA batch        |

**Versioning:** all `_v1`. A *breaking* schema change must bump the key and add a migration.

---

## 7. Key algorithms (documented)

### On-air determination — `onAir(e, date)`

- Parse `start`/`end` HHMM integers.
- 24 h if `start===end` or `0000-2400`.
- If `start < end`: on when `start ≤ now < end`.
- If wraps midnight (`start > end`): evening portion checked against today's weekday; post-midnight against yesterday's weekday (EiBi day codes refer to the *start* day).
- Day-of-week via `dayAllowed(daysStr)` → returns a `Set` of EiBi weekday numbers (1=Mon … 7=Sun) or `null` (= all days). **Permissive**: irregular/complex codes (`1.Sa`, `Last7`, `irr`, `alt`, …) return `null` so the entry is *shown* rather than wrongly hidden.

### Season detection — `seasonCode(date)`

See §5.1. `seasonList()` returns the current code plus neighbours for the manual override dropdown.

### Solar / grayline — `sunTimes(date, lat, lng)`

Compact SunCalc core (Agafonkin): Julian day → solar mean anomaly → ecliptic longitude → declination → hour angle at `h0 = -0.833°` → sunrise/sunset/solar-noon as `Date`s. Returns `{polar:"day"|"night"}` for polar edge cases. `renderAdvise(isDay, nearGray)` builds rule-of-thumb band guidance; `nearGray` = within 50 min of sunrise/sunset.

### Fetch strategy — `fetchSchedule(code)` / `getSpots(prog)`

Loop candidate URLs × `relays()`; first response that parses and passes a sanity check wins. Returns `null` on total failure → caller keeps cached data and shows guidance.

---

## 8. Coding conventions & gotchas

- **No external dependencies, ever** (unless executing R2/R4 deliberately).
- **Frequencies are normalized to kHz internally.** Display via `fmtFreq` (renders MHz when ≥1000 kHz) + `freqUnit`.
- **All times are UTC.** Device clock drives on-air status. **POTA `spotTime` has no `Z`** — you must append it or it parses as local time.
- **HTML escaping:** `esc()` for text content, `attr()` for attribute values. Always escape user/data-derived strings.
- **Event delegation:** dynamic rows do not bind listeners individually. A single `document` click handler reads `closest("[data-act]")` and dispatches on `dataset.act`.
- **Testability quirk:** top-level `let`/`const`/class bindings are **not** on `window`; only `function` declarations are. Tests assert on DOM effects, or expose a namespace object for unit testing internals (consider doing this in R4).
- **localStorage in previews:** wrap everything in try/catch (already done) so the app degrades to in-memory if storage is blocked.
- Keep the **offline-first** contract: a new feature that needs the network must cache its last result and render a sensible offline/failed state.

---

## 9. Testing (current approach + how to formalize)

There is **no committed test suite yet** (Compromise C11). During development we used Node + jsdom smoke tests. Reproduce like this:

```bash
npm i -D jsdom
```

```js
// test/smoke.mjs  — run: node test/smoke.mjs
import fs from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";

const html = fs.readFileSync("index.html", "utf8");
const js = html.split("<script>")[1].split("</script>")[0];

// 1) syntax
new Function(js); // throws on syntax error

// 2) every getElementById has a matching id=""
const ids = [...js.matchAll(/getElementById\(["']([^"']+)["']\)/g)].map(m => m[1]);
const present = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const missing = [...new Set(ids)].filter(id => !present.has(id));
if (missing.length) throw new Error("Missing IDs: " + missing);

// 3) boot + flows in jsdom (stub localStorage, mock fetch, assert on DOM)
const vc = new VirtualConsole();
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.localStorage = (() => { let s = {}; return {
      getItem: k => k in s ? s[k] : null, setItem: (k,v)=>{s[k]=String(v)},
      removeItem: k => { delete s[k] }, clear: () => { s = {} } }; })();
    Object.defineProperty(w.navigator, "onLine", { value: true, configurable: true });
    w.fetch = (url) => Promise.resolve({ ok: true, text: () => Promise.resolve("[]") });
    w.print = () => {}; w.URL.createObjectURL = () => "x"; w.URL.revokeObjectURL = () => {};
  }
});
// then: dom.window.document...click()/dispatchEvent and assert innerHTML
```

**Pure functions worth unit-testing first** (refactor them to be importable in R4): `seasonCode`, `dayAllowed`, `onAir`, `parseTime`, `sunTimes`, `normPota`, `normSota`, `parseEibi`, the antenna math.

---

## 10. Compromises & known limitations

- **C1 — Live data depends on public CORS relays.** Can rate-limit or disappear. Mitigation: self-hosted relay (R6).
- **C2 — In-app browsers block `fetch`.** Live features only work in real Safari / a hosted PWA.
- **C3 — Single file, no modules/build.** Great for portability; bad for diffs and testing granularity. (R4)
- **C4 — `localStorage` only (~5 MB).** Raw EiBi cache guarded at <4.5 MB. Should move to IndexedDB. (R3)
- **C5 — EiBi `.txt` fallback parser is heuristic.** CSV is the supported path. (R3)
- **C6 — No schema versioning/migration.** Additive changes are safe; a breaking change needs a key bump + migration. (R5)
- **C7 — Day-of-week parser is intentionally permissive.** Irregular codes shown, not precisely scheduled.
- **C8 — Spot frequencies are spotter-submitted.** Only `isFinite && >0` validation. Trust your ears.
- **C9 — Antenna math uses classic 468/234/1005 approximations.** Ignores height, wire diameter, velocity factor.
- **C10 — Grayline advice is rule-of-thumb, not a propagation model.**
- **C11 — No committed automated tests.** (R4)
- **C12 — Accessibility not audited.** (R8)
- **C13 — iOS storage eviction.** Non-PWA web content / `file://` can be evicted by ITP. (R2)
- **C14 — Default location is hard-coded to Loranger.** "Use my location" overrides and persists.

---

## 11. Changelog

- **v0.1** — Initial offline guide: manual EiBi CSV load; On Air / Search / By Freq / Bands; built-in time-standard stations + band reference.
- **v0.2** — Online EiBi auto-update: season auto-detect, relay fallback, offline cache, last-updated/stale indicator, auto-update-on-launch toggle.
- **v0.3** — Major expansion: **Listen / Log / Tools / Ref** with sub-navigation. Day-of-week accuracy, mode badges, quick chips; **Logbook + Favorites + My Freq**; **antenna calculator**; **grayline/band planner**; **export/print**.
- **v0.4** — **Spots tab**: live POTA & SOTA via relay fallback, caching, mode/text filters, auto-refresh, stale fading.
- **v0.5** — In-app-browser awareness: clear "open in Safari" guidance on fetch failure; status-aware empty states.
- **v0.6 (current)** — **Spot → prefilled log** (whole-row tap → one-confirm save). Log schema gains **Mode** + **Reference**; CSV export gains those columns; unified logging entry points; consolidation pass.

---

## 12. Revision roadmap

**Milestone: Logging polish (v0.7)**
- **R1 — ADIF export.** Add an ADIF (`.adi`) export alongside CSV so hunts import straight into POTA/SOTA/LoTW/QRZ. Map: `QSO_DATE, TIME_ON, FREQ(MHz), MODE, CALL, RST_SENT, SIG_INFO`/`MY_SIG`/`POTA_REF`/`SOTA_REF`, `COMMENT`. *Highest value-per-effort.*
- **R1b — Logbook edit** (currently delete-only) and **RST sent/received split**.

**Milestone: Durable offline / installable (v0.8)**
- **R2 — PWA.** Add `manifest.webmanifest` + service worker. Requires HTTPS hosting.
- **R3 — IndexedDB for the schedule.** Move EiBi raw/parsed data out of `localStorage`.

**Milestone: Maintainability (v0.9)**
- **R4 — Modularize + build + tests.** ES modules + esbuild/vite still emitting one file; Vitest unit tests for pure functions.
- **R5 — Schema versioning/migration.**

**Milestone: Reliability & features (v1.0)**
- **R6 — Self-hosted CORS relay** (Cloudflare Worker).
- **R7 — Spot extras:** distance/bearing, audible alert, band-mode quick filters.
- **R8 — Accessibility pass.**
- **R9 — Embedded font** (optional).
