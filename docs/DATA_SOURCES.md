# SKYWAVE — Data Sources

> POTA / SOTA spot APIs are **not** used by SkyWave — operating-side
> features are out of scope for this app.

## EiBi Shortwave Schedule

**Maintained by:** Eike Bierwirth
**Website:** http://www.eibispace.de
**License:** Free to copy and distribute — please attribute EiBi and link to eibispace.de.

### Season codes

| Code   | Period                                         |
|--------|------------------------------------------------|
| `a26`  | Summer 2026 (≈ last Sun Mar → last Sun Oct)    |
| `b26`  | Winter 2026/27 (≈ last Sun Oct → last Sun Mar) |
| `a25`  | Summer 2025                                    |
| `b25`  | Winter 2025/26                                 |

Auto-detected by `seasonCode(date)` using true last-Sunday boundaries
(`lastSun()`). A Jan–late-Mar date maps to the *previous* year's B season.

### CSV format

Semicolon-delimited, ≥11 fields per row:

```
freq_kHz ; HHMM-HHMM ; days ; ITU ; station ; lang ; target ; tx ; persistence ; start ; stop
```

Fields 8–10 (persistence/start/stop) are parsed but not currently used. The
`.txt` frequency-list format is accepted as a fallback but the parser is
heuristic — CSV is the supported path.

### Fetch URL

**Primary path — own-repo mirror (no third party):** a scheduled GitHub Action
(`.github/workflows/eibi.yml`, daily) runs `scripts/fetch-eibi.mjs`, which
fetches every season the app's dropdown can offer from

```
https://www.eibispace.de/dx/sked-<code>.csv
```

server-side and force-pushes the CSVs (bytes unmodified, still ISO-8859-1) to
the single-commit `data` branch. The app reads

```
https://raw.githubusercontent.com/cdburgess75/SkyWave/data/sked-<code>.csv
```

directly — `raw.githubusercontent.com` sends `Access-Control-Allow-Origin: *`,
which eibispace.de does not. **Fallback:** upstream via the user's own relay,
if they configured one. A response must pass `looksLikeSchedule()` (>50 KB,
thousands of delimited rows) before it can replace a stored copy.

### Courtesy

- Don't fetch more often than necessary (auto-update is once per session / on demand).
- Attribute EiBi in any public deployment: "Shortwave schedule data © Eike Bierwirth, eibispace.de".

---

## NetLogger — live nets in session

**Website:** https://www.netlogger.org
**Primary path — own-repo mirror (no third-party relays):** a scheduled
GitHub Action (`.github/workflows/nets.yml`, every ~10 min) runs
`scripts/fetch-nets.mjs`, which queries every NetLogger server server-side,
merges/dedupes, and force-pushes `nets.json` to the single-commit `data`
branch. The app fetches
`https://raw.githubusercontent.com/cdburgess75/SkyWave/data/nets.json`
directly (raw.githubusercontent.com sends `Access-Control-Allow-Origin: *`).
Mirror older than 30 min → fall back to querying the servers live via the
relay chain.
**Fallback path:** the server-rendered "Currently Active Nets" table on
`https://www.netlogger.org/` itself, scraped by `parseNetsHomepage()`, reached
through the user's own relay if configured. (The old cgi-bin
`GetNetsInProgress20.php` XML/AIM API 404s on every server as of July 2026;
its parsers were removed in 2026.07.26.)
**Used for:** the live half of the Listen → Nets sub-tab.

