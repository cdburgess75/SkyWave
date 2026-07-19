// Mirror NetLogger's "Currently Active Nets" into out/nets.json.
//
// NetLogger's old cgi-bin XML/AIM API is gone (404 on every server as of
// July 2026; verified from GitHub runners). The source of truth is the
// server-rendered table on https://www.netlogger.org/ itself, delimited by
// <!-- Begin Currently Active Nets --> / <!-- End Currently Active Nets -->
// with a <!-- CurrentlyActiveNets=N --> count for sanity checking.
//
// Run on a schedule by .github/workflows/nets.yml; the result is
// force-pushed to the single-commit `data` branch, which the app reads via
// raw.githubusercontent.com (CORS-open).

import { mkdirSync, writeFileSync } from "node:fs";

const SOURCE = "https://www.netlogger.org/";
// Live per-net check-in roster (XML). NetLogger's public API v1.3.1; needs the
// exact (case-sensitive) ServerName + NetName from the homepage table. Fetched
// here server-side so the app reads rosters from our own mirror, never calling
// a third party itself.
const ROSTER_API = "https://www.netlogger.org/api/GetCheckins.php";
const UA = { "User-Agent": "SkyWave-nets-mirror/1.0 (+https://github.com/cdburgess75/SkyWave)" };

function xmlTag(block, tag) {
  const m = new RegExp("<" + tag + ">([\\s\\S]*?)</" + tag + ">", "i").exec(block);
  return m ? cellText(m[1]) : "";
}

// Fetch one net's roster, keeping only ham-public fields (callsign, first name,
// city/state, grid, net-control flag). Deliberately drops the street address,
// ZIP, county, and member id the API also returns.
async function fetchRoster(net) {
  if (!net.server || !net.name) return null;
  const url = `${ROSTER_API}?ServerName=${encodeURIComponent(net.server)}&NetName=${encodeURIComponent(net.name)}`;
  try {
    const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    const xml = await r.text();
    if (!/<CheckinList>/i.test(xml)) return null; // error payloads carry <Error> instead
    const count = parseInt(xmlTag(xml, "CheckinCount"), 10) || 0;
    const roster = [];
    for (const blk of xml.match(/<Checkin>[\s\S]*?<\/Checkin>/gi) || []) {
      const call = xmlTag(blk, "Callsign").toUpperCase();
      if (!call) continue;
      const name = (xmlTag(blk, "PreferredName") || xmlTag(blk, "FirstName").split(" ")[0] || "").trim();
      const qth = [xmlTag(blk, "CityCountry"), xmlTag(blk, "State")].filter(Boolean).join(", ");
      const grid = xmlTag(blk, "Grid");
      const nc = call === net.ncs || /\bNC\b/i.test(xmlTag(blk, "QSLInfo"));
      const e = { call };
      if (name) e.name = name;
      if (qth) e.qth = qth;
      if (grid) e.grid = grid;
      if (nc) e.nc = 1;
      roster.push(e);
      if (roster.length >= 120) break; // safety cap on file size
    }
    return { count, roster };
  } catch {
    return null;
  }
}

function netFreqKhz(v) {
  const n = parseFloat(String(v).replace(/[^\d.]/g, ""));
  if (!isFinite(n)) return NaN;
  const k = n <= 1300 ? n * 1000 : n;
  return k >= 1500 && k <= 1300000 ? Math.round(k * 10) / 10 : NaN;
}

function cellText(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

// Table cell order (verified against live markup 2026-07-13):
// 0 Net Name (+ "(www)" link) | 1 Frequency MHz | 2 Band | 3 Mode
// 4 Server Cluster | 5 Start Time UTC "YYYY-MM-DD HH:MM:SS" | 6 Elapsed
// 7 Subscribers | 8 Opened By ("CALL-NAME - vX.Y.ZW")
export function parseHomepage(html) {
  const m = /<!--\s*Begin Currently Active Nets\s*-->([\s\S]*?)<!--\s*End Currently Active Nets\s*-->/i.exec(html);
  const scope = m ? m[1] : html;
  const out = [];
  for (const row of scope.match(/<tr>\s*<td>[\s\S]*?<\/tr>/gi) || []) {
    const cells = [...row.matchAll(/<td>([\s\S]*?)<\/td>/gi)].map((c) => cellText(c[1]));
    if (cells.length < 6) continue;
    const name = cells[0].replace(/\s*\(www\)\s*$/i, "").trim();
    const freq = netFreqKhz(cells[1]);
    if (!name || !isFinite(freq)) continue;
    const start = /\d{4}-\d{2}-\d{2} (\d{2}:\d{2})/.exec(cells[5] || "")?.[1] || "";
    const ncs = ((cells[8] || "").split(/[\s-]/)[0] || "").toUpperCase();
    const subs = parseInt((cells[7] || "").replace(/\D/g, ""), 10) || 0;
    out.push({ name, freq, mode: (cells[3] || "").toUpperCase(), band: cells[2] || "", ncs, start,
      server: cells[4] || "", dur: cells[6] || "", subs });
  }
  return out;
}

const res = await fetch(SOURCE, { headers: UA, signal: AbortSignal.timeout(15000) });
if (!res.ok) {
  console.error(`${SOURCE}: HTTP ${res.status} — keeping previous data.`);
  process.exit(1);
}
const html = await res.text();
const nets = parseHomepage(html);

// sanity: the page states its own count — never publish a wrongly-empty file
const declared = /<!--\s*CurrentlyActiveNets=(\d+)\s*-->/.exec(html);
if (declared && +declared[1] > 0 && nets.length === 0) {
  console.error(`Page declares ${declared[1]} active nets but 0 parsed — markup changed? Keeping previous data.`);
  console.error("First 500 chars of nets section:", (html.match(/Begin Currently Active Nets([\s\S]{0,500})/) || [])[1]);
  process.exit(1);
}

// Attach each net's live roster (sequential — only a handful of nets, and it
// keeps us polite to NetLogger). A failed roster fetch just leaves the net
// without one; the app falls back to showing the subscriber count.
let withRoster = 0;
for (const net of nets) {
  const r = await fetchRoster(net);
  if (r) { net.checkins = r.count; net.roster = r.roster; withRoster++; }
}

nets.sort((a, b) => a.freq - b.freq);
mkdirSync("out", { recursive: true });
writeFileSync("out/nets.json", JSON.stringify({ ts: Date.now(), nets }, null, 1));
console.log(`Wrote out/nets.json — ${nets.length} nets (${withRoster} with rosters; page declared ${declared ? declared[1] : "?"}).`);
