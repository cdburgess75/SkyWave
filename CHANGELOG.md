# Changelog

All notable changes to SKYWAVE are documented here.

## [2026.07.13.003] — 2026-07-13

### Fixed
- **Live nets: the endpoint was wrong the whole time.** Verified against open-source NetLogger consumers (ham2k/nets, ragchew.site): the production API is `GET {server}/cgi-bin/NetLogger/GetNetsInProgress20.php?ProtocolVersion=2.3` — every previous URL (`/api/GetNetsInProgress.php` and variants) was a 404, which is why the app always reported "couldn't reach." Nets are also distributed across four servers (netlogger.org + netlogger1–3.org): all are now queried in parallel and merged, deduped by name+frequency.
- **True wire format implemented:** payload between `<!--NetLogger Start Data-->`/`End Data` markers, pipe-separated fixed fields, records ending `|~`, compact `YYYYMMDDHHMMSS` start times. New `parseNetsAIM()` tried first (XML/JSON/heuristic fallbacks retained). An empty marker pair now correctly renders as "no nets in session" instead of a failure. 8 new tests against the verbatim wire fixture (28 total).

---

## [2026.07.13.002] — 2026-07-13

### Changed
- **Update banner moved to the bottom of the screen**, just above the nav bar — the top position kept colliding with the iOS status bar (and old cached versions still drew it broken there, making the button unclickable). Bottom placement is thumb-reachable and immune to notch/status-bar geometry; slides up instead of down. Desktop shows it bottom-center.

---

## [2026.07.13] — 2026-07-13

### Changed
- **Nets is now the first sub-tab and the default view** — Listen opens on Nets (leftmost, selected on launch); the live list fetches automatically at startup when online. On Air / Search / By Freq follow.

### Fixed
- **Update banner collided with the iPhone status bar** — a three-value padding shorthand put the notch clearance (`env(safe-area-inset-top)`) on the *bottom* of the banner instead of the top, so the text/button rendered under the iOS clock with a tall empty box below. Field-reported with screenshot; safe-area padding now on top where it belongs.

---

## [2026.07.12.006] — 2026-07-12

### Fixed
- **Live nets still unreachable in the field** — hardened the fetch path on two fronts: `getNets()` now tries three candidate NetLogger endpoints (`GetNetsInProgress2.php`, `GetNetsInProgress.php` with and without `ProtocolVersion`) since the exact script name couldn't be confirmed from the sandbox, and the long-dead `thingproxy.freeboard.io` relay was replaced with `api.codetabs.com` in the shared relay chain (EiBi updates benefit too).
- Nets failure message now suggests the relays may be busy and to retry, instead of only blaming in-app previews.

---

## [2026.07.12.005] — 2026-07-12

### Fixed
- **Live nets never loaded — parser didn't speak XML.** Field testing reported "NetLogger cannot be reached"; research into the [NetLogger XML Data Service spec](https://www.netlogger.org/api/) showed the API returns XML under a `<NetLoggerXML>` root — a format `parseNets()` didn't handle, so even successful responses parsed to zero nets and displayed as unreachable. Added a tolerant XML branch (child-element and attribute styles, entity decoding, unknown nodes ignored per spec) tried before the JSON/delimited fallbacks. 6 new parser tests (20 total).

---

## [2026.07.12.004] — 2026-07-12

### Added
- **Southeast US nets in the built-in directory** — ten researched-and-verified regional HF nets join the five national ones: Louisiana Traffic Net (3.910), Mississippi Section Phone Net (3.862), Alabama Traffic Net Mike (3.965), Georgia Single Sideband Net (3.975), Tennessee Phone Net (3.980), South Carolina SSB Net (3.915), Florida Phone Traffic Net (3.940), Florida Midday Traffic Net (7.242), SouthCARS (7.251), and the Waterway Net (7.268). All offline, on-air aware, star-able; notes carry the local-time anchor (UTC times are daylight-time anchored; winter shifts +1 h).

