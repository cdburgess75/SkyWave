# SKYWAVE — Data Sources

## EiBi Shortwave Schedule

**Maintained by:** Eike Bierwirth  
**Website:** http://www.eibispace.de  
**License:** Free to copy and distribute — please attribute EiBi and link to eibispace.de.

### Season codes

| Code   | Period                                      |
|--------|---------------------------------------------|
| `a26`  | Summer 2026 (≈ last Sun Mar → last Sun Oct) |
| `b26`  | Winter 2026/27 (≈ last Sun Oct → last Sun Mar) |
| `a25`  | Summer 2025                                 |
| `b25`  | Winter 2025/26                              |

Auto-detected by `seasonCode(date)`. A Jan–late-Mar date maps to the *previous* year's B season.

### CSV format

Semicolon-delimited, ≥11 fields per row:

```
freq_kHz ; HHMM-HHMM ; days ; ITU ; station ; lang ; target ; tx ; persistence ; start ; stop
```

Fields 8–10 (persistence/start/stop) are parsed but not currently used. The `.txt` frequency-list format is accepted as a fallback but the parser is heuristic — CSV is the supported path.

### Fetch URL

```
http://www.eibispace.de/dx/sked-<code>.csv
```

Fetched through the CORS relay chain (see below) because the EiBi server does not send CORS headers.

### Courtesy

- Don't fetch more often than necessary (auto-update is once per session / on demand).
- Attribute EiBi in any public deployment: "Shortwave schedule data © Eike Bierwirth, eibispace.de".

---

## POTA — Parks on the Air

**Website:** https://pota.app  
**API endpoint:** `GET https://api.pota.app/spot/activator`  
**Returns:** JSON array of active spots

### Fields used

| Field         | Type   | Notes                                                        |
|---------------|--------|--------------------------------------------------------------|
| `activator`   | string | callsign                                                     |
| `frequency`   | string | kHz (may have decimal)                                       |
| `mode`        | string | `CW`, `SSB`, `FT8`, etc.                                     |
| `reference`   | string | park reference, e.g. `US-1234`                               |
| `name` / `parkName` | string | park name                                              |
| `spotTime`    | string | ISO 8601 **without** trailing `Z` — must append `"Z"` before parsing |
| `comments`    | string | spotter comments                                             |
| `locationDesc`| string | state / province description                                 |

### Courtesy

- Poll no faster than every 60 seconds.
- Identify politely (User-Agent header or comment in requests if feasible).
- Respect POTA's terms of service.
- POTA's API sends permissive CORS headers, so direct fetch from a browser usually succeeds.

---

## SOTA — Summits on the Air

**Website:** https://www.sota.org.uk  
**API endpoints (tried in order):**

1. `https://api-db2.sota.org.uk/api/spots/40/all`
2. `https://api2.sota.org.uk/api/spots/40/all`
3. `https://api2.sota.org.uk/api/spots/40/`

Returns the most recent 40 spots across all bands/modes.

### Fields used

| Field                           | Type   | Notes                                           |
|---------------------------------|--------|-------------------------------------------------|
| `activatorCallsign` / `activator` | string | callsign                                      |
| `frequency`                     | string | **MHz** — multiply × 1000 for kHz               |
| `mode`                          | string | lowercase → normalize to uppercase              |
| `summitCode`                    | string | if no `/`, prepend `associationCode + "/"`      |
| `summitDetails` / `summitName`  | string | summit name                                     |
| `timeStamp`                     | string | ISO 8601 with Z                                 |
| `comments`                      | string | spotter comments                                |
| `associationCode`               | string | association prefix (e.g. `W5`)                  |

### Courtesy

- Poll no faster than every 60 seconds.
- SOTA's API is more restrictive about cross-origin browser access than POTA's; usually requires the CORS relay chain.

---

## CORS Relay Chain

Because browser `fetch` enforces CORS and neither EiBi nor SOTA send permissive headers, requests are routed through public relays as a fallback:

| Priority | Relay                              | Notes                          |
|----------|------------------------------------|--------------------------------|
| 0        | Direct (no relay)                  | Works for POTA; rarely for EiBi/SOTA |
| 1        | `https://api.allorigins.win/raw?url=…` | Most reliable public relay  |
| 2        | `https://corsproxy.io/?…`          | Fallback                       |
| 3        | `https://thingproxy.freeboard.io/fetch/…` | Last resort               |

**This is the single biggest reliability risk** (Compromise C1 in `HANDOFF.md`). Public relays can be rate-limited or disappear without notice. Data passing through them is public broadcast schedules and public spot information, so privacy impact is minimal.

**Roadmap R6** is a self-hosted Cloudflare Worker relay that would replace the public chain while retaining the public relays as a fallback.
