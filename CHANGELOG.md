# Changelog

All notable changes to SKYWAVE are documented here.

## [2026.07.17.033] — 2026-07-17

### Changed
- **App icon: "chasing the grayline."** Bigger globe filling the tile, with a soft curved twilight terminator sweeping across it and the night side easing into shadow — the grayline DXers chase — over the obsidian tile with the electric-cyan limb ring. Updates every slot (home-screen / apple-touch, favicon/bookmark, PWA icons); icon URLs bumped to `?v=11`.

---

## [2026.07.17.032] — 2026-07-17

### Changed
- **App icon retinted to the obsidian tactical palette** (home-screen / apple-touch, favicon/bookmark, and PWA icons): US-centered Earth with neon-amber (`#FF9F1C`) continents on a blue ocean over an obsidian (`#0B1325`) tile, ringed with an electric-cyan (`#00E5FF`) limb. SVG + 512/180px PNGs regenerated; icon URLs bumped to `?v=10`.
- **Fixed the PWA manifest screenshots** — they pointed at the old `docs/screenshot-*.png` (removed when screenshots moved to `docs/images/`). Now reference the current images with correct dimensions and fresh labels.

---

## [2026.07.17.031] — 2026-07-17

### Changed
- **New dark-theme palette — "obsidian tactical."** Deeper obsidian background (`#0B1325`) with cobalt-slate cards (`#152238` / `#203354` borders), brighter neon-amber (`#FF9F1C`) for frequencies and titles, an electric-cyan (`#00E5FF`) local clock / grid / accent, and a toxic-neon-green (`#39FF14`) reserved strictly for live status — the Zulu clock and the LIVE / ON-AIR pills. Secondary metadata (net control, language, times) moves to a muted gray-blue (`#8F9BB3`) so the neon reads as signal, not decoration. Obsidian `theme-color` + manifest to match. Light theme unchanged apart from the same muted-metadata treatment.

---

## [2026.07.17.030] — 2026-07-17

### Fixed
- **No more stale "nets in session" after reopening.** When the app is reopened after a long time, it used to paint the last-saved live-net list (potentially hours old) for 10–15 s while the background fetch ran. Now, if the saved list is stale (> 10 min), the live section shows a clear **"↻ Refreshing live nets in session…"** placeholder instead of the outdated data until fresh results arrive (the always-valid "starting soon" and scheduled-net sections stay visible; if the refresh fails, it falls back to the old list with a note).
- **Refresh on resume.** iOS often restores a PWA from memory rather than reloading it, so the old frame lingered. SkyWave now listens for the app returning to the foreground and immediately resyncs the clocks and refreshes whatever view is showing.

---

## [2026.07.17.029] — 2026-07-17

### Fixed
- **Header no longer balloons / clips at the largest text size.** Rebalanced the header to minimize its height: the database-status line was pulled out of the clock row (it was stealing width and forcing the two clocks to stack into two rows), the clocks are slightly smaller (26→22px) and now stay side-by-side, and the grid + database status share one compact line. Tightened header padding and raised the collapse `max-height` so content can't get cut off. Much shorter header → more room for content, especially at Large/Larger font sizes.

---

## [2026.07.17.028] — 2026-07-17

### Changed
- **Amber row highlight instead of green.** The box (border + left accent) around an on-air station/net now uses the golden amber accent rather than green — better looking and coordinated with the rest of the UI. The green **LIVE** / **ON AIR** badges are unchanged.
- **"Listen" → "Stations"** in the bottom (and side) navigation.

---

## [2026.07.17.027] — 2026-07-17

### Changed
- **Leaner header.** Removed the Kiosk button from the header's top-right (it was overflowing/clipping on narrow screens, especially at larger text sizes) and shrank the text-size and theme buttons — the header now stays compact so more content shows. Kiosk / shack-monitor mode moved to **Ref → Display** with a short description; it works exactly as before.

---

## [2026.07.17.026] — 2026-07-17

