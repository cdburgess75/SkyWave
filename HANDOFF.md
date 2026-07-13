# SKYWAVE — Engineering Handoff

**Project:** SKYWAVE · Shortwave Band Guide (offline-first PWA single-file web app)
**Artifact:** `index.html` (+ `sw.js`, `manifest.webmanifest`)
**Version:** v2026.07.13.004 (CalVer: `YYYY.MM.DD`, `.00N` suffix for same-day releases)
**Date:** June 2026
**Primary user / owner:** Dave — licensed amateur operator (IC-7300), SWL/DX, Loranger LA. Army Signal Corps background. Thinks in UTC.
**Purpose of this doc:** Hand the project to Claude Code (and a Git repo) with enough detail that a fresh agent can extend it safely without re-reverse-engineering anything.

---

## 0. TL;DR for the next agent (read this first)

- It is **one self-contained HTML file**. No build step, no framework, no external JS/CSS. ~85 KB.
- **Vanilla JS in `"use strict"`**, all inside a single `<script>` at the bottom of the file.
- **`const VERSION="2026.07.13.004"` near the top** of the script block. CalVer: `YYYY.MM.DD`; append `.00N` for same-day releases. Bump the `sw.js` cache name in the same commit.
- **To test:** `npm test` — smoke harness + nets-parser unit tests; CI runs both on every push to main (`.github/workflows/test.yml`).
- **Offline-first is the prime directive.** Everything except EiBi auto-update and the Prop tab must work with the radio off and the phone in airplane mode.
- **State persists in `localStorage`** under `skywave_*` keys (see §6). All access is wrapped in `try/catch`.
- **Dynamic rows use event delegation** from `document` on `[data-act]` attributes; row payloads ride in `data-*` attributes (escaped via `attr()`).
- **Do not** add third-party libraries, break the single-file model, introduce `localStorage` usage that isn't `try/catch`-guarded, or add operating-side features (QSO logging, POTA/SOTA spots, ADIF) — SkyWave is a listening guide.
- **Known sharp edge:** live features fail inside in-app browsers (e.g. the Claude app preview) because those webviews block `fetch`. The app detects and explains this. Real Safari (or any hosted HTTPS deploy) is required for live data.

---

## 1. What the app is

A communications-receiver-styled (amber phosphor on black, monospace) shortwave band guide. Think "TV Guide for shortwave." Five top-level tabs:

1. **Listen** — Nets (default) / On Air Now / Search / By Frequency
2. **Saved** — Favorite stations & custom frequencies
3. **Tools** — Antenna calculator / Grayline & band planner / Export & print
4. **Ref** — EiBi schedule update + band tables + code key + display settings
5. **Prop** — Propagation charts, live planetary K-index, solar conditions (online-only)

The **header** shows the brand name, UTC/local clocks, dbstat (entry count + version), and a grid square line (`#hdrGrid`) showing the operator's Maidenhead locator computed from their stored location.

A **first-run wizard** (`#wizardModal`, 3 steps) prompts for location on first launch. Controlled by `PREFS.setup`.

---

## 2. How to run & deploy

### For the user

1. Open `index.html` in **Safari** (not an in-app preview).
2. **Share → Add to Home Screen** → launches full-screen like a native app.
3. Everything offline works immediately. EiBi auto-update requires a connection.

### Why Safari specifically

In-app webviews (Claude app preview, Messages preview, etc.) sandbox outbound `fetch`, so live data silently fails there. The app surfaces a clear message telling the user to open in Safari. **This is a platform limitation, not a bug.**

### Hosted (recommended — enables full PWA)

Any static HTTPS host works (GitHub Pages, Cloudflare Pages, Netlify). The `sw.js` service worker and `manifest.webmanifest` are already present. Hosting over HTTPS activates durable offline storage and real installable PWA behaviour.

---

## 3. Architecture

### File layout (within the single HTML)