### Removed
- All references to the former companion app — SkyWave stands alone. Operating-side features (logging, spots, ADIF) remain out of scope.

---

## [2026.07.12.003] — 2026-07-12

*Audit remediation release — items 1, 3, 5, 6, 7, 9 of the codebase-audit roadmap.*

### Added
- **CI** — `.github/workflows/test.yml` runs the test suite on every push to main and every PR
- **`npm test`** — smoke harness + new `test/nets-parser.mjs` (14 checks) now live in the repo
- **Keyboard & screen-reader accessibility** — quick-filter chips are real buttons with `aria-pressed`; ★ / ✓ / delete row actions are focusable and respond to Enter/Space with `aria-label`s; Escape closes the More sheet and wizard; wizard is `role="dialog"` with focus trap and initial focus; More-sheet rows keyboard-activatable; theme toggle announces its action
- **`prefers-reduced-motion`** support — all transitions/animations disabled for users who request it
- Algorithm guard comments on `onAir` (midnight-wrap rule), `seasonCode` (last-Sunday boundaries), and the SunCalc constants

### Fixed
- **Update banner showed to first-time visitors** — `clients.claim()` makes the page controlled the moment the first-ever service worker activates, so the "controlled?" check passed on first install. Now captures controlled-state *before* registration; the banner only appears on genuine updates. (Caught in screenshot verification; the banner also fired correctly on a real update, confirming the flow end-to-end.)
- **Test harness exit codes** — `smoke.mjs` hung on the app's `setInterval` after passing, forcing `timeout` wrappers that masked real failures (exit 124 on pass *and* fail). Now exits 0/1 correctly, which is what makes CI possible
- Right-rail K-index retries after a failed fetch (previously one-shot until a Prop-tab visit)
- Setup wizard commits your location when you tap **Next** instead of on every keystroke (typing "30.61" no longer transiently saves latitude 3)
- EiBi update no longer wastes an attempt on the direct `http://` fetch that mixed-content policy always blocks (relay-wrapped `http://` still works)

### Changed
- **Performance:** day-of-week schedule rules are parsed once per entry at load instead of ~12,000 times per 30-second refresh; all filter inputs debounced 150 ms
- Manifest: added `id`, `lang`, `categories`, and install-sheet `screenshots`

---

## [2026.07.12.002] — 2026-07-12

### Added
- **Update banner** — when the service worker downloads a new version, an amber "⟳ New version ready — Update" banner slides down from the top; tap Update to apply, or it auto-dismisses after 8 s
- **Version in Ref footer** — "SKYWAVE vYYYY.MM.DD · CalVer" (also still shown in the header status line)

### Changed
- **Theme toggle is now a single moon/sun button** (☾ in dark, ☀ in light) replacing the two labeled Dark/Light buttons — icon reflects the current mode, one tap switches

---

## [2026.07.12] — 2026-07-12

### Fixed
- **Dark-theme readability (WCAG AA)** — secondary text `--ink-dim` was #686868, only 3.5:1 contrast on cards (below the 4.5:1 minimum for small text). Now #8a8a8a: 6.1:1 on black, 5.6:1 on cards. Lifts every hint, metadata line, label, count, chip, and nav caption at once.
- Footer links were `--amber-dim` (4.2:1) — now full amber (8.9:1), matching other in-app links.
- Light-theme "heard" pill green darkened #2E8B7A → #257263 (4.1:1 → 5.7:1) for the tiny 8px pill text.
- README screenshots retaken with the improved contrast.

---

## [2026.07.11] — 2026-07-11