### Changed
- **Cleaner header controls + a text-size button.** The header's top-right controls are now a unified set of rounded pill buttons: a new **A A** text-size toggle (cycles Normal → Large → Larger, highlights when enlarged), the light/dark toggle, and Kiosk — much easier to tell apart.
- **Themed sun/moon icons.** The theme toggle is now a crisp SVG: an **orange sun** in light mode and a **blue moon** in dark mode.
- **Bigger bottom-nav labels.** The Listen / Saved / Tools / More labels went from 7.5px to 10.5px (icons 16→19px) so they're comfortably readable.

---

## [2026.07.17.025] — 2026-07-17

### Changed
- **Accurate positioning: it's more than shortwave.** Verified against the live EiBi schedule that SkyWave covers **9,246 broadcasts from ~16 kHz to 26 MHz** — 51 longwave/VLF, 719 mediumwave (AM band), and 8,476 shortwave. Header tagline, `<title>`, social/meta descriptions, and the manifest now read **"World Band + Ham Nets"** (longwave · mediumwave · shortwave + live amateur-radio HF nets) instead of "Shortwave Band Guide."
- **README refreshed** with new navy-theme screenshots (live ham nets with an expanded check-in roster; On Air showing mediumwave + shortwave), rewritten overview and feature copy, and prominent billing for the live HF ham nets and check-in rosters.

---

## [2026.07.17.024] — 2026-07-17

### Changed
- **Dark theme recolored to match the Midnight icon.** The pure-black background and panels become deep navy (`#0b1626` bg, navy cards with blue borders), and the amber accent is nudged to the icon's gold — so the app and its icon read as one piece. Green/blue shack clocks and the green LIVE/ON-AIR badges carry over unchanged. Light theme is untouched. Navy `theme-color` + manifest to match.

---

## [2026.07.17.023] — 2026-07-17

### Changed
- **New app icon: "Midnight" — US-centered Earth.** Gold continents on a blue ocean globe over a midnight-navy tile, spun to an orthographic view centered on the United States (Americas front and center). Coastlines re-projected on the fly from the Natural Earth data with proper hemisphere clipping, so edges stay crisp to the limb. SVG + 512/180px PNGs regenerated; icon URLs bumped to `?v=9`.

---

## [2026.07.17.022] — 2026-07-17

### Added
- **Live check-in roster in the expanded net panel.** Tapping a net in session now shows exactly who's checked in — each station's callsign, first name, city/state, and grid, with the net control marked **NC**. Pulled from NetLogger's public check-in API (`GetCheckins.php`) **server-side by the mirror Action** and folded into `nets.json`, so the app reads rosters from our own feed and never calls a third party directly — still dependency-free and offline-capable.
- Privacy: only ham-public fields are mirrored (callsign, first name, city/state, grid, net-control flag). The street address, ZIP, county, and member id the API also returns are deliberately dropped.

---

## [2026.07.17.021] — 2026-07-17

### Added
- **Tap a net to expand it for details.** Live (in-session) nets expand to a panel with frequency, band, mode, net control, start time, running time (computed live), server, and how many stations are checked in. Built-in scheduled nets expand to show frequency, mode, the UTC schedule window, coverage area, on-air status, and the schedule note. A chevron marks expandable rows and open panels persist across the auto-refresh.
- The live-net parser (app + mirror) now also captures **server**, **elapsed**, and **subscriber count** from the NetLogger feed.

### Notes
- The individual roster of checked-in callsigns isn't part of the offline feed (it lives on NetLogger's per-net page, which would require a per-net third-party call). The expansion shows the **count** and links out to NetLogger for the live roster.

---

## [2026.07.17.020] — 2026-07-17

### Changed
- **Live-net tag reworked for readability.** The glowing pale "IN SESSION" pill (hard to read, over-bright) is now a compact solid-green **● LIVE** badge with a fixed color that stays legible on both light and dark backgrounds — no bloom.

---

## [2026.07.17.019] — 2026-07-17

### Fixed
- **Both clocks now stay pinned when the header minimizes on scroll** (matching PileUp). Previously the local clock was hidden in the collapsed sticky header, leaving only Zulu; now the collapsed header keeps both the Zulu and local clocks side by side (labels drop, only the database-status line hides).

