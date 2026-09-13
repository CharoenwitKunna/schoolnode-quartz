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

<iframe src="./graph/" width="100%" height="600" style="border:1px solid #e5e5e5; border-radius:8px;" title="SchoolNode Student Graph"></iframe>

> If iframe blank, [open fullscreen](./graph/)

### Links

- [Student Graph — fullscreen](./graph/) — 62 students live
- Direct Google Sheet CSV: `https://docs.google.com/spreadsheets/d/1uAhZI37v42wYGl_hmywVw_lCiZjyQJS1e_XAWe96uH4/export?format=csv&gid=867103286`

> **Privacy note**: `SHEET_ID` is baked into `app.js` client-side — the full published CSV (including any sensitive columns) is fetched in-browser. Publish a sanitized mirror tab with only the allowlisted columns if needed.

## How to run

```sh
npx quartz build --serve   # or npx serve . in schoolnode/
```

See [[students]] for the full graph page.