**Per-net check-in roster:** for each active net the mirror also calls
`GET https://www.netlogger.org/api/GetCheckins.php?ServerName={server}&NetName={name}`
(NetLogger public API v1.3.1; `ServerName` is case-sensitive and comes from the
homepage table). The XML `<Checkin>` records are trimmed to ham-public fields
only — callsign, first name, city/state, grid, and a net-control flag — and
folded into `nets.json` as a `roster` array per net. The street address, ZIP,
county, and member id the API also returns are deliberately dropped. Because
the Action fetches this server-side, the app reads rosters from our own mirror
and never calls NetLogger directly. Powers the "who's checked in" list in the
expanded net panel.
**Verified against:** open-source consumers
[ham2k/nets](https://github.com/ham2k/nets) and
[seven1m/ragchew.site](https://github.com/seven1m/ragchew.site), whose test
fixtures capture the wire format verbatim.

### Wire format (production)

Payload sits between HTML comment markers inside the response body:

```
<!--NetLogger Start Data-->
NetName|Freq(MHz)|Logger|NetControl|YYYYMMDDHHMMSS|Mode|Band|AIM|Interval|AltName||Subscribers|~
…more records…
<!--NetLogger End Data-->
```

Fields pipe-separated in fixed order; records terminated by `|~`. Empty
markers = a valid "no nets in session" response (distinct from failure).

### Parsing

`parseNets()` tries four formats in order: **AIM markers** (production,
above) → **XML** (`<NetLoggerXML>` per the older
[XML Data Service spec](https://www.netlogger.org/api/)) → **JSON** →
**generic delimited** (heuristic frequency detection). Anything
unparseable yields `[]` and the UI keeps the cached list.

Anything unparseable yields `[]` and the UI keeps the cached list
(`skywave_nets_v1`, with fetch timestamp) — the feature fails soft.

### Courtesy

- Fetches only when the Nets sub-tab is opened (60 s freshness window) or on
  manual refresh — never on a timer.
- Reads this repo's mirror, so NetLogger sees one polite request per interval from the Action rather than one per user.

### Built-in scheduled nets

Independent of NetLogger, `NETDIR` hard-codes a handful of major HF nets
(Maritime Mobile Service Net, Intercontinental Net, Hurricane Watch Net,
ECARS, MIDCARS) as regular schedule entries — fully offline, on-air aware,
star-able. Times are approximate where published schedules vary; the
Hurricane Watch Net is listed 24 h with an "activated during Atlantic
tropical events" note.

---

## NOAA SWPC — planetary K-index

**Website:** https://www.swpc.noaa.gov
**API endpoint:** `GET https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json`
**Used for:** the Prop tab K-index card and the ≥1280 px right-rail digest.

Returns a JSON array of `[time_tag, Kp, source, …]` rows; the app takes the
most recent `observed` rows, renders the latest value plus an 8-bar trend.
CORS-open — fetched directly with a 7 s timeout (`fetchWithTimeout`), no relay
needed. Color bands: Kp ≤ 2 quiet (green) · 3–4 unsettled (amber) · ≥ 5 storm (red).

---

## HamQSL — solar conditions widget

**Website:** https://www.hamqsl.com — N0NBH / K4HG
**Used for:** the Prop tab solar-conditions image (`solar101pic.php`), linked
to the full HamQSL page. Loaded as a plain `<img>` — no parsing, no relay.
Updates ~every 5 minutes on their side; the app never polls.

---

## Reaching CORS-blocked sources

Neither EiBi nor NetLogger sends permissive CORS headers, so a browser cannot
fetch either one directly. Rather than route users through someone else's
proxy, both feeds are mirrored server-side by scheduled Actions in this repo
and served from the CORS-open `data` branch:

| Feed        | Workflow    | Cadence   | Published as                |
|-------------|-------------|-----------|-----------------------------|
| EiBi        | `eibi.yml`  | daily     | `sked-<code>.csv`, `eibi.json` |
| Live nets   | `nets.yml`  | ~10 min   | `nets.json` (incl. rosters) |

`relays(rawUrl)` remains as a fallback only, and contains just two candidates:
the user's own Cloudflare Worker (`workers/relay.js`, pasted into the Ref tab)
if configured, then a direct hit.

**The public relay chain — `api.allorigins.win`, `corsproxy.io`,
`api.codetabs.com` — was removed in 2026.07.26.** Each could see every user's
IP address and could have returned arbitrary content in place of the schedule;
the only check on the response was a semicolon count. Their removal closes
compromise C1 in `HANDOFF.md`.