---

## [2026.07.17.018] — 2026-07-17

### Changed
- **Header & clocks now mirror PileUp exactly.** Version stacked directly under the wordmark in a `brandcol` (amber-dim). UTC clock labeled **Zulu**; the local clock now runs at the same size with seconds (`HH:MM:SS`) and a live short-timezone label (CDT / PST / GMT+1…) updated each tick, matching PileUp's shack-clock behavior. Clock gap tightened to `18px`.

---

## [2026.07.17.017] — 2026-07-17

### Changed
- **Unified visual identity with the companion app PileUp.** SkyWave now shares PileUp's exact design language so the two read as a set:
  - **New logo:** a flat amber tile (`#f0923c`) with the real Natural Earth continents as an amber "porthole" globe on a dark disc — PileUp's flat, minimalist icon family. SVG + 512/180px PNGs regenerated; icon URLs bumped to `?v=8`.
  - **Color tokens synced** for both light and dark themes — accent greens/blues, ink tones, and PileUp's cleaner light background (`#F9FBFF`). Pure-black `#000000` theme-color/manifest to match.
  - **Shack-clock treatment:** UTC clock now neon-green, local clock neon-blue (glowing in dark, flat in light), matching PileUp.

---

## [2026.07.17.016] — 2026-07-17

### Changed
- **Icon: "Sand" — lighter tile background.** The Mono Gold globe (single-hue gold land on a dark gold-brown ocean, amber grayline) now sits on a light sand/cream tile instead of near-black, so the dark globe reads as a crisp silhouette. Icon URLs bumped to `?v=7`; SVG + 512px and 180px PNGs regenerated.

---

## [2026.07.13.015] — 2026-07-13

### Changed
- **Icon: "Dusk Gold" chosen from a five-option lineup** — gold Natural Earth continents on a deep indigo polar disc, diagonal amber grayline with the night shadow sweeping the lower-left. Icon URLs bumped to `?v=6`.

---

## [2026.07.13.014] — 2026-07-13

### Changed
- **Icon: real land masses.** The stylized continents were judged cartoonish — the icon now carries genuine Natural Earth 110m coastlines, projected on-runner into the north-polar azimuthal disc by a new dispatch-only workflow (`gen-icon.yml` + `scripts/gen-earth-paths.mjs`, output via the `assets` branch). Africa, Eurasia, the Americas, and the Arctic are recognizably themselves; crisp sage land fills, tight amber grayline, sharper styling throughout. Icon URLs bumped to `?v=5`.

---

## [2026.07.13.013] — 2026-07-13

