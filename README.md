# SKYWAVE — Shortwave Band Guide

A communications-receiver-styled offline-first web app for shortwave listening. Think "TV Guide for shortwave" — browse what's on the air right now, search by language or frequency, and plan propagation windows.

**Amber phosphor on black · Monospace · No build step · No dependencies**

---

## → [Try it live: cdburgess75.github.io/SkyWave](https://cdburgess75.github.io/SkyWave/)

*Works on any device — install to your home screen from Safari (iOS) or Chrome (Android/desktop) for a full offline experience.*

---

## Companion app

Active ham operators looking for **POTA/SOTA spots, QSO logging, and ADIF export** should check out **[PileUp](https://github.com/cdburgess75/PileUp)** — the operating-focused companion to SkyWave. Same offline-first PWA architecture, fully independent.

---

## What it is

Five tabs across a bottom nav (mobile) or left sidebar (desktop ≥ 860 px):

- **Listen** — EiBi broadcast schedule (On Air Now / Search / By Frequency)
- **Saved** — Favorite stations & your own custom frequencies
- **Tools** — Antenna calculator, grayline & band planner, export & print
- **Ref** — EiBi schedule update, band tables, code key, display settings
- **Prop** — Propagation charts, live planetary K-index, solar conditions

## How to use

1. Open the live link above in **Safari** or **Chrome** (not an in-app browser preview)
2. **Share → Add to Home Screen** (iOS) or **Install app** (Chrome) for a full-screen PWA
3. Everything offline works immediately — the app caches itself on first visit
4. The EiBi schedule update requires a connection

> **Why a real browser?** In-app webviews (e.g. Messages, social apps) sandbox outbound `fetch`. Live data only works in real Safari/Chrome or the hosted HTTPS deployment. The app will tell you if it detects this situation.

## Features

| Feature | Notes |
|---------|-------|
| Shortwave broadcast schedule | EiBi database, auto-updated, stored offline |
| On Air Now | Filters active broadcasts by time, language, band, or favorites |
| Search | Full-text search across stations, languages, and targets |
| By Frequency | Browse schedule sorted by frequency |
| Favorites | Star stations; starred entries survive EiBi updates |
| My Frequencies | Save your own custom freq/mode/label entries |
| Antenna calculator | Half-wave dipole, quarter-wave vertical, full-wave loop |
| Grayline planner | Sunrise/sunset + band-by-band propagation advice for your location |
| Propagation charts | HamQSL band condition banners |
| K-index | Live planetary K-index from NOAA SWPC |
| PWA / offline | Service worker + manifest; installs as standalone app |
| First-run setup wizard | 3-step location wizard on first launch; re-run from Ref tab |
| Maidenhead grid square | Computed from your location; displayed in header |
| Responsive | Bottom nav on mobile; left sidebar on desktop ≥ 860 px |

## Data sources

- **EiBi shortwave schedule** — © Eike Bierwirth, free to copy & distribute. [eibispace.de](http://www.eibispace.de)
- **NOAA K-index** — [SWPC JSON API](https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json) (CORS-open)
- **HamQSL propagation** — [hamqsl.com](https://www.hamqsl.com) N0NBH / K4HG

Please respect each source's terms: don't poll faster than ~60 s, identify politely.

## Development

No build step. The entire app is `index.html` — one self-contained file, vanilla JS (`"use strict"`), no third-party runtime libraries.

### Smoke test

```bash
npm install -D jsdom
node test/smoke.mjs
```

See `HANDOFF.md` for full architecture, data-source contracts, coding conventions, and localStorage schema.

## Version

Current: **v2026.06.09** — CalVer. Pure shortwave band guide. POTA/SOTA/logging moved to companion app PileUp.

## License

Code: MIT (see LICENSE). Schedule data belongs to EiBi under its respective terms — do not relicense the data.