### Added
- **Nets sub-tab** (Listen → Nets):
  - **Live nets in session** from the [NetLogger](https://www.netlogger.org) `GetNetsInProgress` API via the CORS relay chain — net name, frequency, mode, NCS callsign, start time. Fetched on open (60 s freshness window) or manual ⟳ refresh; last list cached to `skywave_nets_v1` and shown with its age when offline or unreachable. Tolerant parser (JSON or NetLogger's `~`/`|` delimited form) that fails soft on anything unexpected.
  - **Built-in directory of major scheduled HF nets** (Maritime Mobile Service Net, Intercontinental Net, Hurricane Watch Net, ECARS, MIDCARS) — regular schedule entries, so they work fully offline, show live on-air status, appear in On Air / Search / By Freq, and can be starred.
- Professional README: hero screenshots (`docs/screenshot-desktop.png`, `docs/screenshot-mobile.png`), version/PWA/license badges, tab overview table

### Changed
- `docs/ARCHITECTURE.md` and `docs/DATA_SOURCES.md` rewritten for the post-split app (both still described the old spots/logbook pipelines); DATA_SOURCES now documents NetLogger, NOAA SWPC, and HamQSL contracts

---

## [2026.07.05] — 2026-07-05

### Fixed
- **`attr()` escaped in the wrong order** — replaced `"` before `&`, corrupting any station name containing a double quote so its favorite key could never be matched or un-starred. Now escapes `&` first.
- **iOS home-screen icon** — `apple-touch-icon` pointed at an SVG, which iOS rejects (fell back to a page screenshot). Added rasterized `apple-touch-icon.png` (180×180) and `icon-512.png`.
- **Right-rail K-index could hang on "Loading…"** — a failed NOAA fetch only updated the Prop tab; the rail now shows an error state instead of a permanent spinner.
- **Stale manifest description** — dropped the leftover "field logbook" wording.
- **`theme-color` stayed dark in light mode** — browser chrome now follows the selected theme.

### Changed
- **`sw.js` shell uses relative paths** — service worker + PWA now install on any host, not just `/SkyWave/`. Manifest `start_url`/`scope` made relative too.
- **`fetchKIndex` uses `fetchWithTimeout`** (7 s) instead of a bare `fetch` that could hang on a flaky connection.
- **Timezone label computed once** at boot instead of every clock tick.
- **Search count shows the true total** (e.g. "4,812 matches · showing first 1,200") instead of the capped 1,200.

### Added
- **"Heard today" mark on Favorites** — tap ✓ on a favorite to dim the row with a green strikethrough on the station name plus a "✓ heard" pill; clears automatically at 0000 UTC. Stored in `skywave_heard_v1`, pruned to the current UTC day on boot.
- `validGeo()` — latitude/longitude range validation (±90 / ±180) in the setup wizard and Tools; prevents out-of-range coordinates from producing garbage Maidenhead grids.
- Delete confirmation on custom (My Freq) entries.
- Favicon link and `og:` / `description` meta tags for link previews.

---

## [2026.06.09] — 2026-06-09

### Changed
- **App split**: operating tools (POTA/SOTA spots, QSO logbook, ADIF export, callsign/grid) removed. SkyWave is now a pure shortwave band guide.
- Log tab renamed **Saved** — Favorites + My Freq only; logbook removed
- Spots tab removed
- Station settings card (callsign input) removed from Ref tab
- Header now shows Maidenhead grid square only (derived from stored location, no callsign entry)
- README and HANDOFF.md rewritten to reflect the stripped scope

### Fixed
- `loadText()` was resetting the "last updated" timestamp to today on every boot from cache; now preserves the stored timestamp correctly
- "Copy on-air list" now respects the active chip / text filter / band selection (previously exported all on-air entries regardless of view)
- `toggleFav` key construction unified via `keyOf()` — was duplicating the formula inline and could drift on key changes
- Boot no longer calls `rebuildData()` twice when the EiBi cache is present
- Stale success message in My Freq card now clears when the list re-renders
- Firefox zoom fallback: `CSS.supports("zoom","1")` check; falls back to `transform:scale` for pre-126 Firefox
- Service worker registration failures now surface via `console.warn` instead of being silently swallowed

### Added
- First-run location setup wizard (3 steps: welcome → lat/lng / GPS → confirmation with grid + sunrise/sunset preview)
- `PREFS.setup` flag tracks wizard completion; shown only on first launch
- "Re-run location setup" link in Ref tab footer
- Right rail K-index auto-loads on wide screens (≥1280 px) without requiring a Prop tab visit
- `_kFetched` guard prevents duplicate K-index requests from the rail

### Removed
- Dead CSS: `.spotrow`, `.spotrow:active`, `.ident-call`
- Dead variable: `editIdx`

---

## [2026.06.04] — 2026-06-04

*Last version of the all-in-one app before the operating tools were split out.*

### Added
- **CalVer versioning**: `VERSION` constant (`2026.06.04`); surfaced in dbstat display
- **seasonCode() fix**: last-Sunday-of-March / last-Sunday-of-October boundary via `lastSun()` helper (replaces hardcoded day≥29/day<26)
- **Propagation tab**: online-only tab with solar widget, live K-index (NOAA SWPC JSON), and curated link tiles (Proppy, VOACAP, grayline, WebSDR, aurora, DX cluster); offline warning when disconnected
- **Log entry edit**: pencil icon on each log row reopens the modal pre-filled; Save changes to Update in place
- **RST sent/received split**: two separate fields; backward-compat fallback reads old `sinpo` field
- **Callsign + Maidenhead grid**: operator callsign stored in `PREFS.call`; 6-char locator computed offline via `toGrid(lat,lng)`; both displayed in header and exported as `MY_CALL` / `MY_GRIDSQUARE` in ADIF
- **ADIF export** (R1): ADIF 3.1.4 `.adi` file download with POTA_REF / SOTA_REF auto-detection
- **Station settings card**: callsign input + live grid hint in Ref tab

### Changed
- Blob search pre-computed in `rebuildData()` (not per-keypress)

---

## [0.6.0] — 2026-06

### Added
- Spot → prefilled log: tapping any POTA/SOTA spot row opens a pre-filled log modal
- Log schema: **Mode** and **Reference** fields; CSV export updated
- Unified logging entry point for schedule and spot rows

## [0.5.0] — 2026

### Added
- In-app-browser awareness: detects webviews that block `fetch` and shows "open in Safari" guidance
- Status-aware empty states for Spots and EiBi update

## [0.4.0] — 2026

### Added
- **Spots tab**: live POTA & SOTA activations via relay fallback chain
- Spot caching; stale spots (>45 min) faded
- Mode chips + free-text filter on Spots; auto-refresh every 60 s while visible

## [0.3.0] — 2026

### Added
- Major re-org into **Listen / Log / Tools / Ref** tabs with sub-navigation
- Day-of-week accuracy for on-air determination
- Mode badges (DRM / CW / TIME / USB / LSB / DATA)
- Quick chips (All / ★ Favorites / English / Spanish / French)
- **Logbook** with UTC date/time, freq, station/call, RST/SINPO, notes; CSV export
- **Favorites** (★) with on-air highlighting
- **My Freq** (user custom frequencies merged into DATA; LA regional example set)
- **Antenna calculator** (½-wave dipole, ¼-wave vertical, full-wave loop, doublet/balun cheat-sheet)
- **Grayline & band planner** (offline solar algorithm; sunrise/sunset/solar-noon; rule-of-thumb band advice)
- **Export & print** (clipboard copy, `.txt` band card download, print reference card)

## [0.2.0] — 2026

### Added
- Online EiBi auto-update: season auto-detect, CORS relay fallback chain
- Offline cache of raw EiBi CSV in `localStorage`
- Last-updated / stale indicator; auto-update-on-launch toggle

## [0.1.0] — 2026

### Added
- Initial offline guide: manual EiBi CSV load
- On Air / Search / By Freq views
- Built-in time-standard stations (WWV, WWVH, CHU, etc.)
- Band reference table
- Single self-contained HTML file, no dependencies
