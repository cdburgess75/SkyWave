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
const s = js.indexOf("const NETS_URL");
const e = js.indexOf("async function getNets");
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

// --- garbage inputs must fail soft ---
t("garbage html → []", parseNets("<html><body>404</body></html>").length === 0);
t("empty → []", parseNets("").length === 0);
t("null-ish → []", parseNets(null).length === 0);
t("kHz-style freq accepted", netFreqKhz("7272") === 7272);
t("absurd freq rejected", !isFinite(netFreqKhz("99999999")));

console.log(`\nnets-parser: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
