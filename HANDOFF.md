# SKYWAVE — Engineering Handoff

**Project:** SKYWAVE · Shortwave Band Guide (offline-first PWA-style single-file web app)
**Artifact:** `index.html`
**Version:** v2026.06.04 (CalVer: `YYYY.MM.DD`, `.002` suffix for same-day releases)
**Date:** June 2026
**Primary user / owner:** Dave — licensed amateur operator (IC-7300), SWL/DX, Loranger LA. Army Signal Corps background. Thinks in UTC.
**Purpose of this doc:** Hand the project to Claude Code (and a Git repo) with enough detail that a fresh agent can extend it safely without re-reverse-engineering anything.

---

## 0. TL;DR for the next agent (read this first)

- It is **one self-contained HTML file**. No build step, no framework, no external JS/CSS. ~85 KB.
- **Vanilla JS in `"use strict"`**, all inside a single `<script>` at the bottom of the file.
- **`const VERSION="2026.06.04"` near the top** of the script block. CalVer: `YYYY.MM.DD`; append `.002` for a same-day release.
- **Offline-first is the prime directive.** Everything except live network features (EiBi auto-update, POTA/SOTA spots, Propagation tab content) must work with the radio off and the phone in airplane mode.
- **State persists in `localStorage`** under `skywave_*` keys (see §6). All access is wrapped in `try/catch`.
- **Dynamic rows use event delegation** from `document` on `[data-act]` attributes; row payloads ride in `data-*` attributes (escaped via `attr()`).
- **To test:** `node test/smoke.mjs` — Node + jsdom smoke harness (see §9). All three checks must pass.
- **Do not** add third-party libraries, break the single-file model, or introduce `localStorage` usage that isn't `try/catch`-guarded, unless you are deliberately executing the PWA refactor (R2).
- **Known sharp edge:** live features fail inside in-app browsers (e.g. the Claude app preview) because those webviews block `fetch`. The app now detects/explains this. Real Safari (or any hosted HTTPS deploy) is required for live data.

---

## 1. What the app is

A communications-receiver-styled (amber phosphor on black, monospace) reference + logging tool for shortwave listening and ham field operation. Think "TV Guide for shortwave" plus an operating logbook plus field tools.

Six top-level tabs:

1. **Listen** — the broadcast schedule (On Air / Search / By Freq)
2. **Log** — operating layer (Logbook / Favorites / My Freq)
3. **Tools** — Antenna calculator / Grayline & band planner / Export & print
4. **Spots** — live POTA & SOTA activations
5. **Ref** — schedule update/load + station settings + band tables + code key
6. **Prop** — online-only propagation resources (solar widget, K-index, curated link tiles)

Two-level navigation: top tab bar, plus a segmented sub-control on tabs that hold genuinely distinct lists (Listen, Log) and a program toggle on Spots (POTA/SOTA).

