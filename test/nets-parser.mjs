// Nets parser unit tests — run: node test/nets-parser.mjs   (or: npm test)
//
// Exercises parseNets() / netFreqKhz() (Listen → Nets) against the two shapes
// that actually reach it — the netlogger.org homepage table (relay fallback)
// and JSON (our own mirror) — plus garbage inputs that must fail soft to [].
// The cgi-bin XML/AIM and pipe-delimited fixtures were removed in 2026.07.26
// along with their parsers: those endpoints 404 on every NetLogger server.
// The pure-function block is extracted from index.html so the tests always run
// against the shipped code, not a copy.

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

// --- garbage inputs must fail soft ---
t("garbage html → []", parseNets("<html><body>404</body></html>").length === 0);
t("empty → []", parseNets("").length === 0);
t("null-ish → []", parseNets(null).length === 0);
t("kHz-style freq accepted", netFreqKhz("7272") === 7272);
t("absurd freq rejected", !isFinite(netFreqKhz("99999999")));

console.log(`\nnets-parser: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
