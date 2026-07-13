// Nets parser unit tests — run: node test/nets-parser.mjs   (or: npm test)
//
// Exercises parseNets() / netFreqKhz() (Listen → Nets, NetLogger feed) against
// both formats the tolerant parser accepts, plus garbage inputs that must fail
// soft to []. The pure-function block is extracted from index.html so the
// tests always run against the shipped code, not a copy.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const html = readFileSync(path.join(root, "index.html"), "utf8");
const js = html.split("<script>")[1]?.split("</script>")[0];
if (!js) { console.error("FAIL: could not extract script block"); process.exit(1); }

// Extract the pure parser block (no DOM, no storage access)
const s = js.indexOf("const NETS_SOURCE");
const e = js.indexOf("async function relayFetch");
if (s < 0 || e < 0) { console.error("FAIL: nets parser block not found"); process.exit(1); }
const block = js.slice(s, e)
  .replace(/let NETS=loadJSON[^\n]*\n/, "")
  .replace(/let netsFetching[^\n]*\n/, "");
const { parseNets, netFreqKhz } = new Function(block + "; return {parseNets, netFreqKhz};")();

let pass = 0, fail = 0;
const t = (label, cond) => { cond ? pass++ : (fail++, console.error("FAIL:", label)); };

// --- delimited format (NetLogger classic: ~ records, | fields) ---
const delim = [
  "OMISS 20m SSB Net|14.290|KD5FUV|W5ABC|NETLOGGER3|SSB|20m|2026-07-11 16:00:00",
  "Maritime Mobile Service Net|14.300|WB4XYZ|N4DEF|NETLOGGER1|SSB|20m|2026-07-11 15:45:00",
  "East Coast 2m Net|146.520|K1GHI||NETLOGGER2|FM|2m|2026-07-11 17:10:00",
  "*end*"
].join("~");
const d = parseNets(delim);
t("delimited: parses 3 nets", d.length === 3);
t("delimited: 14.290 MHz → 14290 kHz", d[0].freq === 14290);
t("delimited: VHF 146.52 → 146520 kHz", d[2].freq === 146520);
t("delimited: NCS callsign found", d[0].ncs === "KD5FUV");
t("delimited: mode found", d[0].mode === "SSB");
t("delimited: start time found", /16:00/.test(d[0].start));
t("delimited: *end* marker skipped", !d.some(n => /\*/.test(n.name)));

// --- JSON format (defensive alternate) ---
const json = JSON.stringify([
  { NetName: "Hurricane Watch Net", Frequency: "14.325", Mode: "SSB", NetControl: "W4EHW", StartTime: "2026-07-11 14:00:00" },
  { NetName: "Bad entry no freq", Mode: "SSB" }
]);
const j = parseNets(json);
t("json: parses valid, drops invalid", j.length === 1 && j[0].freq === 14325);
t("json: name mapped", j[0].name === "Hurricane Watch Net");

// --- Homepage table (the LIVE format — fixture verbatim from netlogger.org
// --- as captured by the mirror workflow logs, 2026-07-13) ---
const homepage = '<html><!-- Begin Currently Active Nets --><table id="t1">' +
  '<thead><tr><th> Net Name </th><th> Frequency </th></tr></thead><tbody>' +
  '<tr><td><span>20m Salvation Army SATERN net <a href="https://www.google.com/search?q=x" target="_blank">(www)</a></span></td><td>14.325</td><td>20m</td><td>SSB</td><td>NETLOGGER</td><td>2026-07-13 14:46:28</td><td>00:45:58 </td><td>9 </td><td>W8SAT-STATION OP - v3.1.7W </td></tr>' +
  '<tr><td><span class="green">GILA COUNTY BREAKFAST CLUB <a href="#">(www)</a></span></td><td>7.243</td><td>40m</td><td>SSB</td><td>NETLOGGER</td><td>2026-07-13 14:50:14</td><td>00:42:12 </td><td>11 </td><td>K6NLX-FRED - v3.1.7W </td></tr>' +
  '</tbody></table><!-- CurrentlyActiveNets=2 --><!-- End Currently Active Nets --></html>';
