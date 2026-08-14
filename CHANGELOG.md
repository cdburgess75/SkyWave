# Changelog

All notable changes to SKYWAVE are documented here.

## [2026.08.14.049] — 2026-08-14

### Removed
- **Antenna calculator** — dropped at the owner's request (unused), along with its markup, logic and wiring.

### Changed
- **The Tools tab and the More sheet are gone entirely; the app is now four flat tabs — Stations · Saved · Prop · Ref — everything one tap from the bottom bar.** With the calculator gone, Tools held only things that belonged elsewhere:
  - **Grayline & band planner** (with **⤓ Calendar reminders** and location controls) moved to the **top of the Prop tab** — sun geometry and band conditions in one place.
  - **Export & print** moved to the **Ref tab**, above the code key.
  This also removes the More bottom-sheet and its scrim, the "nested tabs behind More" pattern that hid the kiosk exit, the refresh button and the callsign field from the person who uses the app most. The desktop side nav simply loses its Tools button.
- README and the User Guide updated to match (four tabs, grayline under Prop, calculator references removed).

### Notes
- The smoke suite's ID-coverage check caught two leftover references (`moreScrim` listener, a 30-second `tab-tools` refresh) before they could ship as boot errors. Verified in headless Chromium: bottom nav is Stations/Saved/Prop/Ref, antenna input and More sheet absent from the DOM, Prop opens with the grayline card first and renders sun times plus the calendar button, Ref shows Export & print, and the Nets tab (rows, ✓ LOGGED badge, callsign setter) is untouched.

---

## [2026.08.14.048] — 2026-08-14

### Changed
- **The callsign field now lives on the Nets tab itself.** `.047` put it in Ref → display settings — which is behind More → Reference, the third control this run of releases to be buried somewhere users had to be told about. Until a callsign is set, the Nets tab shows an inline "your callsign — get ✓ LOGGED when NCS logs you" field right under the filter; save it there (or press Enter) and the field disappears. The Ref setting remains for changing or clearing it later, and the two stay in sync.
- **Tools removed from the phone bottom nav** — it's now a row in the **More** sheet alongside Reference and Propagation, and the More button lights up when Tools is open. Nothing inside Tools changed (antenna calculator, grayline planner and calendar reminders, export/print all still there); the desktop side nav keeps its Tools button since space isn't scarce there. Bottom nav is now Stations · Saved · More.

### Notes
- The inline setter deliberately avoids an element-level `display:flex` style, which would have re-created the `[hidden]`-override bug fixed in `.043`. Verified in headless Chromium: Tools absent from the bottom nav and reachable via More (tab opens, grayline renders, More stays lit); callsign field visible when unset, saving `n5gb` uppercases it, hides the field, badges the net whose roster contains it, and syncs the Ref input.

---

## [2026.08.14.047] — 2026-08-14

