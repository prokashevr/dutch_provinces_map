# Visited Provinces — Netherlands (PWA)

Tap a province on the stylised map to mark it as visited. Each province has its own colour. Progress (X / 12) and an undo / reset live in the side panel. State persists in `localStorage`. Works fully offline once installed.

## Run locally

```sh
cd docs
python3 -m http.server 8000
```

Open `http://localhost:8000`. Service workers run on `localhost` without HTTPS, so PWA features work as-is.

## Deploy to GitHub Pages

1. Push `docs/` to `main` (or `master`).
2. Repo → **Settings → Pages** → Source: **Deploy from a branch**, Branch: `main`, Folder: `/docs`.
3. App will be live at `https://<user>.github.io/<repo>/`.

## Files

- `index.html` — App shell + inline SVG map (one `<path data-province>` per province) + landmark icons.
- `styles.css` — Design tokens, landscape-first layout, per-province visited colours.
- `app.js` — State (`visited` map + `lastAction` undo), localStorage round-trip, click + hover handling.
- `sw.js` — Cache-first service worker (`nl-provinces-v1`).
- `manifest.json` — Standalone PWA, SVG app icon.
- `icons/icon.svg` — Single SVG icon (resolves at any size, used for `any` and `maskable`).

## Replacing the map

The map is hand-crafted, stylised SVG paths. To swap in a more accurate or different map: replace the 12 `<path>` elements inside `<g class="provinces">` in `index.html`. Keep the `data-province` and `data-name` attributes intact and `app.js` / `styles.css` keep working unchanged.

## Landmark icons

Inline SVG `<g class="landmark">` elements at the bottom of the map. They are `pointer-events: none` so taps fall through to the province below. To add or move one, edit the `transform="translate(x y)"` on the relevant group.

## PWA checklist

- [x] `manifest.json` linked, `start_url` + `scope` set to `./` (works under any GitHub Pages subpath)
- [x] Service worker registered, shell cached on install
- [x] Theme colour + Apple meta tags
- [x] SVG app icon (resolves at any size, `purpose: "any maskable"`)
- [x] Offline-first: reload with the network tab set to *Offline* still works