```
<head>
  <meta> viewport / apple-mobile-web-app-* / theme-color / description+og / PWA manifest link
  <style>  ... all CSS (CSS custom props in :root; [data-theme="light"] overrides) ...
<body>
  <div id="layout">
    <nav class="sidenav">      desktop sidebar nav (≥860px)
    <div class="wrap">
      <header> brand + #themeToggle (☾/☀) + #kioskBtn + #hdrGrid + UTC/local clocks + dbstat
      <section id="tab-listen">  seg + sub-nets (default) / sub-now / sub-search / sub-freq
      <section id="tab-log">     seg + sub-stars / sub-mine          ← Saved tab (ID reuses "log")
      <section id="tab-tools">   antenna card / grayline card / export card
      <section id="tab-ref">     display card + loadbox(update) + band tables + code key + footer (version)
      <section id="tab-prop">    propStatus banner + solar widget + K-index card + link tiles
      <div id="printArea">       (hidden; filled on demand for print)
    <div id="rightRail">       ≥1280px: K-index / grayline / bands digest
  <div class="toast" id="toast">
  <div class="updbar" id="updBar">      update-ready banner (SW updatefound → activated)
  <div class="morescrim"> + <div class="moresheet" id="moreSheet">   mobile More sheet
  <nav class="bottomnav">    mobile bottom nav
  <div class="modal" id="wizardModal">  first-run location wizard (3 steps)
  <script> ... entire app ...
```

> Note: the Saved tab's section ID is `tab-log` — a historical artifact from before the app was split. Don't rename it without auditing all `showTab("log")` calls.

### Design language

- Colors are CSS custom properties in `:root` (`--amber`, `--green`, `--ink`, `--panel`, …). Change the theme there.
- Font stack is monospace-first (`"SF Mono", ui-monospace, Menlo, …`) — chosen so it renders with character **offline** (no web fonts). On iOS this resolves to SF Mono/Menlo.
- `@media print` hides all chrome and renders only `#printArea` as black-on-white.
- Light theme: `.light` class on `<body>` flips the `:root` custom properties; toggled from the Ref → Display card.

### Data flow

```
buildBase() = TIME stations + NETDIR scheduled nets + MINE (user custom)  ── always present
EIBI[]      = parsed EiBi schedule (loaded/updated; may be empty)
DATA        = buildBase().concat(EIBI)        ← single source the Listen tab reads
rebuildData() recomputes DATA + filters + re-renders

Live nets (transient, not schedule entries):
openNets() → getNets() (NetLogger XML API × relays) → parseNets() → NETS{list,ts} → renderNets()
```

- `entry(freq,time,days,itu,station,lang,target,tx,src)` is the normalized record. `parseTime()` precomputes integer `start`/`end` HHMM; `_days` precomputes the day-of-week set.
- Listen renders from `DATA`; the Nets sub-tab renders live `NETS` above the `src==="net"` directory rows.

### No build, no modules

Intentional for portability. Refactor-to-modules is roadmap R4.

---

## 4. Feature reference (by tab)

### 4.1 Listen

- **Nets** (default sub-tab, `openNets`/`renderNets`): live nets in session (NetLogger XML API via relays, cached in `skywave_nets_v1`) above the built-in `NETDIR` directory of 15 scheduled national + Southeast-US nets. Fetches at boot when online and on sub-tab open (60 s freshness) or ⟳.
- **On Air** (`refreshNow`): filters `DATA` by `onAir(e)`; sorts by frequency; shows live UTC. Quick chips (All / ★ Favorites / English / Spanish / French) + free-text filter + meter-band dropdown. Auto-re-renders every 30 s while visible.
- **Search** (`refreshSearch`): full-text over station/lang/country/target + band/lang/target dropdowns. Capped at 1200 results.
- **By Freq** (`refreshFreq`): enter kHz or MHz; shows entries within ±2/5/10 kHz, on-air first. The "I hear something on 9.420, who is it?" workflow.
- **Mode badges** via `modeOf(e)` (DRM / CW / TIME / USB / LSB / DATA), inferred from lang/tx/station text.

### 4.2 Saved

Contains two sub-tabs rendered via the same `#tab-log` section:

- **Favorites** (`toggleFav`, `renderStars`): star any listing; `FAVS[]` stores enough to re-render and recompute on-air. Favorites that are on the air are highlighted.
- **My Freq** (`addMine`, `renderMine`, `delMine`): user custom frequencies merged into `DATA` (src `"mine"`, amber left-bar). `+ Add LA regional example set` seeds 3.856/7.256/14.156 (editable/deletable).

### 4.3 Tools

