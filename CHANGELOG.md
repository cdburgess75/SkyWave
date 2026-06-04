# Changelog

All notable changes to SKYWAVE are documented here.

## [0.6.0] — 2026-06

### Added
- Spot → prefilled log: tapping any POTA/SOTA spot row opens a pre-filled log modal (freq, callsign, mode, reference, UTC date/time, default RST 599 CW-or-data / 59 phone, auto notes line)
- Log schema: **Mode** and **Reference** fields
- CSV export now includes `mode` and `reference` columns

### Changed
- Unified the two logging entry points (schedule and spot) into one consistent prefill path
- Consolidation pass to remove accumulated cruft

## [0.5.0] — 2026

### Added
- In-app-browser awareness: detects webviews that block `fetch` and shows "open in Safari" guidance on failure
- Status-aware empty states for Spots and EiBi update

## [0.4.0] — 2026

### Added
- **Spots tab**: live POTA & SOTA activations via relay fallback chain
- Spot caching in `localStorage`; stale spots (>45 min) faded
- Mode chips (All / CW / Phone / Data) + free-text filter on Spots
- Auto-refresh every 60 s while Spots tab is visible and online

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