### Changed
- **Icon: polar grayline map** (owner's concept) — pole-centered flat-Earth disc in the style of classic ham grayline charts: stylized continents around the pole, radial lat/long graticule, the night shadow sweeping the lower disc with the map visible through it, and the glowing amber grayline at the day/night boundary. Icon URLs bumped to `?v=4`.

---

## [2026.07.13.012] — 2026-07-13

### Changed
- **Icon, final form: the grayline itself.** Earth from space — day side as a blue wireframe globe, night side dark with amber city lights, and the glowing amber terminator running down the middle: the grayline the app is built around (owner's concept). Icon URLs bumped to `?v=3` so every cache fetches the new art.

---

## [2026.07.13.011] — 2026-07-13

### Fixed
- **New icon wasn't reaching devices** — remove/re-add still showed the old art because the icon kept the same filename, so Safari and the GitHub Pages CDN served cached copies. All icon URLs (`apple-touch-icon`, favicon, manifest entries, service-worker shell) now carry a `?v=2` cache-buster, forcing a fresh download everywhere.

---

## [2026.07.13.010] — 2026-07-13

### Changed
- **Version number moved under the SKYWAVE logo** in the header (small dim line above the grid square); removed from the right-side status text, which now only reports schedule state. Hides with the brand when the header minimizes on scroll.
- **Icon redesigned (take two)** — the previous double-hop art read as golden arches. Now a single asymmetric hop: steep launch off the tower, one skip-flash on the ionosphere, long glide to the far horizon — under a glowing crescent moon. SVG + 512/180 PNGs regenerated. (Remove and re-add the home-screen icon to see it — iOS caches icons.)

---

## [2026.07.13.009] — 2026-07-13

### Added
- **"Starting soon" on the Nets tab** — scheduled nets from the built-in directory that begin within the next 60 minutes get their own section between the live list and the full directory, each with an amber countdown tag ("IN 25 MIN", "ANY MIN"). Day-of-week aware, midnight-safe, refreshes with the 30-second tick, respects the text filter, and 24-hour listings (Hurricane Watch) are excluded since they never "start". Fully offline. Verified with a frozen-clock boot test (7 checks).

---

## [2026.07.13.008] — 2026-07-13

### Fixed
- **Header overflow at larger font zoom** (field-reported with screenshot): the status text clipped mid-word off the right edge and the page gained a sideways scroll, making the sticky header look detached. The now-longer version string is one unbreakable token; with font zoom up, the clocks row exceeded the viewport. The clocks row now wraps, the status block can break long tokens (`overflow-wrap:anywhere`), and `overflow-x:clip` on the body guarantees no horizontal scroll at any zoom.

---

## [2026.07.13.007] — 2026-07-13

### Changed
- **New icon** — replaced the text-only tile with skywave propagation art: an amber HF signal launched from an antenna tower, double-hopping off a glowing ionosphere band under a starfield, landing on the far horizon. SVG + PNGs (512/180) regenerated.
- **Home-screen label is now "SkyWave"** (capital S and W, one word) in both the iOS title meta and the PWA manifest. Note: iOS caches home-screen icons — remove the app from the home screen and re-add it to see the new icon and label.

---

## [2026.07.13.006] — 2026-07-13

### Fixed
- **Live nets, root cause finally proven and fixed.** Running the mirror from GitHub's servers (full network access) showed NetLogger's old cgi-bin API returns **404 on every server** — it no longer exists. The real source is the server-rendered "Currently Active Nets" table on the netlogger.org homepage itself (as the owner said all along). The mirror and the app's fallback now parse that table (name, frequency, band, mode, start time, NCS from "Opened By"), verified against live markup captured in the workflow logs. A `CurrentlyActiveNets=N` sanity check prevents ever publishing a wrongly-empty list. 7 new parser tests (35 total); XML/AIM parsers retained as fallbacks.

---

## [2026.07.13.005] — 2026-07-13

### Added
- **Live nets now come from the app's own repo — no third-party relays in the primary path.** Browsers can't read netlogger.org directly (no CORS headers), and field evidence showed the public proxies failing for NetLogger while EiBi worked. Fix: a scheduled GitHub Action (`.github/workflows/nets.yml` + `scripts/fetch-nets.mjs`) fetches all four NetLogger servers server-side every ~10 minutes, merges/dedupes, and publishes `nets.json` to a single-commit `data` branch. The app reads it straight from `raw.githubusercontent.com` (CORS-open, same GitHub that already hosts the app). Live servers via the relay chain remain only as a fallback when the mirror is older than 30 minutes. The "Updated" time shown is the mirror's real fetch time.
- **Optional custom relay field** (Ref → Custom relay) + `workers/relay.js` for anyone who wants their own private relay — entirely optional, nothing depends on it. Stored in `PREFS.relay`, tried first when set (helps EiBi too).

---

## [2026.07.13.004] — 2026-07-13

*QA-audit remediation.*

### Added
- **Global error surface** — `window` `error`/`unhandledrejection` handlers plus a pure-HTML red fallback bar ("⚠ Something went wrong — … Tap to reload"). A script failure now tells the user instead of freezing silently; the reload link works even if the main script never ran. Verified by driving a real uncaught throw in-browser.

### Fixed
- **Nets fetch could wedge permanently** — `openNets()` set its in-flight flag without `try/finally`, and a parser throw inside `getNets()` escaped the fetch guards; either would leave `netsFetching=true` forever, silently disabling all future live-nets fetches until reload. Flag now cleared in `finally`; each server's response parses inside its own `try` so one bad payload can't sink the merge.

---

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