- **Antenna calculator** (`calcAnt`): input MHz or kHz (auto-detect: ≥1000 ⇒ kHz). Outputs:
  - Wavelength λ(m) = `300 / f_MHz`
  - ½-wave dipole = `468 / f_MHz` ft (`142.5 / f_MHz` m); each leg = half
  - ¼-wave vertical = `234 / f_MHz` ft
  - Full-wave loop = `1005 / f_MHz` ft
  - Static doublet/balun cheat-sheet (135/88/44 ft; 4:1 Guanella vs 1:1 current balun).
- **Grayline & band planner** (`sunTimes`, `renderGray`, `renderAdvise`): SunCalc-derived solar algorithm, **fully offline**, computed from `GEO {lat,lng}` (default Loranger 30.61/-90.36). Shows sunrise/sunset/solar-noon (UTC + local), day length, current state (☀/☾/◐ grayline), and rule-of-thumb band advice. Also shows the Maidenhead grid for the stored location.
- **Export & print** (`onAirText`, `bandCardText`, `doPrint`): copy on-air list to clipboard, download a band card `.txt`, or print a clean reference card.

### 4.4 Ref

- **Display settings**: theme toggle (dark/light), font zoom, 12/24 h clock, auto-update toggle.
- **EiBi update** (`doUpdate`, `fetchSchedule`, `seasonCode`, `seasonList`): one-tap update, season auto-detect, manual season override, manual file load fallback, auto-update-on-launch toggle, "last updated / stale" indicator, network dot.
- **Reference tables**: SW broadcast meter bands, US amateur HF bands, time/frequency standards, language & target-area code key.

### 4.5 Propagation (online-only)

`renderProp()` is called when the Prop tab is shown. When online it shows a green banner; when offline it shows an amber warning with a pointer to the offline band advice on the Tools tab. No state is stored; no data is fetched by the app itself — all content is image tiles and external links.

- **Solar widget** (`#solarImg`): `<img>` from `hamqsl.com/solar.gif`.
- **K-index** (`#kIdx`): `<img>` from NOAA SWPC `planetary_k_index.gif`.
- **Link tiles**: Proppy, VOACAP, interactive grayline map, WebSDR directory, aurora activity, DX cluster. All open in a new tab.

**Important:** this tab is flagged "needs connection." Do not add cached/offline fallbacks here — keep the offline story clean and explicit.

---

## 5. Data sources & external contracts

### 5.1 EiBi shortwave schedule

- **Source:** `http://www.eibispace.de/dx/sked-<code>.csv`
- **Season code** (`seasonCode`): `a` = summer (≈ last Sun Mar → last Sun Oct), `b` = winter; 2-digit year. e.g. `a26`, `b26`.
- **CSV format** (semicolon, ≥11 fields). `parseEibi` maps:
  `[0]=freq(kHz) [1]=time"HHMM-HHMM" [2]=days [3]=ITU [4]=station [5]=lang [6]=target [7]=tx`.
- `loadText` rejects files with <20 parsed entries and caches raw text if <4.5 MB.

### 5.2 CORS relays — `relays(rawUrl)`

Tried in order: **direct** → `api.allorigins.win/raw` → `corsproxy.io` → `api.codetabs.com`.
Used only for EiBi schedule updates. **This is the single biggest fragility** (see C1).

---

## 6. localStorage schema

All keys defined in the `K` object. All reads/writes via `loadJSON`/`saveJSON` (try/catch).

| Key                    | Shape                                                                    | Notes                  |
|------------------------|--------------------------------------------------------------------------|------------------------|
| `skywave_eibi_raw_v1`  | string (raw CSV)                                                         | cached only if <4.5 MB |
| `skywave_eibi_meta_v1` | `{code, ts, count}`                                                      | freshness/season display |
| `skywave_favs_v1`      | `[{freq, station, time, lang?, target?, itu?}]`                          | favorites              |
| `skywave_mine_v1`      | `[{freq, mode, station, time, days, lang, target, notes}]`               | user custom frequencies |
| `skywave_geo_v1`       | `{lat, lng, label}`                                                      | grayline location      |
| `skywave_prefs_v1`     | `{autoUpd, setup, theme, zoom, hr24}`                                    | preferences; `setup: true` once wizard completes |
| `skywave_heard_v1`     | `{"<keyOf entry>": "YYYY-MM-DD", …}`                                     | favorites marked heard today; pruned to current UTC day on boot |
| `skywave_nets_v1`      | `{list:[{freq,name,mode,ncs,band,start}], ts}`                           | last fetched NetLogger nets-in-progress |

