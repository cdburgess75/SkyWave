// Mirror EiBi's broadcast schedule CSVs into out/sked-<code>.csv.
//
// eibispace.de sends no CORS headers, so a browser can't fetch it directly.
// The app used to route around that through public CORS proxies
// (allorigins / corsproxy / codetabs) — three third parties in the critical
// path, each able to see every user's IP and to return whatever it liked.
// Instead we fetch server-side here and publish to the single-commit `data`
// branch, which raw.githubusercontent.com serves CORS-open.
//
// EiBi's terms: "free to copy and distribute" with attribution — see
// docs/DATA_SOURCES.md. The mirror keeps the file byte-identical (Latin-1,
// not re-encoded) and credits EiBi in the app and the README.
//
// Run by .github/workflows/eibi.yml.

import { mkdirSync, writeFileSync } from "node:fs";

const UA = { "User-Agent": "SkyWave-eibi-mirror/1.0 (+https://github.com/cdburgess75/SkyWave)" };

// --- season codes (mirrors index.html's seasonCode/seasonList exactly) ------
// 'a' = summer, starts the last Sunday of March; 'b' = winter, starts the last
// Sunday of October. January..late-March belongs to the PREVIOUS year's b.
function lastSun(y, mo) {
  const d = new Date(Date.UTC(y, mo + 1, 0));
  return d.getUTCDate() - d.getUTCDay();
}
export function seasonCode(d) {
  d = d || new Date();
  const y = d.getUTCFullYear(), mo = d.getUTCMonth(), day = d.getUTCDate();
  const springSun = lastSun(y, 2), fallSun = lastSun(y, 9);
  const inA = (mo > 2 || (mo === 2 && day >= springSun)) && (mo < 9 || (mo === 9 && day < fallSun));
  if (inA) return "a" + String(y).slice(2);
  if (mo < 2 || (mo === 2 && day < springSun)) return "b" + String(y - 1).slice(2);
  return "b" + String(y).slice(2);
}
// Every code the app's season dropdown can offer, so a user who picks a
// non-current season still gets it from the mirror rather than a proxy.
export function seasonList(now) {
  const d = now || new Date();
  const y = d.getUTCFullYear();
  const set = new Set([seasonCode(d)]);
  for (const mo of [0, 5, 11]) set.add(seasonCode(new Date(Date.UTC(y, mo, 15))));
  return [...set];
}

// A real schedule is thousands of semicolon-delimited rows. Anything else is a
// proxy error page or a truncated transfer — never publish it over good data.
export function looksLikeSchedule(text) {
  if (!text || text.length < 50000) return false;
  const semis = (text.match(/;/g) || []).length;
  if (semis < 5000) return false;
  const rows = text.split(/\r?\n/).filter((l) => l.split(";").length >= 7).length;
  return rows >= 1000;
}

async function fetchSeason(code) {
  // https first; EiBi's cert has been fine, but http is a valid fallback here
  // because this runs server-side (no mixed-content rule to trip over).
  for (const url of [`https://www.eibispace.de/dx/sked-${code}.csv`,
                     `http://www.eibispace.de/dx/sked-${code}.csv`]) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (!r.ok) { console.log(`  ${url} → HTTP ${r.status}`); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      // Keep the bytes as they arrived: the file is ISO-8859-1 and the app
      // decodes it as such. Re-encoding here would double-mangle accents.
      const text = new TextDecoder("iso-8859-1").decode(buf);
      if (!looksLikeSchedule(text)) { console.log(`  ${url} → not a schedule (${buf.length} bytes)`); continue; }
      return { buf, text };
    } catch (e) {
      console.log(`  ${url} → ${e && e.message}`);
    }
  }
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const codes = seasonList();
  console.log(`Seasons to mirror: ${codes.join(", ")}`);
  mkdirSync("out", { recursive: true });

  const seasons = {};
  let ok = 0;
  for (const code of codes) {
    console.log(`sked-${code}.csv:`);
    const got = await fetchSeason(code);
    if (!got) { console.log(`  → unavailable (upstream may not have published it yet); skipping`); continue; }
    const rows = got.text.split(/\r?\n/).filter((l) => l.split(";").length >= 7).length;
    writeFileSync(`out/sked-${code}.csv`, got.buf);
    seasons[code] = { bytes: got.buf.length, rows };
    ok++;
    console.log(`  → ${got.buf.length.toLocaleString()} bytes, ${rows.toLocaleString()} rows`);
  }

  // A run that fetched nothing must not publish an empty manifest over a good
  // one — exit non-zero so the publish step is skipped and the branch keeps
  // whatever it already had.
  if (!ok) {
    console.error("No seasons fetched — keeping previously mirrored data.");
    process.exit(1);
  }
  writeFileSync("out/eibi.json", JSON.stringify({ ts: Date.now(), current: seasonCode(), seasons }, null, 1));
  console.log(`Wrote out/eibi.json — ${ok}/${codes.length} seasons mirrored.`);
}