### Added
- **Check-in verification.** Tell SkyWave your callsign and it watches the live rosters for you: once net control logs you into a net, that net's row shows a cyan **✓ LOGGED** badge and your entry is highlighted in the expanded roster. This is deliberately *verification*, not remote check-in — checking in happens on the air, net control's log is the only record that counts, and NetLogger's published API is read-only. SkyWave reports what NCS actually logged, which is the one check-in signal that can't lie. (Confirmation lags the mirror's ~hourly refresh.)
- **Callsign step in the first-run wizard.** The setup wizard is now four steps — welcome → location → **callsign (optional, with Skip)** → done. Matching is on base callsigns, so being logged as `KD5XYZ/M` when you gave `KD5XYZ` (or the reverse) still matches. Also settable or changeable any time under **Ref → display settings**; stored on-device only, used for nothing else.

### Notes
- 10 new domain tests cover the matcher (case, portable suffixes both directions, near-miss callsigns, empty/rosterless safety). The full first-run flow was driven in headless Chromium against real mirror data: wizard through all four steps, a lowercase entry saved uppercase, the badge landing on the one net whose roster genuinely contained the test callsign, the roster row highlighted, and everything clearing when the callsign changes.

---

## [2026.08.13.046] — 2026-08-13

### Added
- **Line-of-sight filter for live VHF/UHF nets.** Above ~50 MHz propagation is line of sight, so a 2m net in Rhode Island is unworkable noise in a Louisiana list. Live nets at or above 50 MHz whose nearest locatable participant is farther than a configurable radius — **default 100 miles** — are now hidden. The radius is settable in **Ref → display settings** (50 / 100 / 250 / 500 mi / off).

  How distance is determined, most-honest signal first: the nearest **checked-in station's grid square** from the live roster; failing that, a Maidenhead grid embedded in the net's name (e.g. "Lone Ranger Wellness EL287616"). Nets with no locatable data are **always shown** — hiding on ignorance would make missing grids look like missing nets. HF nets are never filtered; sky wave doesn't care about your horizon.

  Filtering is never silent: a tappable row reports "*N* VHF/UHF nets beyond 100 mi hidden (line of sight) · show", and revealing them is one tap (session-only; the saved setting is unchanged). Expanded live nets now show "Nearest check-in: ~N mi" so the number driving the decision is visible.

### Fixed
- The grid-in-name fallback initially failed on names like `EL287616` — a trailing word-boundary can never match when extra digits follow the square. Found by the new tests before it shipped.

### Notes
- 12 new domain tests: grid decoding (4- and 6-char, garbage→null), haversine sanity, keep/hide policy (near VHF kept, distant VHF hidden, distant HF kept, unlocatable kept, nearest-of-several decides, off-switch, radius boundary). Verified end-to-end in headless Chromium against the real mirror payload: 4 of the day's live nets hidden at 100 mi, reveal/re-hide toggling, "off" restoring all, 500 mi readmitting the ~477-mile net.

---

## [2026.08.09.045] — 2026-08-09

### Added
- **Five Gulf Coast nets in the built-in directory**, each verified against the net's own published schedule (sources in `docs/DATA_SOURCES.md` conventions — nets' own sites and regional net listings):
  - **7290 Traffic Net** — 7290 kHz LSB, 10 AM–noon Central Mon–Sat plus a 1 PM Mon–Fri session (two entries). Independent public-service traffic net running continuously since 1953.
  - **Texas Traffic Net** — 3873 kHz LSB, 6:30 PM Central nightly (NTS). Window crosses 00:00 UTC.
  - **Magnolia Section Net** — 3862 kHz LSB, Mississippi's *morning* section net: 6 AM Central weekdays, 7 AM weekends/holidays (two entries, same frequency as the evening MSPN already listed).
  - **The Friendly Bunch** — 3919 kHz LSB, 7–11 PM Eastern nightly conversational group (the same group that appears in the live NetLogger list when in session).
- These exercise directory shapes that didn't exist before yesterday: weekday-only day filters, a weekend/weekday split on one frequency, and a day-filtered check interacting with the midnight UTC wrap. 12 new tests read the entries the app actually builds; a mutation pass showed the first Texas Traffic Net probes could be fooled by a day-restricted mutant (the midnight wrap credits *yesterday's* day at 0015Z), so midweek probes were added until every mutation fails.

---

## [2026.08.09.044] — 2026-08-09

### Added
- **Shrimpnet** in the built-in net directory — 3881 kHz LSB, 8 PM Central Saturdays. Being a directory entry rather than a live-feed entry, it appears at its scheduled time every week, offline, on-air aware and star-able, independent of the NetLogger mirror.
- **Day-of-week support in the built-in net directory.** `NETDIR` entries can now carry an optional day filter; previously every entry ran daily, so a weekly net had nowhere to express itself. Existing entries are unaffected (an omitted field still means daily).

  Days are evaluated in **UTC**, and that is the trap: an evening net in the Americas falls on the *following* UTC day. Saturday 8 PM Central is Sunday 0100Z — day 7, not 6. Marking it 6 would show the net a day early with nothing on frequency, and nothing would flag it. The format comment now spells this out, and notes carry the local day so the intent stays readable.

### Notes
- The new directory tests read the entry the app actually builds, via `buildBase()`, instead of constructing an equivalent `entry()` in the test. The first version did the latter and was worthless: mutating the day to 6, or making `buildBase` drop the day field entirely, both passed. Rewritten against the real data, all three mutations (wrong day, dropped field, wrong UTC window) fail loudly.

---

## [2026.07.29.043] — 2026-07-29