**Not here:** logbook, POTA/SOTA spots, callsign, ADIF — operating-side data is out of scope.

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

`lastSun(y, mo)` returns the UTC date number of the last Sunday of a given month (0-indexed). Used to compute the true ITU summer/winter schedule boundaries: last Sunday of March (start of `a` season) and last Sunday of October (start of `b` season).

`seasonList()` returns the current code plus neighbours for the manual override dropdown.

### Maidenhead grid — `toGrid(lat, lng)`

Computes a 6-character Maidenhead locator (e.g. `EM40ab`) from decimal lat/lng. Fully offline, no deps. Called from `renderIdent()`, which writes to `#hdrGrid` in the header. Also called live in the setup wizard as the user types lat/lng.

### Solar / grayline — `sunTimes(date, lat, lng)`

Compact SunCalc core (Agafonkin): Julian day → solar mean anomaly → ecliptic longitude → declination → hour angle at `h0 = -0.833°` → sunrise/sunset/solar-noon as `Date`s. Returns `{polar:"day"|"night"}` for polar edge cases. `renderAdvise(isDay, nearGray)` builds rule-of-thumb band guidance; `nearGray` = within 50 min of sunrise/sunset.

### Fetch strategy — `fetchSchedule(code)`

Loop candidate URLs × `relays()`; first response that parses and passes a sanity check wins. Returns `null` on total failure → caller keeps cached data and shows guidance.

---

## 8. Coding conventions & gotchas

- **No external dependencies, ever** (unless executing R2/R4 deliberately).
- **Frequencies are normalized to kHz internally.** Display via `fmtFreq` (renders MHz when ≥1000 kHz) + `freqUnit`.
- **All times are UTC.** Device clock drives on-air status.
- **HTML escaping:** `esc()` for text content, `attr()` for attribute values. Always escape user/data-derived strings.
- **Event delegation:** dynamic rows do not bind listeners individually. A single `document` click handler reads `closest("[data-act]")` and dispatches on `dataset.act`.
- **`tab-log` ID means "Saved tab"** — the section ID was not renamed when the tab was renamed. Don't rename it silently; `showTab("log")` calls exist throughout.
- **localStorage in previews:** wrap everything in try/catch (already done) so the app degrades to in-memory if storage is blocked.
- Keep the **offline-first** contract: a new feature that needs the network must cache its last result and render a sensible offline/failed state.

---

## 9. Testing

The smoke harness lives at `test/smoke.mjs` and runs 3 checks:

1. **Syntax** — `new Function(js)` on the extracted script block.
2. **getElementById coverage** — every `getElementById("x")` call in the script must have a matching `id="x"` in the HTML.
3. **jsdom boot** — the app initialises without throwing; key elements (`#tab-listen`, `#tab-log`, `#tab-tools`, `#toast`) are present.

Run it:

```bash
npm i -D jsdom   # one-time setup
node test/smoke.mjs
```

**jsdom localStorage note:** newer jsdom exposes `localStorage` as a getter-only property. The harness uses `Object.defineProperty` to inject a stub rather than direct assignment.

**Pure functions worth unit-testing first** (refactor them to be importable in R4): `seasonCode`, `dayAllowed`, `onAir`, `parseTime`, `sunTimes`, `parseEibi`, the antenna math, `toGrid`.

---

## 10. Compromises & known limitations

- **C1 — EiBi update depends on public CORS relays.** Can rate-limit or disappear. Mitigation: self-hosted relay (R6).
- **C2 — In-app browsers block `fetch`.** EiBi auto-update only works in real Safari / a hosted PWA.
- **C3 — Single file, no modules/build.** Great for portability; bad for diffs and testing granularity. (R4)
- **C4 — `localStorage` only (~5 MB).** Raw EiBi cache guarded at <4.5 MB. Should move to IndexedDB. (R3)
- **C5 — EiBi `.txt` fallback parser is heuristic.** CSV is the supported path.
- **C6 — No schema versioning/migration.** Additive changes are safe; a breaking change needs a key bump + migration. (R5)
- **C7 — Day-of-week parser is intentionally permissive.** Irregular codes shown, not precisely scheduled.
- **C8 — Antenna math uses classic 468/234/1005 approximations.** Ignores height, wire diameter, velocity factor.
- **C9 — Grayline advice is rule-of-thumb, not a propagation model.**
- **C10 — No committed automated tests.** (R4)
- **C11 — Accessibility not audited.** (R8)
- **C12 — `tab-log` section ID means the Saved tab.** Historical artifact; rename with care.

