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

```
http://www.eibispace.de/dx/sked-<code>.csv
```

Fetched through the CORS relay chain (see below) because the EiBi server does
not send CORS headers.

### Courtesy

- Don't fetch more often than necessary (auto-update is once per session / on demand).
- Attribute EiBi in any public deployment: "Shortwave schedule data © Eike Bierwirth, eibispace.de".

---

## NetLogger — live nets in session

**Website:** https://www.netlogger.org
**API endpoints (per server, queried in parallel and merged):**
`GET http://{server}/cgi-bin/NetLogger/GetNetsInProgress20.php?ProtocolVersion=2.3`
Servers: `www.netlogger.org`, `www.netlogger1.org`, `www.netlogger2.org`,
`www.netlogger3.org` (canonical list at `netlogger.org/downloads/ServerList.txt`).
**Used for:** the live half of the Listen → Nets sub-tab.
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
- Requires the CORS relay chain (the API does not send CORS headers).

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

## CORS Relay Chain

Because browser `fetch` enforces CORS and neither EiBi nor NetLogger send
permissive headers, requests are routed through public relays as a fallback:

| Priority | Relay                                      | Notes                        |
|----------|--------------------------------------------|------------------------------|
| 0        | Direct (no relay)                          | Works for NOAA; rarely for EiBi/NetLogger |
| 1        | `https://api.allorigins.win/raw?url=…`     | Most reliable public relay   |
| 2        | `https://corsproxy.io/?url=…`              | Fallback                     |
| 3        | `https://api.codetabs.com/v1/proxy?quest=…` | Last resort                 |

**This is the single biggest reliability risk** (Compromise C1 in
`HANDOFF.md`). Public relays can be rate-limited or disappear without notice.
Data passing through them is public broadcast schedules and public net
information, so privacy impact is minimal.

**Roadmap R6** is a self-hosted Cloudflare Worker relay that would replace the
public chain while retaining the public relays as a fallback.
