# SkyWave — User Guide

A plain-English guide to using SkyWave. No account, no setup files, no manual —
just open it and go. This page covers install, every tab, and the day-to-day
workflows.

**Live app:** [cdburgess75.github.io/SkyWave](https://cdburgess75.github.io/SkyWave/)

---

## 1. Install it on your phone

SkyWave is a website that behaves like a real app once you add it to your home
screen. Do this once:

**iPhone / iPad (Safari):**
1. Open [the live link](https://cdburgess75.github.io/SkyWave/) in **Safari** (not inside another app's browser).
2. Tap the **Share** button (the square with the arrow).
3. Scroll down and tap **Add to Home Screen** → **Add**.
4. Launch it from the new **SkyWave** icon — it runs full-screen with no address bar.

**Android (Chrome):**
1. Open the link in **Chrome**.
2. Tap the **⋮** menu → **Install app** (or **Add to Home screen**).

**Why a real browser?** Some apps (Messages, Facebook, etc.) open links in a
stripped-down browser that blocks live data. If nets or the schedule won't load,
you're probably in one of those — open it in Safari/Chrome instead.

### First launch
A quick 3-step setup asks for your location (tap **Use my GPS** or type your
latitude/longitude). This powers the grayline planner and your grid square. You
can skip it and set it later, or re-run it anytime from the **Ref** tab.

### It works offline
After the first visit, SkyWave caches itself. The schedule, favorites, antenna
calculator, and grayline all work in airplane mode. Only live nets, the EiBi
schedule *update*, and the propagation images need a connection.

---

## 2. The five tabs

Along the bottom (phone) or left side (desktop): **Listen · Saved · Tools · Ref · Prop**
(on the phone, **Ref** and **Prop** live under the **More** button).

---

### 📡 Listen — the main screen

Four views, switched with the buttons at the top:

**Nets** *(the default view)*
- **Live nets in session** at the top — real amateur nets on the air right now,
  refreshed automatically. Each shows frequency, mode, net control (NCS), and how
  long it's been running.
- **Starting within the hour** — scheduled nets about to begin, with a countdown
  ("IN 25 MIN").
- **Major scheduled HF nets** — a built-in directory (traffic nets for the
  Southeast, SouthCARS, Maritime Mobile, Hurricane Watch, and more). These work
  offline and show a live **ON AIR** tag when they're running.
- Tap **⟳ Refresh** to pull the latest live list; use the filter box to search by
  name, mode, or callsign.

**On Air** — every shortwave broadcast transmitting **this minute**, from the
EiBi schedule. Filter with the chips (Favorites, English, Spanish, French), the
band dropdown, or the text box.

**Search** — type any station, language, country, or target area to search the
whole schedule.

**By Freq** — heard a signal and want to know who it is? Type the dial frequency
(e.g. `9420` or `9.420`) and SkyWave lists everything scheduled near it, on-air
entries first.

**On any row:** tap the **★** to save it to Favorites.

---

### ★ Saved — your stuff

- **Favorites** — the stations you starred. Any that are on the air right now are
  highlighted. Tap **✓** on a favorite to mark it *heard today* — it dims with a
  line through it until midnight UTC, so you can track what you've logged.
- **My Freq** — add your own frequencies (nets, repeater inputs, scanner
  channels). Enter freq, mode, and a label; they then appear in On Air / Search /
  By Freq alongside everything else.

---

### 🛠 Tools — field utilities

- **Antenna calculator** — enter a frequency (MHz or kHz) and get half-wave
  dipole, quarter-wave vertical, and full-wave loop lengths in feet and meters,
  plus a doublet/balun cheat-sheet.
- **Grayline & band planner** — sunrise, sunset, solar noon, and day length for
  your location, plus plain-language band advice ("40 m: all-rounder, DX at
  night; strong at grayline"). Computed on your device — no network needed.
- **Export & print** — copy the current On-Air list, download a band card as a
  text file, or print a clean reference sheet for the go-kit.

---

### ◆ Ref — reference & settings

- **Display** — font size, 12/24-hour clock, and the ☾/☀ light/dark toggle
  (also in the header).
- **Full EiBi schedule** — tap **⟳ Update now** once while online to download the
  complete shortwave broadcast database (~12,000 entries). It's stored on your
  device from then on. Leave "auto-update on launch" on and it refreshes itself
  when it gets stale.
- **Reference tables** — shortwave meter bands, US amateur HF bands, time-signal
  stations, and the language/target-area code key.
- **Re-run location setup** — reopens the first-launch wizard.

---

### ≈ Prop — propagation *(needs a connection)*

- **Solar conditions** — the HamQSL solar/band-conditions widget.
- **Planetary K-index** — live from NOAA, with a mini trend chart. Kp ≤ 2 is
  quiet, 3–4 unsettled, ≥ 5 a storm (HF degraded).
- **Live tools** — quick links to Proppy, VOACAP, a grayline map, WebSDR
  receivers, aurora forecast, and a DX cluster.

---

## 3. Common workflows

| I want to… | Do this |
|------------|---------|
| See what's on the air now | Open the app → **On Air** |
| Find active ham nets | It's the default screen — **Listen → Nets** |
| Catch a net before it starts | **Nets** → look under "Starting within the hour" |
| Identify a mystery signal | **Listen → By Freq** → type the dial frequency |
| Keep a station | Tap **★** on its row → find it under **Saved** |
| Mark a station I logged | Tap **✓** on a favorite (clears at 0000 UTC) |
| Add my local net or repeater | **Saved → My Freq** |
| Plan a band opening | **Tools → Grayline** |
| Cut an antenna | **Tools → Antenna calculator** |
| Refresh the broadcast schedule | **Ref → ⟳ Update now** |
| Check propagation | **Prop** (needs internet) |

---

## 4. Keeping it updated

SkyWave updates itself. When a new version is published, a small **"New version
ready"** banner slides up from the bottom — tap **Update**, or just close and
reopen the app. The current version is shown under the SKYWAVE logo in the header.

> **Note on the app icon:** iOS caches home-screen icons. If you ever want the
> latest icon art, remove the app from your home screen and add it again — your
> favorites, frequencies, and settings are stored separately and won't be lost.

---

## 5. Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Couldn't reach NetLogger" / no live nets | You may be in an in-app browser — open in Safari/Chrome. If it persists, the source may be briefly down; tap ⟳ to retry. |
| Schedule is empty / "reference data only" | **Ref → ⟳ Update now** while online, once. |
| Grayline/times look wrong | Set your location: **Ref → Re-run location setup**. |
| Propagation images blank | The **Prop** tab needs an internet connection. |
| Nothing loads at all | Confirm you opened it in Safari/Chrome, not an in-app preview. |

---

*Everything runs on your device. No account, no tracking, no data leaves your
phone except the requests needed to fetch live nets, the broadcast schedule, and
propagation images. 73!*
