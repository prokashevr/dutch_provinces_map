# QA checklist

Manual checklist run before shipping changes. Pair with `node tests/smoke-test.mjs`
for the automated half. Serve the app over HTTP — ES modules don't load over
`file://`:

```sh
python3 -m http.server 18766 --directory docs --bind 127.0.0.1
```

## Core behavior

- [ ] First load: count reads `0/12`, progress bar empty, no provinces filled.
- [ ] Click a province on the map → it fills with its color, count increments,
      progress bar grows, the matching list dot fills.
- [ ] Click the same province again → it clears; count + progress + list dot revert.
- [ ] Click a list item → toggles the same province (no tooltip on list source).
- [ ] Tooltip shows the hovered/clicked province name with a `✓` when visited.
- [ ] Reload the page → previously visited provinces remain visited
      (storage key `dutchProvincesMap_v1`, shape `{ visited }`).
- [ ] Toggle a province, click **Undo** → reverts to its prior value; Undo button
      becomes disabled (one-level undo only).
- [ ] **Reset** prompts via `confirm()`; on confirm clears all visited; on cancel
      leaves state untouched.
- [ ] Visiting all 12 provinces shows the `All 12 provinces visited 🇳🇱` toast.

## Accessibility

- [ ] `Tab` moves focus through provinces and list items in a sensible order.
- [ ] With a province focused, `Enter` toggles it.
- [ ] With a province focused, `Space` toggles it and does **not** scroll the page.
- [ ] After every toggle, the focused element's `aria-pressed` reflects the new
      state (`"true"` when visited, `"false"` otherwise) — inspect via DevTools.
- [ ] Buttons `Undo` and `Reset` are reachable and operable via keyboard.
- [ ] Optional: with VoiceOver on macOS, focusing a province announces
      "button, pressed" / "button, not pressed".

## Mobile / PWA

- [ ] On a touch device the map taps register on the right province (icons over
      provinces don't intercept taps).
- [ ] Light haptic on toggle; longer pattern when reaching all 12.
- [ ] Add to Home Screen installs with the right name + icon.
- [ ] After first load, go offline (DevTools → Network → Offline) and reload —
      the app still loads from the cache.
- [ ] DevTools → Application → Cache Storage shows only `nl-provinces-v5`
      (older versions cleaned up by the `activate` handler).
- [ ] DevTools → Application → Service Workers shows `nl-provinces-v5` active
      with no errors.
- [ ] Console is clean (zero errors) after a hard reload.
