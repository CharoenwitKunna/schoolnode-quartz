---
title: SchoolNode — Quartz Garden
description: Migrated SchoolNode notes — vis-network student graph (62 students via Google Sheets) + 6 linked markdown notes
---

# SchoolNode — Quartz Garden

Welcome to the **SchoolNode** Quartz site — a migration of the original offline SchoolNode viewer into Quartz.

## About SchoolNode

SchoolNode is a tiny offline web viewer for school notes — markdown notes with `[[wikilinks]]`, `#tags`, and a link graph. No build step, no backend.

- **Student graph**: 62 students loaded live from a published Google Sheet (CSV export via `https://docs.google.com/spreadsheets/d/…/export?format=csv&gid=867103286`), rendered with [vis-network](https://visjs.github.io/vis-network/docs/network/) (`vis-network/standalone/umd/vis-network.min.js` CDN). Falls back to a local 12-student sample (`notes/students.json`) and a canvas fallback renderer if the CDN is offline. Homeroom colours (`11.1` blue, `11.2` green, `11.3` orange), edge modes: *Obsidian (all linked)* / *Shared Homeroom* / *Shared Option Subject* / *Both*.
- **Notes**: 6 fully-linked demo notes in `notes/` (`biology-cell`, `chemistry-bonds`, `history-ww2`, `math-algebra`, `physics-motion`, `english-essay`) with `[[wikilinks]]` and `#tags`.
- **Original app**: `index.html` + `app.js` + `styles.css` (vanilla JS, no build step) with search, tag filter, and clickable graph preview. `SHEET_ID=1uAhZI37v42wYGl_hmywVw_lCiZjyQJS1e_XAWe96uH4`, `DEFAULT_GID=867103286`, `?gid=` switches tabs.

All original files remain untouched at `../schoolnode/` — this Quartz site is a copy (`cp` not `mv`).

## Notes

Migrated notes (copied via `cp`, originals preserved — 6 files):

- [[biology-cell]] — Cell biology
- [[chemistry-bonds]] — Chemical bonds
- [[history-ww2]] — World War II overview
- [[math-algebra]] — Algebra basics
- [[physics-motion]] — Motion in physics
- [[english-essay]] — Essay writing guide

Also available under `notes/` subfolder for Quartz graph linking.

## Student Graph

The interactive student network graph lives on the dedicated page and as a legacy standalone app.

### Embedded preview

<iframe src="./graph-legacy/index.html" width="100%" height="600" style="border:1px solid #e5e5e5; border-radius:8px;" title="SchoolNode Student Graph (legacy)"></iframe>

<iframe src="./graph.html" width="100%" height="600" style="border:1px solid #e5e5e5; border-radius:8px; margin-top:12px;" title="SchoolNode Student Graph (root copy)"></iframe>

> If iframes are blocked by your browser, use the links below.

### Links

- [Open in Quartz — ./students.md](./students.md) — Quartz page with full graph embed + details
- [Open Legacy Graph (Quartz copy) — ./graph.html](./graph.html)
- [Open Legacy Graph (graph folder) — ./graph/index.html](./graph/index.html)
- [Open Legacy Graph (graph-legacy) — ./graph-legacy/index.html](./graph-legacy/index.html)
- [Open Original SchoolNode (outside Quartz) — ../../schoolnode/index.html](../../schoolnode/index.html)
- Direct Google Sheet CSV: `https://docs.google.com/spreadsheets/d/1uAhZI37v42wYGl_hmywVw_lCiZjyQJS1e_XAWe96uH4/export?format=csv&gid=867103286` (use `?gid=` param to switch tabs)

Graph assets preserved: `graph.html` + `app.js` + `styles.css` + `students.json` / `manifest.json` at content root, plus `graph/` and `graph-legacy/` and `static/` copies — all copied from `schoolnode/` so the iframe can resolve `app.js` and `styles.css` relative to the HTML. Original `schoolnode/` untouched.

> **Privacy note**: `SHEET_ID` is baked into `app.js` client-side — the full published CSV (including any sensitive columns) is fetched in-browser. Publish a sanitized mirror tab with only the allowlisted columns if needed.

## How to run

```sh
npx quartz build --serve   # or npx serve . in schoolnode/
```

See [[students]] for the full graph page.
