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
**API endpoint:** `GET https://www.netlogger.org/api/GetNetsInProgress.php?ProtocolVersion=2.3`
**Used for:** the live half of the Listen → Nets sub-tab.

### Parsing

The service returns **XML** under a `<NetLoggerXML>` root (per the
[XML Data Service Interface Specification](https://www.netlogger.org/api/)),
which instructs clients to parse tolerantly and ignore unknown nodes.
`parseNets()` tries three formats in order:

1. **XML** (the documented format) — every `<Net>` element, reading both
   child elements (`<NetName>…</NetName>`) and attributes
   (`<Net NetName="…">`), entities decoded, field names matched
   case-insensitively (`NetName`, `Frequency`, `Mode`, `NetControl`, `Band`,
   `Date`/`StartTime`).
2. **JSON** — an array (or `{nets:[…]}`) of objects, same field mapping.
3. **Delimited** — records separated by `~`, fields by `|`; the frequency
   field is located heuristically (first numeric token that lands in a
   1.5 MHz – 1.3 GHz window after MHz→kHz normalization). Records starting
   with `*` (status markers) are skipped.

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
