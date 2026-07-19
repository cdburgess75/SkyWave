// One-off investigation: does NetLogger expose a per-net check-in roster we can
// scrape server-side (from an Action) to fold into our own mirror?
// Prints findings to the Action log. Commits nothing.

const UA = { headers: { "User-Agent": "Mozilla/5.0 SkyWave-probe" } };

async function get(url, opts = {}) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { ...UA, ...opts, redirect: "follow" });
    const body = await r.text();
    return { ok: r.ok, status: r.status, ct: r.headers.get("content-type") || "", body, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, status: 0, ct: "", body: "ERR " + e.message, ms: Date.now() - t0 };
  }
}

function show(label, r, n = 500) {
  console.log(`\n### ${label}`);
  console.log(`   status=${r.status} ct=${r.ct} bytes=${r.body.length} ms=${r.ms}`);
  const snip = r.body.replace(/\s+/g, " ").slice(0, n);
  console.log("   " + snip);
}

const HOSTS = ["https://www.netlogger.org", "https://netlogger.org"];

// 1) Homepage — pull the active-nets table and inspect its raw markup for any
//    per-net link / anchor that would lead to a roster view.
const home = await get("https://www.netlogger.org/");
console.log(`HOMEPAGE status=${home.status} bytes=${home.body.length}`);
const seg = /<!--\s*Begin Currently Active Nets\s*-->([\s\S]*?)<!--\s*End Currently Active Nets\s*-->/i.exec(home.body);
let netName = "", server = "";
if (seg) {
  const firstRow = (seg[1].match(/<tr>\s*<td>[\s\S]*?<\/tr>/i) || [])[0] || "";
  console.log("\n### FIRST ACTIVE-NET ROW (raw markup)\n" + firstRow.slice(0, 1200));
  const cells = [...firstRow.matchAll(/<td>([\s\S]*?)<\/td>/gi)].map(c =>
    c[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim());
  netName = (cells[0] || "").replace(/\s*\(www\)\s*$/i, "").trim();
  server = cells[4] || "";
  console.log(`\n   parsed netName="${netName}"  server="${server}"`);
  // any hrefs/onclicks inside the name cell?
  const links = firstRow.match(/href="[^"]*"|onclick="[^"]*"|NetName=[^"&<]*/gi) || [];
  console.log("   links/handlers in row: " + (links.slice(0, 10).join(" | ") || "(none)"));
} else {
  console.log("!! could not locate Currently Active Nets markers");
}

if (!netName) netName = "Test";
const enc = encodeURIComponent(netName);

// 2) Battery of candidate roster endpoints (NetLogger client-protocol style + guesses)
const paths = [
  `/cgi-bin/NetLogger/GetCheckList20.php?NetName=${enc}&ProtocolVersion=2.3`,
  `/cgi-bin/NetLogger/GetCheckins20.php?NetName=${enc}&ProtocolVersion=2.3`,
  `/cgi-bin/NetLogger/GetMonitorData20.php?NetName=${enc}&ProtocolVersion=2.3`,
  `/cgi-bin/NetLogger/GetUpdate3.php?NetName=${enc}&ProtocolVersion=2.3`,
  `/cgi-bin/NetLogger/GetCheckinList.php?NetName=${enc}`,
  `/api/GetCheckinList.php?NetName=${enc}`,
  `/api/GetCheckins.php?NetName=${enc}`,
  `/api/GetMonitorData.php?NetName=${enc}`,
  `/?NetName=${enc}`,
  `/monitor/?NetName=${enc}`,
  `/monitor.php?NetName=${enc}`,
];
for (const host of HOSTS) {
  for (const p of paths) {
    const r = await get(host + p);
    // only surface anything that isn't an obvious 404/empty
    const interesting = r.status !== 404 && r.body.length > 0;
    show(`${host}${p} ${interesting ? "  <-- LOOK" : ""}`, r, interesting ? 700 : 160);
  }
}
console.log("\nPROBE DONE");
