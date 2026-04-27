# Replace stylised blobs with real Dutch province shapes

## Context

The PWA scaffold at `dutch_provinces_map/docs/` is already in place (HTML shell, CSS tokens with 12 per-province visited colours, app.js state/undo/persistence, sw.js cache-first, manifest, single SVG icon). The 12 provinces in `index.html` are currently hand-drawn stylised blobs — you shared a screenshot of a real Dutch map and asked to "update the blobs to real provinces".

Geographic path data has already been generated end-to-end and is sitting in `/tmp/`:

- `/tmp/nl-paths.json` — 12 SVG path strings keyed by my province ids (`friesland`, `groningen`, ...), produced by projecting WGS84 lon/lat from cartomap/nl GeoJSON (`provincie_2024.geojson`) through equirectangular with `cos(midLat)` correction. ViewBox is `0 0 674.1 792` (height 760 + 16px padding each side).
- `/tmp/new-svg-block.txt` — the complete replacement `<svg id="map">…</svg>` block (82 lines, ~25 KB), already containing: new viewBox, the existing `softShadow` filter (stdDeviation reduced 6 → 3 since real paths have far more detail), all 12 real geographic `<path data-province="…" data-name="…">` elements, and the 5 landmark groups repositioned to projected coordinates with `r=11` icons (down from `r=13`).

The unused `goo` filter and the decorative sea-rect/gradient have been removed in the new block — they were only there to dress up the blobs.

## Goal

Replace the stylised SVG map (and the matching artwork inside `icons/icon.svg`) with the real geographic province shapes from `/tmp/`, with **zero changes to `app.js`, `styles.css`, or `manifest.json`**.

## Approach

Two payload edits + one cache-bust, all mechanical:

1. **`docs/index.html`** — swap the entire `<svg id="map">…</svg>` block (lines 31–185) for the contents of `/tmp/new-svg-block.txt`. Same `data-province` ids → `app.js` selectors, `localStorage` state, and per-province `.visited` CSS rules keep working unmodified.
2. **`docs/icons/icon.svg`** — replace its inline blob paths with the same 12 real province paths (from `/tmp/nl-paths.json`), nested inside a 512×512 rounded background via `<svg viewBox="0 0 674.1 792" preserveAspectRatio="xMidYMid meet" x="40" y="40" width="432" height="432">`. Each province coloured with the matching `--c-*` token from `styles.css` so the favicon visually echoes the visited palette.
3. **`docs/sw.js`** — bump `CACHE_NAME` from `nl-provinces-v1` → `nl-provinces-v2` so installed clients fetch the new shell on next reload.

Then verify in the running preview (port 8765) via screenshot.

## File changes

| Path | Status | What changes |
|---|---|---|
| [index.html](air-file://dcmvqgoj39tmg5jcheam/Users/roman.prokashev/air/dutch_provinces_map/docs/index.html?type=file&root=%252F) | **Modify** | Replace lines 31–185 (entire `<svg id="map">…</svg>`) with `/tmp/new-svg-block.txt`. New `viewBox="0 0 674.1 792"`, real paths, repositioned landmarks. |
| [icon.svg](air-file://dcmvqgoj39tmg5jcheam/Users/roman.prokashev/air/dutch_provinces_map/docs/icons/icon.svg?type=file&root=%252F) | **Modify** | Replace 12 stylised blob `<path>` elements with the 12 real province paths, fitted into the existing 512×512 rounded gradient frame via a nested SVG with `preserveAspectRatio`. |
| [sw.js](air-file://dcmvqgoj39tmg5jcheam/Users/roman.prokashev/air/dutch_provinces_map/docs/sw.js?type=file&root=%252F) | **Modify** | One-line `CACHE_NAME` bump (`v1` → `v2`) so the old cached shell is dropped on activate. |

No other files touched. Out of scope: `app.js`, `styles.css`, `manifest.json`, `README.md`.

## Implementation steps

1. **Read `/tmp/new-svg-block.txt`** to confirm the prepared payload is intact.
2. **Edit `docs/index.html`**: replace the `<svg id="map" … </svg>` block (lines 31–185) with the contents of `/tmp/new-svg-block.txt`. The surrounding `<div class="map-frame">` and `<div id="tooltip">` stay untouched.
3. **Edit `docs/icons/icon.svg`**: keep the rounded gradient background `<rect>`; remove the existing `<g transform="translate(96 96) scale(0.625)">` blob block; insert in its place a nested `<svg x="40" y="40" width="432" height="432" viewBox="0 0 674.1 792" preserveAspectRatio="xMidYMid meet">` containing the 12 real province paths from `/tmp/nl-paths.json`, each filled with its matching province colour (Groningen `#cfe9c8`, Friesland `#bfe2f0`, Drenthe `#e8d6b9`, Overijssel `#f3c9d4`, Flevoland `#cdd9f0`, Gelderland `#dcd1ee`, Utrecht `#f7d8c0`, Noord-Holland `#c9e6db`, Zuid-Holland `#f5e6a3`, Zeeland `#bcd9d3`, Noord-Brabant `#f0c5b1`, Limburg `#dac5e0`).
4. **Edit `docs/sw.js`**: change `const CACHE_NAME = 'nl-provinces-v1';` → `'nl-provinces-v2';`.
5. **Verify** via `mcp__Air__application-get-info` Screenshot of the running preview at `http://localhost:8765`.

## Acceptance criteria

- The map renders the 12 real geographic Dutch province silhouettes (recognisable coastline, IJsselmeer cutout, Zeeland archipelago).
- All 12 `<path data-province="…">` elements still match the 12 ids in `app.js`'s `PROVINCES` array (`groningen, friesland, drenthe, overijssel, flevoland, gelderland, utrecht, noord-holland, zuid-holland, zeeland, noord-brabant, limburg`).
- Tapping any province still toggles `.visited` and applies the per-province colour from `styles.css` — no JS or CSS file was touched.
- Stats counter, undo, reset, localStorage round-trip all keep working.
- 5 landmarks (Harlingen, Giethoorn, Kasteel de Haar, Den Bosch, Hoge Veluwe) sit visually inside the correct provinces in the new projection and remain `pointer-events: none`.
- `icons/icon.svg` favicon shows the same recognisable Netherlands silhouette in the rounded card.
- `sw.js` `CACHE_NAME` is `nl-provinces-v2`.

## Verification steps

1. Reload `http://localhost:8765` in the embedded preview.
2. `mcp__Air__application-get-info` → Screenshot — confirm map looks geographic, not stylised.
3. Click 2–3 provinces → confirm visited colours apply and counter updates.
4. Reload again → confirm visited set persisted (localStorage).
5. Click Undo → confirm last toggle reverts.
6. DevTools → Application → Service Workers → confirm `nl-provinces-v2` installed.
7. Inspect favicon → confirm it now shows the real NL outline.

## Risks & mitigations

- **Path size inflates HTML**: 20 KB of inline path data. *Mitigation:* still well under 100 KB, no perf concern; keeps the "no runtime deps, single fetch" PWA ethos intact.
- **Landmark positions slightly off after reprojection**: coords were computed from the same projection so they should land on-target; if any drift is visible in the screenshot, nudge the `translate()` values (single-line tweaks).
- **Stale cache after deploy**: addressed by `CACHE_NAME` bump in step 4.