const hp = parseNets(homepage);
t("homepage: parses 2 nets", hp.length === 2);
t("homepage: name without (www)", hp[0].name === "20m Salvation Army SATERN net");
t("homepage: 14.325 MHz → 14325 kHz", hp[0].freq === 14325);
t("homepage: NCS from Opened By", hp[0].ncs === "W8SAT");
t("homepage: start HH:MM from timestamp", hp[0].start === "14:46");
t("homepage: band/mode", hp[1].band === "40m" && hp[1].mode === "SSB");
const hpEmpty = parseNets('<html><!-- Begin Currently Active Nets --><table></table><!-- End Currently Active Nets --></html>');
t("homepage: empty table → [] (valid zero-nets)", Array.isArray(hpEmpty) && hpEmpty.length === 0);

// --- AIM format (legacy wire protocol — fixture verbatim from
// --- ragchew.site's test suite; kept as a fallback parser) ---
const aim = '<html><body><!--NetLogger Start Data-->' +
  'List Spec Net|146.52|KI5ZDF-TIM R - v3.1.7L|KI5ZDF|20260305022439|FM|2m|Y|20000|List Spec Net||1|~' +
  'OMISS 40m SSB Net|7.185|W5ABC-BOB - v3.1.7W|KD5FUV|20260305230000|SSB|40m|Y|20000|OMISS||14|~' +
  '<!--NetLogger End Data--></body></html>';
const a = parseNets(aim);
t("aim: parses 2 nets", a.length === 2);
t("aim: name exact", a[0].name === "List Spec Net");
t("aim: 146.52 MHz → 146520 kHz", a[0].freq === 146520);
t("aim: NCS is field 4 (not the logger)", a[0].ncs === "KI5ZDF");
t("aim: mode/band", a[0].mode === "FM" && a[0].band === "2m");
t("aim: compact timestamp → HH:MM", a[0].start === "02:24");
t("aim: second record", a[1].name === "OMISS 40m SSB Net" && a[1].freq === 7185);
const aimEmpty = parseNets('<!--NetLogger Start Data--><!--NetLogger End Data-->');
t("aim: empty markers → [] (valid zero-nets response)", Array.isArray(aimEmpty) && aimEmpty.length === 0);

// --- XML format (NetLogger XML Data Service — documented alternate) ---
const xml = `<?xml version="1.0"?><NetLoggerXML><ServerList><Server><ServerName>NETLOGGER</ServerName></Server></ServerList><NetList>
<Net><NetName>OMISS 40m SSB Net &amp; Friends</NetName><Frequency>7.185</Frequency><NetControl>KD5FUV</NetControl><Logger>W5ABC</Logger><ServerName>NETLOGGER</ServerName><Mode>SSB</Mode><Band>40m</Band><Date>2026-07-12 22:00:00</Date></Net>
<Net NetName="Georgia Single Sideband Net" Frequency="3.975" NetControl="K4ABC" Mode="LSB" Band="80m" Date="2026-07-12 23:00:00"/>
<Net><NetName>Broken no freq</NetName><Mode>SSB</Mode></Net>
</NetList></NetLoggerXML>`;
const x = parseNets(xml);
t("xml: parses 2 valid nets, drops freq-less", x.length === 2);
t("xml: &amp; entity decoded", x[0].name === "OMISS 40m SSB Net & Friends");
t("xml: child-element freq MHz → kHz", x[0].freq === 7185);
t("xml: attribute-style net parsed", x[1].name === "Georgia Single Sideband Net" && x[1].freq === 3975);
t("xml: start time from <Date>", /22:00/.test(x[0].start));
t("xml: NCS mapped", x[0].ncs === "KD5FUV");

// --- garbage inputs must fail soft ---
t("garbage html → []", parseNets("<html><body>404</body></html>").length === 0);
t("empty → []", parseNets("").length === 0);
t("null-ish → []", parseNets(null).length === 0);
t("kHz-style freq accepted", netFreqKhz("7272") === 7272);
t("absurd freq rejected", !isFinite(netFreqKhz("99999999")));

console.log(`\nnets-parser: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