### Fixed
- **The empty orange box in the header is gone.** The grayline banner from `.042` shipped with a CSS bug: `.grayalert` sets `display:flex`, and any author display rule silently overrides the browser's built-in `[hidden] → display:none` — so the `hidden` attribute did nothing and the banner's empty shell rendered permanently, on every tab, even with no alert active. Alert text is only written when an alert fires, which is why the box was blank.
- **Same bug, second victim:** a computed-style sweep of every `[hidden]` element found the Ref tab's **Clear** button also ignoring `hidden` (via the `.btn` display rule) — visible even with no schedule loaded to clear.
- Fixed with one global `[hidden]{display:none!important}` rule instead of per-element patches, ending the whole bug class; the old per-element `.modal[hidden]` patch is now redundant and removed. A smoke-test guard fails the build if the global rule ever disappears.

Verified by **computed style** this time — the `.042` tests checked the `hidden` property, which is exactly how the bug slipped through: banner hidden in quiet periods, rendering with text during a window, hidden again after; wizard still opens; tabs still switch; sweep reports zero `[hidden]` elements ignoring the attribute.

---

## [2026.07.28.042] — 2026-07-28

### Added
- **Grayline alerts.** The grayline window — the 50 minutes either side of sunrise and sunset — was already computed, but only surfaced as text inside the Tools tab if you happened to be looking at it. Now a banner appears in the header on **every** tab: an amber heads-up **30 minutes** before the window opens, again at **5 minutes**, then a green **"Grayline now"** with the time remaining and the bands worth trying. Dismiss with ✕; the next window re-arms it. Computed on-device from your coordinates, so it works offline.
- **Grayline calendar reminders** (**Tools → Grayline → ⤓ Calendar reminders**). Downloads an `.ics` of the next two weeks of grayline windows, each a 100-minute event with alarms 30 and 5 minutes before it opens. Your own calendar app does the alerting, so **this is the one alert that reaches you with SkyWave closed** — on any platform, with no push server, no subscription endpoint and no third party. The file is generated on-device.

  Real push notifications were considered and rejected: they require a server holding subscriptions, which would reintroduce exactly the third-party dependency removed in `.036`. The calendar route gets the same practical result with none of it.

### Notes
- 24 new checks in `test/domain.mjs` cover the alert phases and the `.ics` output (RFC 5545 line folding, CRLF, block balance, required properties, unique UIDs, 100-minute windows, both alarm triggers, chronological order). Mutation-tested: reverting the time-remaining formula, changing the lead times, or removing line folding each fail loudly.

---

## [2026.07.28.041] — 2026-07-28

### Fixed
- **Kiosk mode now has an exit that can't be lost.** `.040` fixed the toggle logic, but the only way out was still the same button buried in **More → Reference**, three taps and a scroll away — which is no help once the screen is locked into a full-screen view with the browser's own chrome hidden. Kiosk mode now shows a floating **✕ EXIT KIOSK** pill, pinned top-right above everything else, for as long as kiosk is active. **Esc** also exits, and the Reference button still works.
- **Reloading while full-screen no longer strands you.** A service-worker update (or any reload) reset the app's kiosk flag while the browser stayed full-screen, so the app believed kiosk was off and offered no way out of it. On startup the app now adopts the real full-screen state and shows the exit control.

Verified in headless Chromium across three platform profiles — home-screen PWA (full-screen refused), iPhone Safari (no Fullscreen API), and desktop (full-screen granted) — that all three exit routes work and every screen wake lock is released.

---

## [2026.07.28.040] — 2026-07-28

### Fixed
- **Kiosk mode couldn't be turned off** (More → Reference → Kiosk / shack-monitor mode). Tapping it flipped the button to "✕ Exit kiosk" and it stayed that way permanently — every further tap re-entered instead of exiting, and each one acquired another screen wake lock that was never released, so the display kept itself awake with no way to stop short of force-quitting the app.

  Two mistakes compounded. The button label was set **outside** the `try/catch` around `requestFullscreen()`, so it claimed success even when full-screen was refused; and the toggle decided which direction to go by reading `document.fullscreenElement`, which in that case stayed `null` — so "exit" was unreachable. This bites exactly where the feature is most wanted: a home-screen PWA (already full-screen, so the request is refused) and iPhone Safari (no Fullscreen API at all).

  Kiosk state is now tracked explicitly, so the button always toggles the way it reads. Exiting always releases the wake lock even if leaving full-screen throws, and dropping out of full-screen another way (Esc, a system gesture) exits kiosk cleanly.

