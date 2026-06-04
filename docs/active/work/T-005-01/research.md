# T-005-01 — Research: neoclassical palette and style brief

Descriptive map of the code and conventions this ticket touches. No solutions here.

## Ticket in one line

Add a **neoclassical** style: a palette whitelist file (`palettes/neoclassical.json`,
same format/tooling as `palettes/industrial.json`) plus a `STYLE_BRIEFS["neoclassical"]`
entry in `src/briefs.mjs`, with unit coverage that both load/are present. Pinned to
Minecraft **1.20.1** and passing `node palettes/validate.mjs`.

## The two artifacts that exist today (the templates to mirror)

### 1. Palette files — `palettes/`

- `palettes/industrial.json` is the lone shipped palette and the canonical example.
  Shape (validated by `palette.schema.json`):
  - `id` (kebab-case, `^[a-z][a-z0-9-]*$`) — unique style id, also the file stem.
  - `name` — human display name.
  - `minecraftVersion` — `^\d+\.\d+(\.\d+)?$`; industrial is `"1.20.1"`.
  - `description` — one-line, prompt-facing material intent.
  - `blocks` — **the whitelist**, the single source of truth. Bare ids
    (`^[a-z][a-z0-9_]*$`, no `minecraft:` prefix), unique, non-empty.
  - `groups` — optional advisory map (`structure` / `concrete` / `metal` /
    `glazing` / `accent` in industrial). **Every member must also be in `blocks`**
    (subset invariant, enforced by the validator). `additionalProperties: false`
    on the root: no extra top-level keys allowed.

- `palettes/palette.schema.json` — JSON Schema (draft 2020-12) for the above.
  Root is `additionalProperties: false`; required = `[id, name, minecraftVersion,
  description, blocks]`. `groups` is `additionalProperties: { array of block-id
  strings }`.

- `palettes/validate.mjs` — the authority. Two layers + one invariant:
  - **Layer A (structural):** Ajv 2020 compile of `palette.schema.json`.
  - **Layer B (semantic):** for the declared `minecraftVersion`, every block id
    must (a) exist in `minecraft-data` (`data.blocksArray` names) and (b) NOT be
    in the `NON_SURVIVAL` set (air/barrier/command blocks/fluids/portal/etc.).
    The strip helper removes a leading `minecraft:` before the check.
  - **Invariant:** `groups ⊆ blocks`.
  - Usage: `node palettes/validate.mjs <path>`. Exit 0 / printed `✓ <id>: N
    blocks valid…`; exit 1 with a reason on any failure.
  - Runs against `palettes/node_modules` (its own `minecraft-data` install).

- `palettes/package.json` declares `minecraft-data` + `ajv`; `palettes/.gitignore`
  ignores only `node_modules/`. `palettes/README.md` documents the format.

### 2. Style briefs — `src/briefs.mjs`

- Pure, frozen data — no logic, no I/O. Two exports:
  - `TARGET_BRIEFS` (house / path / landscape) — unrelated to this ticket.
  - `STYLE_BRIEFS` — `Object.freeze` map keyed by style name. Today only
    `industrial`. Each entry is `Object.freeze({ name, brief })`:
    - `name` — lands in the artifact's `style.name`.
    - `brief` — architectural/aesthetic intent prose, paired with the palette's
      material description; the model commits to it in `style.rationale`.
  - The `industrial` brief is one long concatenated string (multi-line via `+`),
    ~5 sentences of aesthetic direction.

## How the two are consumed (so I don't break a caller)

- `src/palette.mjs` — `loadPalette(id)` reads `palettes/<id>.json` by path
  (does NOT import the `palettes/` module or re-validate — authoring-time
  validation is the authority). `formatPaletteBlocks(palette)` renders the
  whitelist group-by-group when `groups` exists, else a flat comma list;
  ungrouped blocks fall under an `other:` line. Pure + deterministic.
- `src/single-shot.mjs` — imports `STYLE_BRIEFS`; validates `s.style` is a known
  key (line 63: `if (!STYLE_BRIEFS[s.style]) throw …`), then injects
  `STYLE_BRIEFS[style].brief` into the prompt. So adding a key is purely additive —
  it makes `"neoclassical"` a newly-accepted style with no edits to single-shot.
- `src/single-shot.test.mjs` asserts the industrial brief text appears in the
  built prompt (`prompt.includes(STYLE_BRIEFS.industrial.brief)`).

## Tests & how they run

- `npm test` = artifact self-test + `npm run test:unit`
  (`node --test "src/**/*.test.mjs"`). Current suite ~95 tests, all green.
- **There is no `src/briefs.test.mjs` today** — `STYLE_BRIEFS` is only exercised
  indirectly via `single-shot.test.mjs`. `palette.test.mjs` tests `loadPalette`
  against the shipped industrial palette and the pure formatter.
- Palette validation is NOT part of `npm test`; it is a separate CLI
  (`node palettes/validate.mjs <path>`). The AC calls for running it on the new
  file explicitly.

## Minecraft 1.20.1 reality (verified against `minecraft-data` in `palettes/`)

Confirmed **valid & survival-obtainable** for 1.20.1 (ran `blocksArray` lookup):
quartz_block, quartz_pillar, chiseled_quartz_block, smooth_quartz,
quartz_stairs, quartz_slab, smooth_quartz_stairs, smooth_quartz_slab,
quartz_bricks, smooth_stone, smooth_stone_slab, stone, stone_bricks,
chiseled_stone_bricks, cracked_stone_bricks, mossy_stone_bricks,
stone_brick_stairs, stone_brick_slab, stone_brick_wall, stone_stairs,
stone_slab, stone_button, cobblestone_wall, polished_diorite, diorite,
polished_diorite_stairs, polished_diorite_slab, diorite_stairs, diorite_slab,
diorite_wall, polished_andesite, andesite, polished_granite, granite,
white_concrete, light_gray_concrete, calcite, bone_block, white_terracotta,
glass, glass_pane, white_stained_glass, white_stained_glass_pane,
sea_lantern, glowstone, lantern, end_rod, redstone_lamp.

Confirmed **INVALID for 1.20.1** (must NOT use): `polished_diorite_wall`
(diorite walls don't exist; only cobblestone/mossy-cobblestone/stone-brick/
mossy-stone-brick/granite/andesite/diorite… wait — diorite_wall DOES exist;
`polished_diorite_wall` does not). `stone_brick_walls` (typo; correct id is
`stone_brick_wall`).

## Constraints / assumptions surfaced

- **Version pin is instrument-wide 1.20.1** (CLAUDE.md + render pin); the palette
  MUST declare `"1.20.1"`, not 1.20.4 — using an unsupported id would silently
  mis-render (the coral-walls bug this story follows from).
- The palette is the *binding* material set; the brief is *aesthetic* direction.
  They are complementary, not redundant — the brief names features (portico,
  pediment…) the palette can't express.
- Block ids must be bare and survival-obtainable; walls/stairs/slabs are the
  vocabulary for columns, cornices, steps, and balustrades the brief will call for.
- No caller needs to change: adding a palette file + a frozen brief key is purely
  additive. Risk is limited to (a) an invalid block id failing the validator and
  (b) a test referencing the new key.
