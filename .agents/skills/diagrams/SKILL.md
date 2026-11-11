---
name: diagrams
description: Adding or changing a diagram in the docs (flows, component layouts, data flow). Use when a docs page would be easier to follow with a picture, or when an existing diagram in `docs/` needs updating.
---

# Diagrams in the docs

- Audience: contributors. Start with what the reader needs to understand; add a diagram only where it makes that easier. Keep it simple: few boxes, short labels.
- Files: an `.excalidraw` source (preferred) and its `.svg` export side by side in `docs/<area>/diagrams/`. Embed the SVG in the Markdown with a source line below it, as in `docs/search/README.md`.
- Dark mode: the `.excalidraw` keeps Excalidraw's light colours and sets `appState.theme: "dark"` and `exportWithDarkMode: true`, so it opens and exports dark. A generated SVG is drawn in a dark palette: background `#121212`, strokes `#ced4da`, text `#e9ecef`, fills `#1c3d5a` (source), `#1f4a2e` (step), `#5a4a14` (output), `#2a2a2e` (plain), `#1c1c20` (frame).
- Generating: a small throwaway script from one spec per diagram works well (roughness 0, font size 18). The existing diagrams in `docs/search/diagrams/` show the result.
- Afterwards run `vp fmt docs`.
