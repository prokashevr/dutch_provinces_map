# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static, dependency-free PWA that lets users tap Dutch provinces on an SVG map to mark them visited. State persists in `localStorage`, the shell is cached by a service worker, and it's deployed via GitHub Pages.

There is **no build step, no package manager, no test suite, no linter**. Editing `docs/*.{html,css,js,svg,json}` is the entire workflow.

## Run locally

```sh
cd docs
python3 -m http.server 8000
```

Open `http://localhost:8000`. Service workers run on `localhost` without HTTPS, so PWA features (install, offline, cache) work as-is. Any static file server on the `docs/` directory works equivalently.

## Deploy

GitHub Pages serves the site directly from the `docs/` folder on `main`. There is no CI — pushing to `main` is the deploy. The `start_url`/`scope` of `manifest.json` is `./` so the app works under any GitHub Pages subpath.

## Architecture

Everything user-facing lives in [docs/](air-file://dcmvqgoj39tmg5jcheam/Users/roman.prokashev/air/dutch_provinces_map/docs?type=file&root=%252F). The `docs/` name is load-bearing — GitHub Pages is configured to serve from it.

- **`index.html`** — App shell. The map itself is inline SVG (`<svg id="map">`): one `<path data-province="…" data-name="…">` per province, plus a `<g class="landmarks">` group of 5 decorative icons that are `pointer-events: none` so taps fall through to the province below.
- **`app.js`** — All state and DOM wiring. State shape: `{ visited: { [id]: true }, lastAction: { id, prevValue } }`. Persisted to `localStorage` under key `dutchProvincesMap_v1`. Click handling is event-delegated on `#map` and `#provinceList`, matching `[data-province]` via `closest()`. One-level undo only.
- **`styles.css`** — Design tokens at `:root`. Each province has a dedicated `--c-{id}` token and a matching `.province[data-province="{id}"].visited { fill: var(--c-{id}); }` rule, plus the corresponding `.pv-item[data-province="{id}"].is-visited .pv-dot` rule for the side panel dot.
- **`sw.js`** — Cache-first service worker. `SHELL_ASSETS` is the install-time precache list. Same-origin GETs are served from cache, then network with cache-fill fallback.
- **`manifest.json`** — Standalone PWA config, `display: standalone`, single SVG icon with `purpose: "any maskable"`.
- **`icons/icon.svg`** — Single resolution-independent app icon.

### The 12-province ID contract

The province IDs (`friesland`, `groningen`, `drenthe`, `overijssel`, `flevoland`, `noord-holland`, `zuid-holland`, `utrecht`, `gelderland`, `zeeland`, `noord-brabant`, `limburg`) are duplicated across **four** places and must stay in sync:

1. `data-province="…"` on each `<path>` in `index.html`
2. The `PROVINCES` array in `app.js`
3. `--c-{id}` tokens and the per-province `.visited` / `.is-visited` selectors in `styles.css`
4. Per-province `<path fill="…">` colors in `icons/icon.svg`

Renaming, adding, or removing a province requires touching all four. The map geometry can be swapped freely as long as `data-province` and `data-name` attributes are preserved on the new paths — `app.js` and `styles.css` don't care about path shapes.

### Service-worker cache invalidation

When you change anything in `SHELL_ASSETS` (HTML/CSS/JS/manifest/icon), **bump `CACHE_NAME` in `sw.js`** (e.g. `nl-provinces-v2` → `v3`). The `activate` handler deletes any cache whose key doesn't match the current `CACHE_NAME`, which is what forces installed clients to pick up the new shell on next reload. Without the bump, returning users keep the stale cached version indefinitely.
