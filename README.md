<div align="center">

<img src="icons/icon.svg" width="88" alt="SKYWAVE icon">

# SKYWAVE

**A "TV Guide for shortwave" — see what's on the air right now.**

[![Version](https://img.shields.io/badge/version-2026.07.11-f0923c)](CHANGELOG.md)
[![PWA](https://img.shields.io/badge/PWA-offline--first-7de87a)](#get-it-on-your-phone)
[![Single file](https://img.shields.io/badge/app-single%20HTML%20file%2C%20zero%20deps-7dd5f5)](index.html)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

### → **[Open the app: cdburgess75.github.io/SkyWave](https://cdburgess75.github.io/SkyWave/)** ←

<br>

<img src="docs/screenshot-desktop.png" width="900" alt="SKYWAVE on desktop — On Air list, sidebar nav, grayline and band rail">

<br><br>

<img src="docs/screenshot-mobile.png" width="340" alt="On Air Now — mobile">&nbsp;&nbsp;<img src="docs/screenshot-nets.png" width="340" alt="Live ham nets — mobile">

</div>

---

## Get it on your phone

1. Open the **[live link](https://cdburgess75.github.io/SkyWave/)** in Safari or Chrome
2. **Share → Add to Home Screen** (iOS) or **Install app** (Chrome)
3. Done — it works offline from now on

## What you get

- **📻 On Air Now** — every shortwave broadcast on the air this minute (EiBi schedule, updates itself, stored offline)
- **🔍 Search & By-Freq** — find a station by name or language, or type the dial frequency to identify a mystery signal
- **📡 Nets** — live ham nets in session (via [NetLogger](https://www.netlogger.org)) plus the major scheduled HF nets built in
- **★ Favorites** — star stations, ✓ mark them heard today, add your own frequencies
- **🌅 Grayline planner** — sunrise/sunset and band-by-band advice for your location, computed on-device
- **📶 Propagation** — solar conditions and live K-index
- **🛠 Field tools** — antenna calculator, band card export, print sheet, kiosk mode, dark/light themes

## Under the hood

One self-contained `index.html` — vanilla JS, no build step, no dependencies. Details: [HANDOFF.md](HANDOFF.md) · [Architecture](docs/ARCHITECTURE.md) · [Data sources](docs/DATA_SOURCES.md) · [Changelog](CHANGELOG.md)

Schedule data © [EiBi](http://www.eibispace.de) · K-index [NOAA SWPC](https://www.swpc.noaa.gov) · solar widget [HamQSL](https://www.hamqsl.com)

**Ham operator?** The companion app **[PileUp](https://github.com/cdburgess75/PileUp)** adds POTA/SOTA spots, QSO logging, and ADIF export.

License: [MIT](LICENSE)

<div align="center"><sub>Built for offline field use · All times UTC · 73</sub></div>