- **Kiosk mode is now offered on iPhone.** The button was hidden whenever the Fullscreen API was missing, which removed the feature entirely on iPhone Safari — even though Wake Lock is supported there and the keep-the-screen-awake half works fine. It's hidden only when *neither* capability exists, and the toast says which half you got.

- **The screen no longer quietly starts sleeping again.** Browsers drop the wake lock whenever the page is hidden, so locking the phone once ended keep-awake for the rest of the session. It's now re-acquired when the app comes back to the foreground.

Verified in headless Chromium against a simulated home-screen PWA (full-screen advertised but refused): v2026.07.28.039 leaves the button reading "✕ Exit kiosk" across four taps and leaks 4 wake locks; this release alternates correctly and finishes holding 0.

---

## [2026.07.28.039] — 2026-07-28

### Fixed
- **Live nets went blank for most of every hour.** The app rejected the nets mirror whenever it was more than 30 minutes old and fell back to fetching NetLogger live — but that fallback went through the public CORS proxies removed in `.036`, so for anyone without their own relay it could never succeed. The result: "↻ Refreshing live nets in session…" and an empty live list, even though good data was sitting in the mirror.

  The 30-minute limit assumed the mirror refreshes every 10 minutes, as its workflow requests. **It doesn't** — GitHub runs scheduled workflows best-effort and in practice coalesces that cron to roughly hourly (observed gaps on 2026-07-28: 17:05, 18:22, 19:57, 21:03, 22:13 UTC). So the mirror was "too old" for most of each hour by a rule that no longer had a working fallback behind it.

  The mirror is now used **whatever its age** — it's the primary source, and discarding the only data available helps nobody — with a 6-hour ceiling kept purely as a stalled-mirror sanity check. If the mirror is beyond that, the app still tries the relay and *still* falls back to the stale mirror rather than showing nothing.

- **The nets list is no longer hidden while refreshing normal-age data.** `NETS_STALE_MS` (the threshold for hiding a stored list rather than flashing stale data) was 10 minutes — below the mirror's real refresh gap, so the list was hidden nearly always. Raised to 2 hours, which still suppresses genuinely hours-old data on reopen, the case it was added for.

- **The nets status line now states the data's own age** — "Live as of 21:21Z (1 h ago) — mirror refreshes hourly-ish" — instead of implying it just updated. Failure text no longer refers to the public relays that were removed two releases ago.

Verified against a mirror aged to 77 minutes: v2026.07.26.038 showed **0 live nets** with the refreshing placeholder stuck on "Fetching nets in session…"; this release shows all **9**, no placeholder, with the age stated.

---

## [2026.07.26.038] — 2026-07-26

### Fixed
- **Live nets never showed who was checked in.** The mirror has been publishing full check-in rosters since 2026.07.17, but `normNetObj()` — which every incoming net passes through — returned only six fields and silently dropped `roster`, `checkins`, `subs`, `server` and the elapsed timer. Expanding a live net therefore always fell back to "roster appears here once the live feed updates," no matter how many stations were logged in. Rosters, check-in counts and net metadata now come through intact. (Found while removing dead code; the roster screenshots in the docs were rendered from seeded data, which is why it went unnoticed.)

### Changed
- **Removed the dead NetLogger parsers.** The cgi-bin XML and AIM parsers, and the pipe-delimited fallback, targeted endpoints that have returned 404 on every NetLogger server since July 2026. ~80 lines of parser plus 21 tests were maintaining formats nothing could send. `parseNets()` now handles exactly what arrives: the homepage table and JSON.
- **Tests retargeted at the logic that matters.** New `test/domain.mjs` (70 checks) covers what the app's answers actually depend on and what fails silently when broken: on-air windows including the 00:00 UTC wrap, day-of-week rules (digits, two-letter codes, ranges, Sunday-as-7), EiBi season boundaries at the last Sunday of March/October, `sunTimes()` including the polar day/night branches, `parseEibi()` on both file shapes, the schedule sanity gate, and live-net field passthrough. Verified by mutation: deliberately breaking the midnight wrap, the season boundary, and the roster passthrough each produce a clean failure.
- `icon-512.png` added to the service-worker shell so the install icon is available offline.
- Documentation brought back in line with the code: `README`, `HANDOFF` (compromises C1, C4 and C10 now resolved), `docs/ARCHITECTURE.md` and `docs/DATA_SOURCES.md` all described the public relay chain and localStorage-only storage as current. `package.json`'s description still said "Shortwave band guide."

