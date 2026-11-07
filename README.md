# Jebel Ali & Discovery Gardens Transit Guide (JAFZA Commute PWA)

Offline-first bus timetable for Discovery Gardens, JAFZA and Jebel Ali Industrial Area 1-3, with Dubai Metro links.
Plain HTML, CSS and vanilla JS. No build step, no dependencies.

## Deploy to GitHub Pages

1. Create a repo (e.g. `jebel-ali-pwa`) and upload the **contents** of this folder to the repo root.
2. Repo **Settings > Pages > Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`.
3. Open `https://<your-username>.github.io/jebel-ali-pwa/`.
4. **Open Graph links:** in `index.html`, replace `https://YOUR-USERNAME.github.io/jebel-ali-pwa/` with your real URL
   (link-preview crawlers need absolute URLs). Or do it automatically: use `tools/builder.html` (below) and paste your URL first.

All paths are relative, so it also works from a sub-folder or a custom domain.

## One-click ZIP and icon regeneration

Open `tools/builder.html` from the deployed site (or `python3 -m http.server` locally, since `file://` blocks `fetch`).
- **Download jebel-ali-pwa.zip** packs every file with JSZip (loaded from a CDN, on that page only).
- **Generate & preview** redraws every icon, `apple-touch-icon.png`, `favicon.ico` and `og-image.png` from the bus SVG using Canvas.
  Any file missing from the project is filled in from this generator when zipping.
The app itself loads nothing from the network.

## Features

- Routes F43, F44, F46, F54, 99, 91 with stop sequences, per-stop times and full day timetable
- Filters: Morning 05:00-08:30, Evening 16:30-20:30, Night 21:00-02:00; zone North / South / Industrial; direction; boarding stop
- Live second-by-second countdown from the device clock (works offline, handles past-midnight service)
- Favorite stops in `localStorage`
- Display modes: Standard, Direct Sunlight (yellow/black, thick borders), Low Battery (pure `#000`, no animation)
- iOS safe areas, Add-to-Home-Screen guide with animated steps, Pocket mode with Screen Wake Lock
- Share route (`navigator.share`, clipboard fallback), dynamic Open Graph tags, deep links `?route=F43&dir=out&stop=DG_METRO`
- Manifest shortcuts: Next Bus to JAFZA, Discovery Gardens Metro, Night Shift Buses

## What's new in v1.2.0

- Network data rebuilt from the brief: F43, F44, F46, F54, 99, 91 with named stops, Metro exits and RTA Nol fares (Silver / Gold)
- Bento home: next-bus banner, heat notice, Red Line transfer countdown, saved-route badges
- Subway-style route strip with Red Line and AC Shelter pills, live bus progress bar, Nol trip calculator in Settings
- Swipe-to-dismiss route sheet and pull-to-refresh; Pocket mode route color blocks; stronger Direct Sunlight mode

## Updating schedules

Edit `js/transit-data.js` (service windows, headways, stop offsets). Then bump `VERSION` in `sw.js` so installed copies
drop their old cache. **Data confidence:** Nol fares and the 30-minute transfer rule follow the RTA fare page; route termini follow RTA's route list.
Intermediate stops, Metro exits, headways, stop-to-stop minutes, fare band per route, Red Line train frequency, the outdoor
temperature estimate and the AED 7.50 minimum balance are NOT verified. Replace them with real timings from RTA / S'hail
before relying on them.

## Files

```
index.html  manifest.webmanifest  sw.js  offline.html  favicon.ico  favicon.svg
apple-touch-icon.png  og-image.png  robots.txt  .nojekyll
css/styles.css   js/app.js   js/transit-data.js
icons/icon-{72,96,128,144,152,192,384,512}.png  icons/icon-maskable-{192,512}.png
tools/builder.html
```
