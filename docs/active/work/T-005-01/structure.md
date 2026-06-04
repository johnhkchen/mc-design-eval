# T-005-01 — Structure: file-level blueprint

The shape of the change. No code — the files, their contents at the interface level,
and the order. Four files touched: 1 created palette, 1 modified data module, 2 tests
(1 modified, 1 created).

## Files

### CREATE — `palettes/neoclassical.json`

A palette object conforming to `palettes/palette.schema.json` (root
`additionalProperties: false`; required `id, name, minecraftVersion, description,
blocks`; optional `groups`).

```
{
  "id": "neoclassical",
  "name": "Neoclassical",
  "minecraftVersion": "1.20.1",
  "description": <one line, pale-stone/marble material intent, prompt-facing>,
  "blocks": [ <~40 bare ids, the union of the groups below, unique> ],
  "groups": {
    "structure": [ light ashlar/marble masses ],
    "columns":   [ quartz_pillar, quartz_block, chiseled_quartz_block, ... ],
    "trim":      [ stairs, slabs, walls, stone_button — cornice/steps/balustrade ],
    "glazing":   [ glass, glass_pane, white_stained_glass(+_pane) ],
    "lighting":  [ sea_lantern, glowstone, lantern, end_rod, redstone_lamp ]
  }
}
```

Constraints the file must satisfy:
- `id` matches `^[a-z][a-z0-9-]*$` → `"neoclassical"`.
- `minecraftVersion` exactly `"1.20.1"`.
- `blocks` unique, bare ids matching `^[a-z][a-z0-9_]*$`.
- `groups` disjoint; **every group member also appears in `blocks`** (subset
  invariant). The `blocks` array = the sorted/grouped union of all group members
  (no ungrouped extras, to keep the whitelist fully accounted for).
- Every id verified valid + survival-obtainable for 1.20.1 (research list).

Concrete id set (all verified in research):
- structure: `quartz_block`, `smooth_quartz`, `chiseled_quartz_block`,
  `quartz_bricks`, `smooth_stone`, `stone`, `stone_bricks`,
  `chiseled_stone_bricks`, `white_concrete`, `light_gray_concrete`, `calcite`,
  `bone_block`, `white_terracotta`, `polished_diorite`, `polished_andesite`,
  `polished_granite`.
- columns: `quartz_pillar`.
- trim: `quartz_stairs`, `quartz_slab`, `smooth_quartz_stairs`,
  `smooth_quartz_slab`, `stone_brick_stairs`, `stone_brick_slab`,
  `stone_brick_wall`, `stone_stairs`, `stone_slab`, `smooth_stone_slab`,
  `polished_diorite_stairs`, `polished_diorite_slab`, `diorite_stairs`,
  `diorite_slab`, `diorite_wall`, `cobblestone_wall`, `stone_button`.
- glazing: `glass`, `glass_pane`, `white_stained_glass`,
  `white_stained_glass_pane`.
- lighting: `sea_lantern`, `glowstone`, `lantern`, `end_rod`, `redstone_lamp`.

(`columns` is intentionally small — the pillar is the one purpose-built column
block; the brief directs reuse of quartz blocks/stairs/walls as drums, capitals,
and bases. This keeps groups disjoint and honest.)

### MODIFY — `src/briefs.mjs`

Append one entry to the existing `STYLE_BRIEFS = Object.freeze({ … })` map, after
`industrial`. Same shape as industrial:

```
neoclassical: Object.freeze({
  name: "neoclassical",
  brief: "<concatenated multi-line string>",
}),
```

The `brief` string must name (so AC #3's "names the defining features" is met):
**symmetry**, a **columned portico**, **entablature** and **cornice**, a
**pediment**, a **raised stepped base / stylobate**, **tall windows** — and push for
**architectural detail and scale** over a plain box. No other export changes; the map
stays frozen; `industrial` untouched.

### MODIFY — `src/palette.test.mjs`

Add one `test(...)` block (after the existing industrial loadPalette test), mirroring
its assertions for neoclassical:
- `loadPalette("neoclassical").id === "neoclassical"`
- `.minecraftVersion === "1.20.1"`
- `Array.isArray(blocks) && blocks.length > 0`
- `blocks.includes("quartz_pillar")` (signature column block)
- `typeof p.groups === "object"` and includes a `columns`/`trim` key.

No change to existing tests or the pure-formatter tests.

### CREATE — `src/briefs.test.mjs`

New unit file (none exists today). Imports `{ STYLE_BRIEFS } from "./briefs.mjs"`.
Tests:
1. `STYLE_BRIEFS.neoclassical` is defined; `.name === "neoclassical"`.
2. The brief text names the features — assert via case-insensitive regex for:
   `column|portico`, `pediment`, `entablature|cornice`, `stylobate|stepped`,
   `symmetr`. (Multiple small assertions, each with a message.)
3. Regression: `STYLE_BRIEFS.industrial` still present with `name === "industrial"`.
4. `Object.isFrozen(STYLE_BRIEFS)` is true (data contract).

## Ordering

1. Write `palettes/neoclassical.json`, then run
   `node palettes/validate.mjs palettes/neoclassical.json` → must print `✓`.
   (Gate the whole ticket on this before touching JS.)
2. Append the `neoclassical` brief to `src/briefs.mjs`.
3. Add the palette-load test to `src/palette.test.mjs`.
4. Create `src/briefs.test.mjs`.
5. Run `npm test` → all green (existing + new).

## Interfaces / boundaries (unchanged)

- No signature changes anywhere. `loadPalette`/`formatPaletteBlocks`/`single-shot`
  consume the new data unchanged. The schema and validator are unchanged. This is a
  pure data + test addition.

## Out of scope (explicit)

- No changes to `palette.schema.json`, `validate.mjs`, `palette.mjs`, `single-shot.mjs`.
- T-005-03 (the archetype that *uses* this style) is a separate ticket; this ticket
  only ships the style data + coverage.
