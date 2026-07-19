// Investigation round 2: /api/GetCheckins.php is live (XML). It needs ServerName
// + NetName. The homepage table gives us both per active net. Confirm we get a
// real roster of checked-in callsigns.

const UA = { headers: { "User-Agent": "Mozilla/5.0 SkyWave-probe" } };
async function get(url) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { ...UA, redirect: "follow" });
    const body = await r.text();
    return { status: r.status, ct: r.headers.get("content-type") || "", body, ms: Date.now() - t0 };
  } catch (e) { return { status: 0, ct: "", body: "ERR " + e.message, ms: Date.now() - t0 }; }
}
function show(label, r, n = 2500) {
  console.log(`\n### ${label}\n   status=${r.status} ct=${r.ct} bytes=${r.body.length} ms=${r.ms}`);
  console.log(r.body.replace(/\s+/g, " ").slice(0, n));
}

// active nets + servers from the homepage table
const home = await get("https://www.netlogger.org/");
const seg = /<!--\s*Begin Currently Active Nets\s*-->([\s\S]*?)<!--\s*End Currently Active Nets\s*-->/i.exec(home.body);
const nets = [];
if (seg) {
  for (const row of seg[1].match(/<tr>\s*<td>[\s\S]*?<\/tr>/gi) || []) {
    const c = [...row.matchAll(/<td>([\s\S]*?)<\/td>/gi)].map(x =>
      x[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim());
    if (c.length < 6) continue;
    nets.push({ name: (c[0] || "").replace(/\s*\(www\)\s*$/i, "").trim(), server: c[4] || "", subs: c[7] || "" });
  }
}
console.log(`active nets: ${nets.length}`);
console.log(nets.slice(0, 8).map(n => `  "${n.name}" @ ${n.server} (subs ${n.subs})`).join("\n"));

// Try GetCheckins with ServerName+NetName for the first few nets, and a couple of
// param-name variants, to lock the exact contract.
const target = nets.find(n => (+n.subs) > 0) || nets[0];
if (target) {
  const nm = encodeURIComponent(target.name), sv = encodeURIComponent(target.server);
  console.log(`\n=== probing roster for "${target.name}" @ "${target.server}" (subs ${target.subs}) ===`);
  for (const url of [
    `https://www.netlogger.org/api/GetCheckins.php?ServerName=${sv}&NetName=${nm}`,
    `https://www.netlogger.org/api/GetCheckins.php?Servername=${sv}&NetName=${nm}`,
    `https://www.netlogger.org/api/GetCheckins.php?ServerName=${sv}&NetName=${nm}&Callsign=SKYWAVE`,
    `https://www.netlogger.org/api/GetNetsInProgress.php`,
  ]) show(url, await get(url));
}
console.log("\nPROBE2 DONE");
