// Domain logic unit tests — run: node test/domain.mjs   (or: npm test)
//
// These cover the pure functions the app's answers actually depend on: whether
// a broadcast is on the air right now, which days it runs, which EiBi season
// applies, where the sun is, and how a schedule row or a live net is parsed.
// They fail *silently and plausibly* when broken — the app still renders, it
// just tells you the wrong thing — which is exactly why they need tests.
//
// Functions are extracted from index.html so the tests always run against the
// shipped code rather than a copy.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const html = readFileSync(path.join(root, "index.html"), "utf8");
const js = html.split("<script>")[1]?.split("</script>")[0];
if (!js) { console.error("FAIL: could not extract script block"); process.exit(1); }

// Pull named pure functions/consts out of the shipped script by source slice.
function grab(startMarker, endMarker) {
  const s = js.indexOf(startMarker);
  const e = js.indexOf(endMarker, s + 1);
  if (s < 0 || e < 0) { console.error(`FAIL: could not locate block ${startMarker}`); process.exit(1); }
  return js.slice(s, e);
}

const block = [
  grab("const METER=", "const HAM="),
  grab("function entry(", "function keyOf("),
  grab("function cap(", "function modeOf("),
  grab("function bandOf(", "function langName("),
  grab("function lastSun(", "function relays("),
  grab("function looksLikeSchedule(", "async function fetchSchedule("),
  grab("function parseEibi(", "async function loadText("),
  grab("function netFreqKhz(", "function parseNets("),
  grab("const RAD=Math.PI/180", "function fmtUTC("),
].join("\n");

const api = new Function(block + `; return {parseTime,dayAllowed,dowE,onAir,minsUntilStart,bandOf,
  lastSun,seasonCode,seasonList,looksLikeSchedule,parseEibi,entry,netFreqKhz,normNetObj,sunTimes,toDays};`)();

const {
  dayAllowed, onAir, minsUntilStart, bandOf, seasonCode, seasonList,
  looksLikeSchedule, parseEibi, netFreqKhz, normNetObj, sunTimes,
} = api;