The **header** shows the brand name, UTC/local clocks, dbstat (entry count + version), and an ident row (`#hdrCall` / `#hdrGrid`) that displays the operator callsign and computed Maidenhead grid square whenever both are configured.

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
    <header> brand + ident row (#hdrCall / #hdrGrid) + UTC/local clocks + dbstat + nav.tabs
    <section id="tab-listen"> seg + sub-now / sub-search / sub-freq
    <section id="tab-log">    seg + sub-logbook / sub-stars / sub-mine
    <section id="tab-tools">  antenna card / grayline card / export card
    <section id="tab-spots">  seg(POTA/SOTA) + chips + filter + rows
    <section id="tab-ref">    stationCard (callsign + grid hint) + loadbox(update) + band tables + code key
    <section id="tab-prop">   propStatus banner + solar widget card + K-index card + link tiles
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

- **Logbook** (`renderLog`, `openLog`, `saveLog`, `closeLog`): entries stored in `LOG[]`. Modal fields: Date(UTC), Time(UTC), Freq, Mode, Station/call, **RST Sent**, **RST Rcvd**, Reference, Notes. `editIdx` state variable tracks edit vs new mode. Pencil icon (`data-act="editlog"`) opens modal pre-filled; Save label becomes Update; edit saves in-place preserving `created` timestamp.
- **Favorites** (`toggleFav`, `renderStars`): star any listing; `FAVS[]` stores enough to re-render and recompute on-air. Favorites that are on the air are highlighted.
- **My Freq** (`addMine`, `renderMine`, `delMine`): user custom frequencies merged into `DATA` (src `"mine"`, amber left-bar). `+ Add LA regional example set` seeds 3.856/7.256/14.156 (editable/deletable).
- **CSV export** (`exportLogCSV`): columns `date_utc, time_utc, freq_khz, mode, station, reference, rst_sent, rst_rcvd, notes`.
- **ADIF export** (`exportLogADIF`): ADIF 3.1.4 `.adi` download. Fields: `QSO_DATE, TIME_ON, CALL, FREQ(MHz), MODE, RST_SENT, RST_RCVD, MY_CALL, MY_GRIDSQUARE, POTA_REF` or `SOTA_REF`, `COMMENT`. `POTA_REF` detection: ref matches `/^[A-Z]{1,6}-\d+$/i` (no slash). `SOTA_REF` detection: ref contains `/`. Old entries with `sinpo` field read via `o.rst_sent || o.sinpo` fallback.

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

- **Station settings card** (`#stationCard`): callsign input (`#callIn`) + Save button; persists to `PREFS.call`. `#gridHint` div shows computed 6-char Maidenhead grid with optional place label. Updated whenever GEO changes.
- **EiBi update** (`doUpdate`, `fetchSchedule`, `seasonCode`, `seasonList`): one-tap update, season auto-detect, manual season override, manual file load fallback, auto-update-on-launch toggle, "last updated / stale" indicator, network dot.
- **Reference tables**: SW broadcast meter bands, US amateur HF bands, time/frequency standards, language & target-area code key.

### 4.6 Propagation (online-only)

`renderProp()` is called when the Prop tab is shown. When online it shows a green banner; when offline it shows an amber warning with a pointer to the offline band advice on the Tools tab. No state is stored; no data is fetched by the app itself — all content is image tiles and external links.

- **Solar widget** (`#solarImg`): `<img>` from `hamqsl.com/solar.gif` (designed for embedding; no X-Frame-Options issue).
- **K-index** (`#kIdx`): `<img>` from NOAA SWPC `planetary_k_index.gif`.
- **Link tiles**: Proppy (online MUF tool), VOACAP online, interactive grayline map, WebSDR directory, aurora activity, DX cluster. All open in a new tab.

**Important:** this tab is flagged "needs connection." Do not add cached/offline fallbacks here — keep the offline story clean and explicit.

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
| `skywave_log_v1`       | `[{date, time, freq, mode, station, rst_sent, rst_rcvd, ref, notes, created}]` | logbook — old entries may have `sinpo` instead; read via `o.rst_sent\|\|o.sinpo` |
| `skywave_mine_v1`      | `[{freq, mode, station, time, days, lang, target, notes}]`        | user frequencies       |
| `skywave_geo_v1`       | `{lat, lng, label}`                                               | grayline location      |
| `skywave_prefs_v1`     | `{autoUpd, call}`                                                 | preferences (`call` = operator callsign, blank default) |
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

### Season detection — `seasonCode(date)` + `lastSun(y, mo)`

`lastSun(y, mo)` returns the UTC date number of the last Sunday of a given month (0-indexed). Used to compute the true ITU summer/winter schedule boundaries: last Sunday of March (start of `a` season) and last Sunday of October (start of `b` season). Earlier versions used hardcoded `day>=29` / `day<26` — the `lastSun` helper replaced those.

`seasonList()` returns the current code plus neighbours for the manual override dropdown.

### Callsign & Maidenhead grid — `toGrid(lat, lng)` + `renderIdent()`

`toGrid` computes a 6-character Maidenhead locator (e.g. `EM40ab`) from decimal lat/lng. Fully offline, no deps. Called from `renderIdent()`, which writes to `#hdrCall` and `#hdrGrid` in the header and updates `#gridHint` in the Ref station card. Called at boot, after `saveGeo()`, after geolocation fix, and after callsign save.

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

The smoke harness lives at `test/smoke.mjs` and runs 3 checks:

1. **Syntax** — `new Function(js)` on the extracted script block.
2. **getElementById coverage** — every `getElementById("x")` call in the script must have a matching `id="x"` in the HTML.
3. **jsdom boot** — the app initialises without throwing; key elements are present.

Run it:

```bash
npm i -D jsdom   # one-time setup
node test/smoke.mjs
```

**jsdom localStorage note:** newer jsdom exposes `localStorage` as a getter-only property. The harness uses `Object.defineProperty` to inject a stub rather than direct assignment:

```js
Object.defineProperty(w, "localStorage", {
  value: store, configurable: true
});
```

Direct assignment (`w.localStorage = ...`) throws `TypeError: Cannot set property localStorage … which has only a getter` in newer jsdom.

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

See `CHANGELOG.md` for the full version history. Summary:

- **v0.1** — Initial offline guide: manual EiBi CSV load; On Air / Search / By Freq / Bands; built-in time-standard stations + band reference.
- **v0.2** — Online EiBi auto-update: season auto-detect, relay fallback, offline cache, stale indicator, auto-update toggle.
- **v0.3** — Major expansion: Listen / Log / Tools / Ref with sub-navigation; Logbook + Favorites + My Freq; antenna calculator; grayline/band planner; export/print.
- **v0.4** — Spots tab: live POTA & SOTA, relay fallback, caching, mode/text filters, auto-refresh, stale fading.
- **v0.5** — In-app-browser awareness; status-aware empty states.
- **v0.6** — Spot → prefilled log; log schema gains Mode + Reference; unified logging entry points.
- **v2026.06.04 (current)** — ADIF export (R1); log entry edit (R1b); RST sent/received split (R1c); callsign + Maidenhead grid (header + ADIF); Propagation tab; CalVer `VERSION` constant in ADIF and dbstat; `seasonCode()` fix via `lastSun()` helper.

---

## 12. Revision roadmap

**Milestone: Logging polish — ✅ DONE (v2026.06.04)**
- ✅ **R1 — ADIF export.** ADIF 3.1.4 `.adi` download; POTA_REF / SOTA_REF auto-detect; MY_CALL / MY_GRIDSQUARE from station settings.
- ✅ **R1b — Logbook edit.** In-place edit via pencil icon; `editIdx` state; Save → Update.
- ✅ **R1c — RST sent/received split.** Two separate fields; backward-compat fallback on old `sinpo` entries.

**Milestone: Durable offline / installable (next)**
- **R2 — PWA.** Add `manifest.webmanifest` + service worker. Requires HTTPS hosting. Solves iOS ITP storage eviction (C13).
- **R3 — IndexedDB for the schedule.** Move EiBi raw/parsed data out of `localStorage` (C4).

**Milestone: Maintainability**
- **R4 — Modularize + build + tests.** ES modules + esbuild/vite still emitting one file; Vitest unit tests for the pure functions listed in §9.
- **R5 — Schema versioning/migration.** Formal migration path when a key bump is needed (C6).

**Milestone: Reliability & features**
- **R6 — Self-hosted CORS relay** (Cloudflare Worker). Eliminates dependency on public relays (C1).
- **R7 — Spot extras:** distance/bearing from GEO, audible alert, band-mode quick filters.
- **R8 — Accessibility pass** (C12).
- **R9 — Embedded font** (optional).
