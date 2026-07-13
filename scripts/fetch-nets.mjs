// Fetch NetLogger nets-in-progress from all servers, merge, and write
// out/nets.json. Run on a schedule by .github/workflows/nets.yml — the
// result is force-pushed to the single-commit `data` branch, which the
// app reads via raw.githubusercontent.com (CORS-open) with the public
// relay chain as fallback. Mirrors parseNetsAIM() in index.html.

import { mkdirSync, writeFileSync } from "node:fs";

// Server discovery per the real NetLogger client flow (confirmed via
// ragchew.site): ServerList.txt names the live net servers; the cgi-bin
// endpoints live on THOSE hosts, not necessarily on the main website.
const SERVER_LIST_URL = "https://www.netlogger.org/downloads/ServerList.txt";
const FALLBACK_SERVERS = ["www.netlogger.org", "www.netlogger1.org", "www.netlogger2.org", "www.netlogger3.org", "www.netlogger4.org"];
const PATH = "/cgi-bin/NetLogger/GetNetsInProgress20.php?ProtocolVersion=2.3";

async function discoverServers() {
  try {
    const res = await fetch(SERVER_LIST_URL, {
      headers: { "User-Agent": "SkyWave-nets-mirror/1.0 (+https://github.com/cdburgess75/SkyWave)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) { console.error(`ServerList.txt: HTTP ${res.status}`); return FALLBACK_SERVERS; }
    const text = await res.text();
    console.log("--- ServerList.txt (first 2000 chars) ---\n" + text.slice(0, 2000) + "\n----------------------------------------");
    // hosts are on the non-comment lines; take every hostname-looking token as-is
    const hosts = [];
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim() || line.trim().startsWith("#")) continue;
      for (const m of line.matchAll(/([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi)) {
        const h = m[1].toLowerCase();
        if (!hosts.includes(h)) hosts.push(h);
      }
    }
    console.log("Hosts found in ServerList:", hosts.join(", ") || "(none)");
    return hosts.length ? hosts.slice(0, 8) : FALLBACK_SERVERS;
  } catch (e) {
    console.error(`ServerList.txt: ${e.message}`);
    return FALLBACK_SERVERS;
  }
}

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
const UA = { "User-Agent": "SkyWave-nets-mirror/1.0 (+https://github.com/cdburgess75/SkyWave)" };

// diagnostic: find the endpoint the website's own "nets in progress" display uses
async function probePage(url) {
  try {
    const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(10000) });
    const html = await res.text();
    const attrs = [...new Set([...html.matchAll(/(?:href|src|action)\s*=\s*["']([^"'#]+)["']/gi)].map((m) => m[1]))]
      .filter((u) => !/\.(css|png|jpe?g|gif|svg|ico|woff2?)(\?|$)/i.test(u));
    const jsUrls = [...new Set([...html.matchAll(/(?:fetch|open)\s*\(\s*["']([^"']+)["']/gi)].map((m) => m[1]))];
    console.log(`--- ${url} (HTTP ${res.status}, ${html.length} bytes) ---`);
    console.log("links/src/action:", attrs.slice(0, 40).join("  ") || "(none)");
    if (jsUrls.length) console.log("js fetch/open:", jsUrls.slice(0, 15).join("  "));
    if (/Nets in Progress/i.test(html)) {
      const i = html.search(/Nets in Progress/i);
      console.log("…context around 'Nets in Progress':\n" + html.slice(Math.max(0, i - 200), i + 600).replace(/\s+/g, " "));
    }
  } catch (e) { console.error(`${url}: ${e.message}`); }
}
await probePage("https://www.netlogger.org/");
await probePage("https://www.netlogger.org/pastnets/DisplayPastNetList.php");
// does the old cgi tree exist at all?
for (const p of ["/cgi-bin/NetLogger/GetServerInfo.pl", "/cgi-bin/NetLogger/"]) {
  try {
    const r = await fetch("http://www.netlogger.org" + p, { headers: UA, redirect: "manual", signal: AbortSignal.timeout(8000) });
    console.log(`http://www.netlogger.org${p}: HTTP ${r.status}${r.headers.get("location") ? " → " + r.headers.get("location") : ""}`);
  } catch (e) { console.error(`${p}: ${e.message}`); }
}

const servers = await discoverServers();
console.log("Servers to query:", servers.join(", "));

// ServerList says port 80 — probe http first, then https, no silent redirects
for (const host of servers) {
  for (const scheme of ["http", "https"]) {
    const url = scheme + "://" + host + PATH;
    try {
      const res = await fetch(url, { headers: UA, redirect: "manual", signal: AbortSignal.timeout(10000) });
      if (res.status >= 300 && res.status < 400) {
        console.error(`${url}: HTTP ${res.status} → ${res.headers.get("location")}`);
        continue;
      }
      if (!res.ok) { console.error(`${url}: HTTP ${res.status}`); continue; }
      const body = await res.text();
      const list = parseAIM(body);
      if (list === null) {
        console.error(`${url}: 200 but no AIM markers — first 300 chars:\n${body.slice(0, 300)}`);
        continue;
      }
      reached++;
      for (const n of list) {
        const k = n.name + "|" + n.freq;
        if (!seen.has(k)) { seen.add(k); nets.push(n); }
      }
      console.log(`${url}: ${list.length} nets`);
      break; // this host worked on this scheme; skip the other scheme
    } catch (e) {
      console.error(`${url}: ${e.message}`);
    }
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
