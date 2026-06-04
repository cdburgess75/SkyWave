# SKYWAVE — Shortwave Band Guide

A communications-receiver-styled offline-first web app for shortwave listening and ham field operation. Think "TV Guide for shortwave" plus an operating logbook plus field tools.

**Amber phosphor on black · Monospace · No build step · No dependencies**

## What it is

Five tabs:
- **Listen** — broadcast schedule (On Air / Search / By Freq)
- **Log** — Logbook / Favorites / My Frequencies
- **Tools** — Antenna calculator / Grayline & band planner / Export & print
- **Spots** — live POTA & SOTA activations
- **Ref** — EiBi schedule update + band tables + code key

## How to use

1. Open `index.html` in **Safari** (not an in-app browser preview)
2. **Share → Add to Home Screen** to install as a full-screen app
3. Everything offline works immediately
4. Live Spots and EiBi schedule updates require a connection

> **Why Safari?** In-app webviews (e.g. Messages, Claude app) sandbox outbound `fetch`. Live data only works in real Safari or a hosted HTTPS deployment. The app will tell you if it detects this situation.

## Hosting (recommended)

Drop `index.html` on any static HTTPS host (GitHub Pages, Cloudflare Pages, Netlify). HTTPS is required for the future PWA / service-worker path.

## Data sources

- **EiBi shortwave schedule** — © Eike Bierwirth, free to copy & distribute. [eibispace.de](http://www.eibispace.de)
- **POTA spots** — [pota.app](https://pota.app) public API
- **SOTA spots** — [sota.org.uk](https://www.sota.org.uk) public API

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

Current: **v0.6** — spot → prefilled log, Mode + Reference log fields, CSV export with those columns.

## License

Code: MIT (see LICENSE). Schedule data belongs to EiBi/POTA/SOTA under their respective terms — do not relicense the data.
