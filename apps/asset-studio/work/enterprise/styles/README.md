# Styles

One file per style (`<id>.json`). A style is how a faction or race builds. Adding one should be a data change, not code.

- `concept` is read by the concept-art generator (`src/concept/style-concept.mjs`). These are words about the place, kept separate from the shared art direction (`src/concept/look.mjs`), so the look can be tuned once for every style.
- `build` is read when a style gets built. It maps the style onto the town generator's existing contracts, so the client's placer lays any style the same way:
  - `shell`: the module family (`timber_relief`, `platform_hall`, or `null` until one is drawn).
  - `roles`: block per palette role. This is the same vocabulary as `assets-src/kingdoms/*/palettes.json`: post, beam, brace, infill, infill_ground, plinth, floor, roof, roof_stair, roof_slab, chimney, window, door, step, band, board.
  - `earthworks`, `bridge`, `harbour`, `founding`: which kit style dresses it (an existing kingdom's id, or `null` to draw).

`status` is `draft` until the owner approves its concept sheet, then `approved`. Builds start only from approved styles.