---

## [2026.07.26.037] — 2026-07-26

### Fixed
- **The app no longer claims a schedule was saved offline when it wasn't.** The store was wrapped in a silent `try/catch` (and skipped entirely above 4.5 MB), but the "Stored on-device for offline use" message printed either way — so a device that was out of storage, or a browser in private mode, would tell you the schedule was safe and then have nothing when you went off-grid. Both the manual-load and **Ref → ⟳ Update now** paths now report what actually happened, and say plainly when a schedule is active for this session only.

### Changed
- **The schedule moved from localStorage to IndexedDB.** The EiBi CSV is ~500 KB–1 MB; localStorage is synchronous (the read blocked first paint) and capped near 5 MB per origin shared with favorites, prefs and cached nets. IndexedDB is async and quota-generous, and it reports write failures instead of swallowing them. Existing installs migrate automatically on first launch — the CSV is copied to IndexedDB and the old copy is removed, handing ~1 MB of localStorage quota back. Favorites, prefs, location and heard-today stay in localStorage (small, and wanted synchronously at boot).
- **First paint no longer waits on the stored schedule.** Built-in reference data renders immediately and the schedule loads in behind it.
- **Search index is built on demand.** The lowercase search haystack for all ~9,000 rows was built during every data rebuild (~30 ms of cold-boot main thread, plus the memory) even though most sessions never search. It's now built on first search and cached per row.

---

## [2026.07.26.036] — 2026-07-26

### Changed
- **The EiBi schedule now comes from SkyWave's own mirror — no third-party proxies anywhere.** Fetching the schedule used to fall through a chain of public CORS relays (`allorigins.win`, `corsproxy.io`, `codetabs.com`) because eibispace.de sends no CORS headers. Each of those saw every user's IP and could have returned anything — the only check on the response was "does it contain more than 200 semicolons." A scheduled Action (`.github/workflows/eibi.yml`, `scripts/fetch-eibi.mjs`) now mirrors the CSVs server-side to the `data` branch every day, and the app reads them straight from CORS-open `raw.githubusercontent.com` — the same pattern already used for live nets. All three public relays are removed from the app. EiBi's terms permit copying and redistribution with attribution; the mirror keeps the bytes unmodified and credits EiBi as before.
- **Every season the app can offer is mirrored,** not just the current one, so picking a past or upcoming season in **Ref → Season** works without leaving the mirror.
- **Stronger validation on a downloaded schedule.** A response must be > 50 KB with thousands of delimited rows before it can replace your stored copy; short error pages and truncated transfers are now rejected instead of being saved.
- **Custom relay is now a true fallback,** not a workaround for flaky proxies — the Ref-tab text explains it's only for reaching EiBi/NetLogger directly if the mirror is ever down.

---

## [2026.07.17.035] — 2026-07-17

### Fixed
- **Accented station/net names no longer show as replacement characters (�).** The EiBi schedule and NetLogger feeds are ISO-8859-1 (Latin-1), but were being decoded as UTF-8 — so names like "Coruña Radio", "Educación", and "Rádio Nacional" came out garbled. All feed decoding (EiBi CSV fetch + manual file load in the app, and the NetLogger homepage + check-in-roster API in the mirror) now decodes Latin-1 correctly. Re-run **Ref → ⟳ Update now** once to refresh the stored schedule with corrected names.

### Changed
- **App icon: grayline globe, ringless.** Same "chasing the grayline" globe (curved twilight terminator, shadowed night side) but with the globe running edge-to-edge on the obsidian tile — the electric-cyan limb ring removed. Updates every slot (home-screen / apple-touch, favicon/bookmark, PWA icons); icon URLs bumped to `?v=12`.

---

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
