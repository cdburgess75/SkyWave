# SKYWAVE — Shortwave Band Guide

A communications-receiver-styled offline-first web app for shortwave listening and ham field operation. Think "TV Guide for shortwave" plus an operating logbook plus field tools.

**Amber phosphor on black · Monospace · No build step · No dependencies**

---

## → [Try it live: cdburgess75.github.io/SkyWave](https://cdburgess75.github.io/SkyWave/)

*Works on any device — install to your home screen from Safari (iOS) or Chrome (Android/desktop) for a full offline experience.*

---

## What it is

Six tabs across a bottom nav (mobile) or left sidebar (desktop ≥ 860 px):

- **Listen** — broadcast schedule (On Air / Search / By Freq)
- **Log** — logbook with ADIF & CSV export, Favorites, My Frequencies
- **Spots** — live POTA & SOTA activations
- **Tools** — antenna calculator, grayline & band planner, export & print
- **Ref** — EiBi schedule update + band tables + code key
- **Prop** — propagation charts + live planetary K-index

## How to use

1. Open the live link above in **Safari** or **Chrome** (not an in-app browser preview)
2. **Share → Add to Home Screen** (iOS) or **Install app** (Chrome) for a full-screen PWA
3. Everything offline works immediately — the app caches itself on first visit
4. Live Spots and EiBi schedule updates require a connection

> **Why a real browser?** In-app webviews (e.g. Messages, social apps) sandbox outbound `fetch`. Live data only works in real Safari/Chrome or the hosted HTTPS deployment. The app will tell you if it detects this situation.

## Features

| Feature | Notes |
|---------|-------|
| Shortwave broadcast schedule | EiBi database, auto-updated, stored offline |
| On-air now filter | Filters by language, band, or favorites in real time |
| Logbook | UTC date/time, freq, mode, RST sent/rcvd, ref, notes |
| ADIF export | ADIF 3.1.4 with `MY_CALL`, `MY_GRIDSQUARE`, POTA/SOTA refs |
| CSV export | Spreadsheet-friendly, all log fields |
| Callsign + grid | Stored in prefs; shown in header; feeds ADIF automatically |
| Maidenhead grid | Computed from your GPS or manually entered lat/lng |
| POTA spots | Live activator spots from pota.app |
| SOTA spots | Live summit spots from sota.org.uk |
| Antenna calculator | Half-wave dipole, quarter-wave vertical, full-wave loop |
| Grayline planner | Sunrise/sunset + band-by-band propagation advice |
| PWA / offline | Service worker + manifest; installs as standalone app |
| Responsive | Bottom nav on mobile; left sidebar on desktop ≥ 860 px |

## Data sources

- **EiBi shortwave schedule** — © Eike Bierwirth, free to copy & distribute. [eibispace.de](http://www.eibispace.de)
- **POTA spots** — [pota.app](https://pota.app) public API
- **SOTA spots** — [sota.org.uk](https://www.sota.org.uk) public API
- **NOAA K-index** — [SWPC JSON API](https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json) (CORS-open)

Please respect each source's terms: don't poll faster than ~60 s, identify politely.

## Development

No build step. The entire app is `index.html` — one self-contained file, vanilla JS (`"use strict"`), no third-party runtime libraries.

### Smoke test

```bash
npm install -D jsdom
node test/smoke.mjs
```

See `HANDOFF.md` for full architecture, data-source contracts, coding conventions, localStorage schema, and the revision roadmap.

## Version

Current: **v2026.06.04** — CalVer. Bottom nav (mobile) + sidebar (desktop), callsign/grid header, ADIF export, live K-index, PWA.

## License

Code: MIT (see LICENSE). Schedule data belongs to EiBi/POTA/SOTA under their respective terms — do not relicense the data.
