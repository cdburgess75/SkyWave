// Fetch NetLogger nets-in-progress from all servers, merge, and write
// out/nets.json. Run on a schedule by .github/workflows/nets.yml — the
// result is force-pushed to the single-commit `data` branch, which the
// app reads via raw.githubusercontent.com (CORS-open) with the public
// relay chain as fallback. Mirrors parseNetsAIM() in index.html.

import { mkdirSync, writeFileSync } from "node:fs";

const SERVERS = [
  "https://www.netlogger.org",
  "http://www.netlogger1.org",
  "http://www.netlogger2.org",
  "http://www.netlogger3.org",
];
const PATH = "/cgi-bin/NetLogger/GetNetsInProgress20.php?ProtocolVersion=2.3";

function netFreqKhz(v) {
  const n = parseFloat(String(v).replace(/[^\d.]/g, ""));
  if (!isFinite(n)) return NaN;
  const k = n <= 1300 ? n * 1000 : n;
  return k >= 1500 && k <= 1300000 ? Math.round(k * 10) / 10 : NaN;
}

function parseAIM(text) {
  const m = /<!--\s*NetLogger Start Data\s*-->([\s\S]*?)<!--\s*NetLogger End Data\s*-->/.exec(text);
  if (!m) return null;
  const out = [];
  for (let rec of m[1].split("|~")) {
    rec = rec.trim();
    if (!rec) continue;
    const f = rec.split("|").map((x) => x.trim());
    if (f.length < 7) continue;
    const freq = netFreqKhz(f[1]);
    if (!isFinite(freq)) continue;
    const st = f[4] || "";
    const start = /^\d{12,14}$/.test(st) ? st.slice(8, 10) + ":" + st.slice(10, 12) : st;
    out.push({ name: f[0], freq, mode: (f[5] || "").toUpperCase(), ncs: (f[3] || "").toUpperCase(), band: f[6] || "", start });
  }
  return out;
}

const seen = new Set();
const nets = [];
let reached = 0;

for (const server of SERVERS) {
  try {
    const res = await fetch(server + PATH, {
      headers: { "User-Agent": "SkyWave-nets-mirror/1.0 (+https://github.com/cdburgess75/SkyWave)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) { console.error(`${server}: HTTP ${res.status}`); continue; }
    const list = parseAIM(await res.text());
    if (list === null) { console.error(`${server}: no AIM markers in response`); continue; }
    reached++;
    for (const n of list) {
      const k = n.name + "|" + n.freq;
      if (!seen.has(k)) { seen.add(k); nets.push(n); }
    }
    console.log(`${server}: ${list.length} nets`);
  } catch (e) {
    console.error(`${server}: ${e.message}`);
  }
}

if (reached === 0) {
  console.error("No NetLogger server reachable — keeping previous data (exiting non-zero).");
  process.exit(1);
}

nets.sort((a, b) => a.freq - b.freq);
mkdirSync("out", { recursive: true });
writeFileSync("out/nets.json", JSON.stringify({ ts: Date.now(), nets }, null, 1));
console.log(`Wrote out/nets.json — ${nets.length} nets from ${reached} server(s).`);
