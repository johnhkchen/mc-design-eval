# T-019-01 — Design: block→Lab color table

Decisions, with the rejected alternatives and why. Grounded in `research.md`.

## D1 — Asset access: read by `.directory`, default-import only to resolve it

**Decision.** `import mcAssets from 'minecraft-assets'`, call `mcAssets('1.20.1')`, take
`.directory` and `.version`, and read `blocks_models.json`, `blocks_textures.json`, and
`blocks/<name>.png` **directly from that path** with `node:fs`. Record `version` (the effective
`1.20.2`) in the output for provenance.

- *Rejected: drive everything through the package's JS API* (`getImageContent`, `blocks[...]`).
  It works but couples us to the package's internal `require` graph (the documented CJS gotcha)
  and to its model-merging semantics. Reading the JSON + PNGs directly is the path the ticket
  and the research doc both endorse, and it is trivially inspectable.
- *Rejected: read PNGs from `render/node_modules` directly without adding a root dep.* Violates
  AC #1 ("`minecraft-assets` added as a dependency and loadable") and leaves the builder broken
  if `render/` is ever cleaned. We add it at the root.
- *Rejected: pin literal `1.20.2` paths.* We pass `"1.20.1"` (the ticket's version) and let the
  package resolve; we then trust `.directory`/`.version`. If a future `minecraft-assets`ships a
  real `1.20.1`, no code change is needed.

## D2 — PNG decode: `pngjs`, as a **devDependency**

**Decision.** Add `pngjs@^7` and decode with `PNG.sync.read(buffer)` → guaranteed RGBA8 output
regardless of source color type / bit depth.

- *Why not a minimal decoder?* The textures are a zoo: 744 indexed PNGs at 1/2/4/8-bit with
  PLTE + tRNS, plus RGB, grayscale, gray+alpha, and RGBA — across all 5 scanline filters. A
  hand-rolled decoder covering that correctly is a real liability for a color table where a
  single mis-unfiltered scanline silently corrupts a block's color. `pngjs` is pure-JS,
  battle-tested, and normalizes everything to RGBA8. The cost (one dev dep, build-time only) is
  worth the correctness.
- **devDependency, not dependency.** Decode + asset extraction happen **once at table-build
  time**. The committed JSON table is what S-020/S-021 import at runtime. Keeping
  `minecraft-assets` and `pngjs` in `devDependencies` preserves the "portable color engine,
  zero Minecraft deps" goal of S-020 — the runtime never pulls the texture toolchain.

## D3 — Candidate selection: cube-parent filter + tint signal + tiny denylist

**Decision.** A block is in the table iff **all** hold:
1. its name is in `blocks_textures.json` (a *real* block, not a model template);
2. its model `parent` (after stripping `minecraft:`) starts with `block/cube`;
3. its model JSON contains no `tintindex`;
4. it is not in an explicit **denylist** of full-cube non-survival/greyscale-tinted blocks:
   `spawner`, `infested_*` (cube_all clones of stone textures, misleading duplicates),
   `jigsaw`, `command_block`, `chain_command_block`, `repeating_command_block`,
   `structure_block` (most already non-cube, listed for documented intent).

Rationale from research: the cube filter alone already drops leaves (`block/leaves`), grass
(`block/block`+tintindex), vines/water/lava/lily_pad (non-cube), and command blocks
(`template_*`). The tint signal + denylist are belt-and-suspenders so the result is defensible,
not a guess. The full exclusion reason for each dropped block is recorded (see D6).

- *Rejected: use `minecraft-data` block/item graph to decide "obtainable" precisely.* It is not
  a root dep, adds a second large package, and still wouldn't be exact. The real obtainability
  gate is the downstream palette whitelist (§6). A broad, documented full-cube table is the
  correct scope here — over-curating now would pre-empt S-021's job.
- *Rejected: include every `block/cube*` block (~308) with no denylist.* Ships `spawner`
  (transparent cage) and `infested_*` (stone-colored impostors) into the palette space, which
  are not things a designer should match against. The denylist is ~12 entries, documented.

## D4 — Representative color: mean of opaque pixels, side face, first frame

**Decision** (faithful to the research doc):
- **Face.** `cube_all`/`cube_mirrored_all`/`cube_north_west_mirrored_all` → `textures.all`.
  `cube_column*`/`cube_bottom_top` → `textures.side`. Generic `cube`/`cube_directional`/
  `cube_top`/`cube_mirrored` → prefer `side`, else `north`, else any face that is not
  top/bottom/up/down/end/particle, else `all`. Record the chosen texture name per entry.
- **Animated.** If PNG `height > width` and `height % width === 0`, use the **first frame** =
  rows `0 .. width-1`. (Robust without parsing `.mcmeta`.)
- **Mean.** Average R,G,B over pixels with **alpha ≥ 128** ("opaque"). If a block has *zero*
  opaque pixels at that threshold (degenerate), fall back to alpha > 0; if still none, skip the
  block and record it as excluded (`no-opaque-pixels`).
- **No gamma/premultiply tricks.** Mean is taken in **8-bit sRGB space** (the standard map-art
  choice the research doc names); the sRGB→Lab conversion then linearizes. Averaging in sRGB vs
  linear is a known minor bias; we follow the documented standard and note it as a future lever.

- *Rejected: dominant-color / median.* Mean is the documented standard; dominant is noted in the
  research doc as an alternative for high-variance textures, kept as a future knob, not default.
- *Rejected: averaging all 6 faces.* Adds model-resolution complexity for blocks a facade shows
  edge-on; "side face is what a facade shows" is the doc's guidance.

## D5 — Color math: embedded sRGB→Lab (CIE76-ready), duplicated on purpose

**Decision.** Implement `srgbToLab([r,g,b])` **inside this ticket's module** following the
research doc exactly: per-channel inverse-gamma → linear; linear→XYZ (D65 matrix); normalize by
D65 white (Xn=95.0489, Yn=100, Zn=108.8840); XYZ→Lab with the `δ=6/29` piecewise `f(t)`. Output
`lab` as `[L, a, b]` rounded to 3 decimals; `rgb` as integer `[r,g,b]`.

- **Why duplicate** the conversion that S-020 (`src/color/cielab.mjs`) will also own: T-019 and
  T-020 are parallel `depends_on: []` tickets; T-019 must not import a file that may not exist.
  The transient duplication is **explicitly S-023's** consolidation target (research doc framing).
  A header comment flags this so the dedupe is not forgotten.
- We do **not** implement ΔE here — distance/nearest-match is the engine's job (S-020). This
  ticket only needs the forward conversion to populate `lab`.

## D6 — Output: one committed JSON, regenerable by an npm script

**Decision.** Builder writes `src/color/block-lab-table.json`:
```json
{
  "version": "1.20.2",
  "requestedVersion": "1.20.1",
  "face": "side|all|…",          // per-entry, see blocks[]
  "generatedFrom": "minecraft-assets@<ver>",
  "blocks": [ { "block": "gold_block", "texture": "gold_block",
               "rgb": [r,g,b], "lab": [L,a,b] }, … ],
  "excluded": [ { "block": "oak_leaves", "reason": "biome-tinted (parent block/leaves)" }, … ]
}
```
- **Committed**, not gitignored: ~300 entries ≈ small (tens of KB), and the durable, reviewable
  artifact is exactly this table (mirrors how `palettes/*.json` are committed). The *bulky*
  assets (the `minecraft-assets` PNGs) already sit in gitignored `node_modules/`. So AC's "large
  texture assets stay gitignored" is satisfied by node_modules; the table itself is small enough
  to commit and is the point of the ticket.
- **Regeneration:** `npm run build:block-table` → `node scripts/build-block-table.mjs`. The
  builder is idempotent and deterministic (stable sort by block name).
- `excluded[]` makes the "documented which are excluded" AC literally machine-readable.

## D7 — File placement

`src/color/` (new dir, shared with S-020's `cielab.mjs`). Builder module
`src/color/block-table.mjs` (pure helpers + `buildBlockTable()` + `loadBlockTable()`), thin CLI
`scripts/build-block-table.mjs`, tests `src/color/block-table.test.mjs`, output
`src/color/block-lab-table.json`. Matches repo split of "logic in `src/`, CLI in `scripts/`."

## Test strategy (preview of plan.md)

Tests assert **semantic** properties, independent of the builder internals:
1. **Conversion reference values** — `srgbToLab` on pure white→L≈100/a≈0/b≈0, pure black→L≈0,
   mid-grey→a≈0/b≈0, pure blue→negative b\*. These derive from the CIELAB definition, not the
   builder.
2. **Known-block sanity on the committed table** — gold warm/yellow (high b\*, mid L\*),
   coal_block & blackstone near-black (low L\*), quartz_block near-white (high L\*), lapis blue
   (negative b\*), redstone_block red (positive a\*). Thresholds are loose, derived from color
   theory, not from re-running the builder.
3. **Structural invariants** — every entry has `block`/`rgb`/`lab`; rgb in 0..255; biome-tinted
   and non-full-cube blocks are absent (`oak_leaves`, `oak_stairs`, `grass_block` not present);
   `excluded[]` documents them.
