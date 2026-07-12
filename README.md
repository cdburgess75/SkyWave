<div align="center">

<img src="icons/icon.svg" width="88" alt="SKYWAVE icon">

# SKYWAVE

**Shortwave Band Guide — a "TV Guide for shortwave"**

Browse what's on the air right now, search by language or frequency,
and plan grayline & propagation windows. Offline-first. No account, no tracking.

[![Version](https://img.shields.io/badge/version-2026.07.11-f0923c)](CHANGELOG.md)
[![PWA](https://img.shields.io/badge/PWA-offline--first-7de87a)](#install)
[![Dependencies](https://img.shields.io/badge/dependencies-zero-7dd5f5)](#development)
[![Single file](https://img.shields.io/badge/app-single%20HTML%20file-f0923c)](index.html)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

### → **[Try it live: cdburgess75.github.io/SkyWave](https://cdburgess75.github.io/SkyWave/)** ←

*Works on any device — install to your home screen for a full offline experience.*

<br>

<img src="docs/screenshot-desktop.png" width="900" alt="SKYWAVE desktop — On Air list with sidebar navigation, grayline and band-condition rail">

<br><br>

<img src="docs/screenshot-mobile.png" width="340" alt="SKYWAVE mobile — On Air Now list with LED dark theme">&nbsp;&nbsp;<img src="docs/screenshot-nets.png" width="340" alt="SKYWAVE mobile — live ham nets in session plus built-in scheduled HF nets">

</div>

---

## What it is

A communications-receiver-styled shortwave listening companion. Five tabs, bottom nav on mobile, sidebar on desktop:

| Tab | What's inside |
|-----|---------------|
| **▶ Listen** | EiBi broadcast schedule — On Air Now · Search · By Frequency · live ham Nets |
| **✦ Saved** | Favorite stations (with "heard today" tracking) & your own custom frequencies |
| **⚙ Tools** | Antenna calculator · grayline & band planner · export & print |
| **◆ Ref** | EiBi schedule update · band tables · code key · display settings |
| **≈ Prop** | Solar conditions · live planetary K-index · curated propagation tools |

## Features

| Feature | Notes |
|---------|-------|
| Shortwave broadcast schedule | EiBi database, auto-updated, stored offline |
| On Air Now | Filters active broadcasts by time, language, band, or favorites |
| Search | Full-text search across stations, languages, and targets |
| By Frequency | "Who is that on 9.420?" — dial-frequency lookup with ± tolerance |
| Ham nets | Live nets in session via [NetLogger](https://www.netlogger.org) + built-in major HF nets (offline) |
| Favorites | Star stations; ✓ mark them *heard today* (clears at 0000 UTC) |
| My Frequencies | Save your own custom freq/mode/label entries |
| Antenna calculator | Half-wave dipole, quarter-wave vertical, full-wave loop |
| Grayline planner | Sunrise/sunset + band-by-band propagation advice, computed on-device |
| Propagation | HamQSL solar widget + live NOAA planetary K-index |
| Maidenhead grid | 6-char locator from your location, shown in the header |
| First-run wizard | 3-step location setup; re-run anytime from the Ref tab |
| Kiosk mode | Full-screen shack-monitor mode with screen wake-lock |
| Dark / light themes | LED-style theme, switchable; scroll-minimizing header |
| PWA / offline | Service worker + manifest; installs as a standalone app |

## Install

1. Open the **[live link](https://cdburgess75.github.io/SkyWave/)** in **Safari** (iOS) or **Chrome** (Android/desktop) — not an in-app browser preview
2. **Share → Add to Home Screen** (iOS) or **Install app** (Chrome)
3. Everything offline works immediately — the app caches itself on first visit
4. Only the EiBi schedule update and the Prop tab need a connection

> **Why a real browser?** In-app webviews (Messages, social apps) sandbox outbound `fetch`, so live data silently fails there. The app detects this and tells you.

## Data sources

| Source | Used for | Terms |
|--------|----------|-------|
| [EiBi](http://www.eibispace.de) © Eike Bierwirth | Shortwave broadcast schedule | Free to copy & distribute |
| [NOAA SWPC](https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json) | Planetary K-index | Public, CORS-open |
| [HamQSL](https://www.hamqsl.com) N0NBH / K4HG | Solar conditions widget | Linked, credited |

Please respect each source's terms — don't poll faster than ~60 s.

## Development

**No build step.** The entire app is [`index.html`](index.html) — one self-contained file, vanilla JS (`"use strict"`), zero third-party runtime libraries.

```bash
npm install -D jsdom   # one-time
node test/smoke.mjs    # syntax + DOM-coverage + boot checks
```

| Doc | Contents |
|-----|----------|
| [`HANDOFF.md`](HANDOFF.md) | Full architecture, conventions, localStorage schema, roadmap |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Data flow and file layout |
| [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) | External API contracts |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history (CalVer `YYYY.MM.DD`) |

## Companion app

Active ham operators wanting **POTA/SOTA spots, QSO logging, and ADIF export** should check out **[PileUp](https://github.com/cdburgess75/PileUp)** — the operating-focused companion to SkyWave. Same offline-first architecture, fully independent.

## License

Code: [MIT](LICENSE). Schedule data belongs to EiBi under its respective terms — do not relicense the data.

<div align="center">
<sub>Built for offline field use · All times UTC · 73</sub>
</div>
