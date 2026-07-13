// One-off generator: project Natural Earth 110m land polygons into a
// north-polar azimuthal equidistant disc (the classic ham grayline-map
// projection) and emit SVG path data for the app icon.
//
// Run by .github/workflows/gen-icon.yml (manual dispatch only); output is
// force-pushed to the single-commit `assets` branch as earth-path.txt.
//
// Projection: r = (90 - lat) · R / (90 - LATMIN), θ = longitude
// (0° points down/6-o'clock; 90°E right; 90°W left). Antarctica excluded
// (all-below-60°S polygons) so the disc rim is clean ocean.

import { mkdirSync, writeFileSync } from "node:fs";

const SRC = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson";
const R = 62, CX = 96, CY = 100, LATMIN = -60;

const res = await fetch(SRC, { signal: AbortSignal.timeout(30000) });
if (!res.ok) { console.error(`fetch: HTTP ${res.status}`); process.exit(1); }
const gj = await res.json();

function pt(lon, lat) {
  lat = Math.max(lat, LATMIN);
  const r = (90 - lat) * R / (90 - LATMIN);
  const a = lon * Math.PI / 180;
  return [CX + r * Math.sin(a), CY + r * Math.cos(a)];
}

let d = "", rings = 0, skipped = 0;
for (const f of gj.features) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    if (poly[0].every((c) => c[1] < -59.9)) { skipped++; continue; } // Antarctica
    for (const ring of poly) {
      let seg = "", px = null, py = null;
      for (const [lon, lat] of ring) {
        const [x, y] = pt(lon, lat);
        const rx = Math.round(x * 10) / 10, ry = Math.round(y * 10) / 10;
        if (px === rx && py === ry) continue;
        seg += (seg ? "L" : "M") + rx + " " + ry;
        px = rx; py = ry;
      }
      if (seg.length > 40) { d += seg + "Z"; rings++; }
    }
  }
}

mkdirSync("out", { recursive: true });
writeFileSync("out/earth-path.txt", d);
console.log(`earth-path.txt: ${d.length} chars, ${rings} rings, ${skipped} antarctic polys skipped`);

// second output: plain equirectangular (0..W × 0..H box) for wall-chart style
const W = 170, H = 85;
let dr = "";
for (const f of gj.features) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    for (const ring of poly) {
      let seg = "", px = null, py = null;
      for (const [lon, lat] of ring) {
        const x = Math.round(((lon + 180) / 360 * W) * 10) / 10;
        const y = Math.round(((90 - lat) / 180 * H) * 10) / 10;
        if (px === x && py === y) continue;
        seg += (seg ? "L" : "M") + x + " " + y;
        px = x; py = y;
      }
      if (seg.length > 40) dr += seg + "Z";
    }
  }
}
writeFileSync("out/earth-rect.txt", dr);
console.log(`earth-rect.txt: ${dr.length} chars`);
