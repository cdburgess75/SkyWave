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
const UA = { "User-Agent": "SkyWave-nets-mirror/1.0 (+https://github.com/cdburgess75/SkyWave)" };

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
    out.push({ name, freq, mode: (cells[3] || "").toUpperCase(), band: cells[2] || "", ncs, start });
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

nets.sort((a, b) => a.freq - b.freq);
mkdirSync("out", { recursive: true });
writeFileSync("out/nets.json", JSON.stringify({ ts: Date.now(), nets }, null, 1));
console.log(`Wrote out/nets.json — ${nets.length} nets (page declared ${declared ? declared[1] : "?"}).`);
