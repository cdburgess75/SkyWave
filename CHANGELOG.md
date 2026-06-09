# Changelog

All notable changes to SKYWAVE are documented here.

## [2026.06.09] — 2026-06-09

### Changed
- **App split**: operating tools (POTA/SOTA spots, QSO logbook, ADIF export, callsign/grid) moved to companion app [PileUp](https://github.com/cdburgess75/PileUp). SkyWave is now a pure shortwave band guide.
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

*Last version of the all-in-one app before the SkyWave / PileUp split.*

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