let pass = 0, fail = 0;
const t = (label, cond) => { cond ? pass++ : (fail++, console.error("FAIL:", label)); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const utc = (y, mo, d, h = 0, mi = 0) => new Date(Date.UTC(y, mo, d, h, mi));

// ---------------------------------------------------------------- onAir ----
// A Wednesday, 12:00 UTC. EiBi day numbers are ISO: Mon=1 … Sun=7.
const wed = utc(2026, 6, 15, 12, 0);
const row = (time, days) => parseEibi(`9420;${time};${days};GRC;Voice of Greece;E;Eu;ATH`)[0];

t("onAir: inside a plain window", onAir(row("1100-1300", ""), wed) === true);
t("onAir: before the window", onAir(row("1300-1400", ""), wed) === false);
t("onAir: after the window", onAir(row("0900-1100", ""), wed) === false);
t("onAir: start is inclusive", onAir(row("1200-1300", ""), wed) === true);
t("onAir: end is exclusive", onAir(row("1100-1200", ""), wed) === false);

// The one that silently breaks: a broadcast that crosses 00:00 UTC.
const overnight = row("2200-0200", "");
t("onAir: midnight wrap — 23:00 is on", onAir(overnight, utc(2026, 6, 15, 23, 0)) === true);
t("onAir: midnight wrap — 01:00 is on", onAir(overnight, utc(2026, 6, 16, 1, 0)) === true);
t("onAir: midnight wrap — 12:00 is off", onAir(overnight, utc(2026, 6, 15, 12, 0)) === false);
t("onAir: midnight wrap — 02:00 is off (end exclusive)", onAir(overnight, utc(2026, 6, 16, 2, 0)) === false);
t("onAir: 24h entry is always on", onAir(row("0000-2400", ""), wed) === true);

// ----------------------------------------------------------- day filter ----
// Contract: null means "every day"; otherwise a Set of ISO day numbers.
const days = (s) => { const r = dayAllowed(s); return r === null ? null : [...r].sort().join(""); };
t("dayAllowed: empty means every day (null)", dayAllowed("") === null);
t("dayAllowed: single digit day", days("3") === "3");
t("dayAllowed: digit range Mon-Fri", days("1-5") === "12345");
t("dayAllowed: comma list", days("2,4,6") === "246");
t("dayAllowed: bare digit run is per-character", days("246") === "246");
t("dayAllowed: two-letter codes", days("Mo") === "1" && days("Su") === "7");
t("dayAllowed: two-letter range", days("Mo-Fr") === "12345");
t("dayAllowed: two-letter range wrapping the week", days("Sa-Su") === "67");
t("dayAllowed: unparseable falls back to every day", dayAllowed("whenever") === null);

t("onAir: honours day-of-week (Wed entry on Wed)", onAir(row("1100-1300", "3"), wed) === true);
t("onAir: honours day-of-week (Thu entry on Wed)", onAir(row("1100-1300", "4"), wed) === false);
// Sunday must read as 7, not 0 — a classic off-by-one with getUTCDay().
const sun = utc(2026, 6, 19, 12, 0);
t("onAir: Sunday is day 7, not 0", onAir(row("1100-1300", "7"), sun) === true);
t("onAir: Sunday is not day 1", onAir(row("1100-1300", "1"), sun) === false);

// ------------------------------------------------------ minsUntilStart ----
t("minsUntilStart: 90 minutes out", minsUntilStart(row("1330-1400", ""), wed) === 90);
t("minsUntilStart: already-started rolls to tomorrow", minsUntilStart(row("1100-1300", ""), wed) === 1380);
t("minsUntilStart: 24h entry never 'starts'", minsUntilStart(row("0000-2400", ""), wed) === null);
// On a Wednesday, a Wednesday-only entry is upcoming; a Thursday-only one isn't.
t("minsUntilStart: same-day entry is upcoming", minsUntilStart(row("1330-1400", "3"), wed) === 90);
t("minsUntilStart: other-day entry is not upcoming", minsUntilStart(row("1330-1400", "4"), wed) === null);

// ---------------------------------------------------------- EiBi season ----
// 'a' (summer) starts the last Sunday of March; 'b' (winter) the last Sunday
// of October; Jan..late-Mar belongs to the *previous* year's b season.
t("seasonCode: mid-summer is a26", seasonCode(utc(2026, 6, 1)) === "a26");
t("seasonCode: mid-winter (Dec) is b26", seasonCode(utc(2026, 11, 1)) === "b26");
t("seasonCode: January belongs to previous b25", seasonCode(utc(2026, 0, 15)) === "b25");
// 2026: last Sunday of March = 29th, last Sunday of October = 25th.
t("seasonCode: day before spring change is b25", seasonCode(utc(2026, 2, 28)) === "b25");
t("seasonCode: on the spring change is a26", seasonCode(utc(2026, 2, 29)) === "a26");
t("seasonCode: day before autumn change is a26", seasonCode(utc(2026, 9, 24)) === "a26");
t("seasonCode: on the autumn change is b26", seasonCode(utc(2026, 9, 25)) === "b26");
t("seasonList: offers current plus adjacent seasons", seasonList().length >= 2 &&
  seasonList().includes(seasonCode()));

// ------------------------------------------------------------- parseEibi ----
const csv = [
  "9420;1100-1300;1-5;GRC;Voice of Greece;G;Eu;ATH",
  "6070;0000-2400;;D;Radio Coruña;E;Eu;ROB",   // accented name must survive
  "bogus line with no delimiter",
  "notanumber;1100-1200;;X;Nope;E;Eu;TX",
].join("\n");
const parsed = parseEibi(csv);
t("parseEibi: keeps valid rows only", parsed.length === 2);
t("parseEibi: frequency parsed", parsed[0].freq === 9420);
t("parseEibi: start/end split", parsed[0].start === 1100 && parsed[0].end === 1300);
t("parseEibi: station name", parsed[0].station === "Voice of Greece");
t("parseEibi: non-ASCII station name intact", parsed[1].station === "Radio Coruña");
t("parseEibi: garbage rows dropped", !parsed.some((e) => e.station === "Nope"));
t("parseEibi: empty input is empty output", parseEibi("").length === 0);

// -------------------------------------------------- schedule sanity gate ----
const realish = Array.from({ length: 2000 },
  (_, i) => `${3200 + i};0100-0200;1-7;CUB;Station ${i};E;NAm;TX`).join("\n");
t("looksLikeSchedule: accepts a real schedule", looksLikeSchedule(realish) === true);
t("looksLikeSchedule: rejects an error page", looksLikeSchedule("<html>404</html>") === false);
t("looksLikeSchedule: rejects a truncated transfer", looksLikeSchedule(realish.slice(0, 20000)) === false);
t("looksLikeSchedule: rejects empty/null", !looksLikeSchedule("") && !looksLikeSchedule(null));

// ------------------------------------------------------------ band lookup ----
t("bandOf: 9420 kHz is 31 m", bandOf(9420) === "31 m");
t("bandOf: 6070 kHz is 49 m", bandOf(6070) === "49 m");
t("bandOf: mediumwave has no meter band", bandOf(1000) === null);

// --------------------------------------------------------- net frequency ----
t("netFreqKhz: MHz string to kHz", netFreqKhz("14.300") === 14300);
t("netFreqKhz: already kHz stays kHz", netFreqKhz("7255") === 7255);
t("netFreqKhz: VHF MHz to kHz", netFreqKhz("146.520") === 146520);
t("netFreqKhz: junk is NaN", !isFinite(netFreqKhz("hello")));

// --------------------------------------------- live net field passthrough ----
// Regression: normNetObj used to return only six fields, so the mirror's
// check-in roster and counts were dropped and every expanded net showed
// "roster appears here once the live feed updates".
const mirrored = normNetObj({
  name: "Maritime Mobile Service Net", freq: 14300, mode: "SSB", band: "20m",
  ncs: "WB4XYZ", start: "15:45", server: "NETLOGGER", dur: "01:12:00",
  subs: 9, checkins: 3,
  roster: [
    { call: "k4xtx", name: "Kenneth", qth: "LaGrange, NC", grid: "FM15dj", nc: 1 },
    { call: "W5ABC", name: "Dale", qth: "Tulsa, OK" },
    { bogus: "no callsign" },
  ],
});
t("normNetObj: keeps the roster", Array.isArray(mirrored.roster) && mirrored.roster.length === 2);
t("normNetObj: keeps the check-in count", mirrored.checkins === 3);
t("normNetObj: keeps the subscriber count", mirrored.subs === 9);
t("normNetObj: keeps server and elapsed", mirrored.server === "NETLOGGER" && mirrored.dur === "01:12:00");
t("normNetObj: callsigns upper-cased", mirrored.roster?.[0]?.call === "K4XTX");
t("normNetObj: net-control flag preserved", mirrored.roster?.[0]?.nc === 1 && !mirrored.roster?.[1]?.nc);
t("normNetObj: rosterless net has no roster key", normNetObj({ name: "X", freq: 7255 }).roster === undefined);
t("normNetObj: unnamed net is rejected", normNetObj({ freq: 7255 }) === null);

// ---------------------------------------------------------------- sunTimes ----
// Greenwich on the equinox: sunrise ≈ 06:00 UTC, sunset ≈ 18:00 UTC.
const eq = sunTimes(utc(2026, 2, 20, 12), 51.48, 0);
t("sunTimes: equinox sunrise near 06:00 UTC at Greenwich",
  near(eq.sunrise.getUTCHours() * 60 + eq.sunrise.getUTCMinutes(), 360, 20));
t("sunTimes: equinox sunset near 18:00 UTC at Greenwich",
  near(eq.sunset.getUTCHours() * 60 + eq.sunset.getUTCMinutes(), 1080, 20));
t("sunTimes: sunrise precedes sunset", eq.sunrise < eq.sunset);

// The branches that only fire above the Arctic Circle — and would otherwise
// hand the grayline view an Invalid Date.
const midnightSun = sunTimes(utc(2026, 5, 21, 12), 78.2, 15.6);   // Svalbard, June
t("sunTimes: polar day flagged", midnightSun.polar === "day");
t("sunTimes: polar day has no sunrise", midnightSun.sunrise === undefined);
const polarNight = sunTimes(utc(2026, 11, 21, 12), 78.2, 15.6);   // Svalbard, December
t("sunTimes: polar night flagged", polarNight.polar === "night");
t("sunTimes: solar noon still returned in polar night", polarNight.noon instanceof Date &&
  !isNaN(polarNight.noon.valueOf()));
// Southern hemisphere sanity: seasons invert.
const syd = sunTimes(utc(2026, 11, 21, 2), -33.87, 151.2);
t("sunTimes: southern summer day is long",
  (syd.sunset - syd.sunrise) / 3600000 > 13);

console.log(`domain: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
