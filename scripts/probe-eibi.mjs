// One-off: what frequency range does EiBi's sked-a26.csv actually cover?
// Determines whether SkyWave's schedule includes long/medium wave, not just SW.
const URL = "http://www.eibispace.de/dx/sked-a26.csv";
const r = await fetch(URL, { headers: { "User-Agent": "SkyWave-probe" }, redirect: "follow" });
console.log("status", r.status, r.headers.get("content-type"));
const txt = await r.text();
const lines = txt.split(/\r?\n/).filter(l => l && /^\s*\d/.test(l));
const freqs = [];
for (const l of lines) {
  const f = parseFloat(l.split(";")[0]);
  if (isFinite(f)) freqs.push(f);
}
freqs.sort((a, b) => a - b);
const n = freqs.length;
const lw = freqs.filter(f => f < 530).length;                 // long wave (<530 kHz)
const mw = freqs.filter(f => f >= 530 && f < 1700).length;    // medium wave
const sw = freqs.filter(f => f >= 1700).length;                // shortwave+
console.log(`entries: ${n}`);
console.log(`min ${freqs[0]} kHz   max ${freqs[n - 1]} kHz`);
console.log(`long wave  (<530):     ${lw}`);
console.log(`medium wave (530-1700): ${mw}`);
console.log(`shortwave  (>=1700):    ${sw}`);
console.log("lowest 12:", freqs.slice(0, 12).join(", "));
// a few sample low-band station lines
console.log("\nsample sub-1700 lines:");
for (const l of lines) {
  const f = parseFloat(l.split(";")[0]);
  if (f < 1700) { console.log("  " + l.slice(0, 90)); }
}