---

## 11. Changelog

- **v0.1** — Initial offline guide: manual EiBi CSV load; On Air / Search / By Freq / Bands; built-in time-standard stations + band reference.
- **v0.2** — Online EiBi auto-update: season auto-detect, relay fallback, offline cache, stale indicator, auto-update toggle.
- **v0.3** — Major expansion: multi-tab nav; Favorites; My Freq; antenna calculator; grayline/band planner; export/print.
- **v0.4** — In-app-browser awareness; status-aware empty states; Propagation tab.
- **v0.5** — First-run setup wizard (location → Maidenhead grid preview); grid square in header.
- **v2026.06.09** — Code review pass: dead CSS/variable removal, `toggleFav` key unified via `keyOf()`, `loadText` timestamp preservation, double `rebuildData()` boot fix, `onAirText()` filter respect, stale `mineMsg` clear, re-run wizard link, K-index auto-load in wide-screen rail, Firefox zoom fallback, SW error surfacing.
- **v2026.07.05** — Polish pass: fixed `attr()` escape order (quote-in-station-name corrupted favorite keys), PNG app icons (`apple-touch-icon.png` 180 + `icon-512.png`) so iOS home-screen icon works, favicon + `og:`/description meta tags, `theme-color` follows light/dark, lat/lng range validation (`validGeo`), `sw.js` relative paths for host portability, rail K-index error state, `fetchKIndex` timeout, TZ label computed once, My-Freq delete confirm, accurate search-result count. Also: "heard today" mark on Favorites (sage strike + pill, clears 0000 UTC, `skywave_heard_v1`). See CHANGELOG.md.
- **v2026.07.12.006 (current)** — Nets fetch hardened: 3 candidate endpoints tried; dead thingproxy relay replaced with codetabs in the shared chain.
- **v2026.07.12.005** — Nets parser speaks the documented NetLogger XML format (was JSON/delimited only — live nets always parsed to zero). 20 parser tests.
- **v2026.07.12.004** — NETDIR grown to 15 nets: ten verified Southeast-US nets added (state traffic nets LA/MS/AL/GA/TN/SC, FL phone + midday, SouthCARS, Waterway). UTC times are daylight-anchored; notes carry local times. Former companion-app references removed — SkyWave stands alone.
- **v2026.07.12–.003** — WCAG AA contrast pass (`--ink-dim` #8a8a8a); moon/sun theme toggle; update-ready banner; version in Ref footer; audit remediation: CI workflow + real test exit codes, nets-parser tests in repo, `_days` precomputed per entry, debounced filters, K-index retry reset, wizard GEO commit-on-Next, keyboard/ARIA accessibility (chips are buttons, row actions focusable, Escape, wizard focus trap), `prefers-reduced-motion`, manifest id/screenshots/categories.
- **v2026.07.11** — **Nets**: 4th Listen sub-tab. Live nets-in-session via NetLogger API (`GetNetsInProgress`, relay chain, tolerant JSON/delimited parser, `skywave_nets_v1` cache, fails soft) + built-in `NETDIR` of major scheduled HF nets flowing through the normal DATA pipeline (offline, on-air aware, star-able). README given hero screenshots + badges; `docs/ARCHITECTURE.md` and `docs/DATA_SOURCES.md` rewritten for the post-split app. **Note:** the NetLogger response format could not be live-verified at build time (sandboxed network) — the parser is defensive; verify on a real device and adjust `parseNets()` if the field order differs.

---

## 12. Revision roadmap

**Completed**
- ✅ **R2 — PWA.** `manifest.webmanifest` + `sw.js` service worker. Cache-first with background update.

**Next**
- **R3 — IndexedDB for the schedule.** Move EiBi raw/parsed data out of `localStorage` (C4).
- **R4 — Modularize + build + tests.** ES modules + esbuild/vite still emitting one file; Vitest unit tests for the pure functions listed in §9.
- **R5 — Schema versioning/migration.** Formal migration path when a key bump is needed (C6).
- **R6 — Self-hosted CORS relay** (Cloudflare Worker). Eliminates dependency on public relays (C1).
- **R7 — Accessibility pass** (C11).
