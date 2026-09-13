---
title: Students Graph
description: Interactive SchoolNode student network — 62 students via Google Sheets, rendered with vis-network
---

# Students Graph

Interactive **SchoolNode Student Network** — 62 students loaded live from a published Google Sheet and rendered with [vis-network](https://visjs.github.io/vis-network/docs/network/). Falls back to 12-student `students.json` sample when offline.

## Graph

<iframe src="./graph-legacy/index.html" width="100%" height="650" style="border:1px solid #e5e5e5; border-radius:8px; background:#fff;" title="SchoolNode Students Graph"></iframe>

Alternative embeds:

<iframe src="./graph.html" width="100%" height="650" style="border:1px solid #e5e5e5; border-radius:8px; background:#fff; margin-top:12px;" title="SchoolNode Students Graph (root)"></iframe>

<iframe src="./graph/index.html" width="100%" height="650" style="border:1px solid #e5e5e5; border-radius:8px; background:#fff; margin-top:12px;" title="SchoolNode Students Graph (graph folder)"></iframe>

### Open as standalone page

- [Quartz copy — ./graph.html](./graph.html)
- [Quartz copy — ./graph/index.html](./graph/index.html)
- [Quartz copy — ./graph-legacy/index.html](./graph-legacy/index.html)
- [Quartz copy — ./graph/graph.html](./graph/graph.html)
- [Original SchoolNode — ../../schoolnode/index.html](../../schoolnode/index.html) (outside Quartz, always authoritative)
- [Original app.js — ../../schoolnode/app.js](../../schoolnode/app.js) — view source for `SHEET_ID`, `DEFAULT_GID`, `FALLBACK_STUDENTS`
- [Students JSON — ../../schoolnode/notes/students.json](../../schoolnode/notes/students.json)

Quartz-preserved copies: `graph.html` + `app.js` + `styles.css` + `students.json` / `manifest.json` at content root, plus `graph/` / `graph-legacy/` / `static/` — so the iframe resolves even when served from Quartz's `public/` output. `app.js` and graph access preserved.

## How it works

- **Data source**: Live Google Sheet CSV export — `https://docs.google.com/spreadsheets/d/1uAhZI37v42wYGl_hmywVw_lCiZjyQJS1e_XAWe96uH4/export?format=csv&gid=867103286`
  - `SHEET_ID = 1uAhZI37v42wYGl_hmywVw_lCiZjyQJS1e_XAWe96uH4`, `DEFAULT_GID = 867103286`, `?gid=` URL param selects tab.
  - `sheetCsvUrl()` is the single source for the export URL (recomputed on every load).
  - Chain: **LIVE sheet → `notes/students.json` → `FALLBACK_STUDENTS`** (12 students, same as `notes/students.json`) when offline or `file://`.
- **Rendering**: `vis-network` CDN (`https://unpkg.com/vis-network/standalone/umd/vis-network.min.js`) with canvas fallback renderer (`cdnFallback` banner) if offline. Nodes coloured by `HOMEROOM_COLORS` (`11.1` blue, `11.2` green, `11.3` orange). Edge modes: `Obsidian (all linked)`, `Shared Homeroom`, `Shared Option Subject`, `Both`.
- **Interactivity**: Click a node to preview, drag to rearrange, scroll to zoom. Search and tag/option/homeroom/pathway filters.

## Privacy notice

`SHEET_ID` is baked into client-side `app.js` — the full published CSV is fetched in-browser, so every column (incl. DOB, SEND, medical/intervention notes if present in the sheet) is visible in the Network tab even though the app only maps an allowlist. Strongly recommended: publish a **sanitized mirror tab** with only `Student/Gender/Homeroom/Pathway/Tutor/Attendance/Option/Forecast` columns and point `DEFAULT_GID` at that tab (or front with a proxy that allowlists those columns).

## Notes linked to graph

- [[biology-cell]] | [[chemistry-bonds]] | [[history-ww2]] | [[math-algebra]] | [[physics-motion]] | [[english-essay]]

Back to [[index|Home]].
