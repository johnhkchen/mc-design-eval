# Styles

One file per style (`<id>.json`). A style is how a faction or race builds. Adding one should be a data change, not code.

- `concept` is read by the concept-art generator (`src/concept/style-concept.mjs`). These are words about the place, kept separate from the shared art direction (`src/concept/look.mjs`), so the look can be tuned once for every style.
- `build` is read when a style gets built. It maps the style onto the town generator's existing contracts, so the client's placer lays any style the same way:
  - `shell`: the module family (`timber_relief`, `platform_hall`, or `null` until one is drawn).
  - `roles`: block per palette role. This is the same vocabulary as `assets-src/kingdoms/*/palettes.json`: post, beam, brace, infill, infill_ground, plinth, floor, roof, roof_stair, roof_slab, chimney, window, door, step, band, board.
  - `earthworks`, `bridge`, `harbour`, `founding`: which kit style dresses it (an existing kingdom's id, or `null` to draw).

`status` is `draft` until the owner approves its concept sheet, then `approved`. Builds start only from approved styles.

## Clans and the land

- `factions` (optional): clans of one race. Each clan has one canonical palette, a list of `mcd reskin` swaps from the style's authored base to the clan's primary materials. A clan never changes its palette. `default` is the clan used when none is named. Orc: mudhide (the owner's pick), sunscar, ashfang, bleakbone. Dwarf: deepforge (the base itself), redcrag, brasshammer.
- `settlement.json` lets the land pick the people. The biome at a town's centre (its `c:` tags) chooses a weighted candidate list of style and clan, and the town's seed draws one. A clan settles where its materials are local, for example sandstone in the desert and mud brick in the marsh. Only the yard follows the land: the authored `red_sand` and `dead_bush` become the biome's ground and plant.
- `src/styles/settle.mjs`: `settle(biome, seed)`, `swapsFor(style, clan, biome)`, plus a CLI that reskins a part.
