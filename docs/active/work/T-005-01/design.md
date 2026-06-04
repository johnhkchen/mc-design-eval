# T-005-01 — Design: neoclassical palette and style brief

Decisions, grounded in `research.md`. The work is additive; the design questions
are about *content* (which blocks, what brief) and *where the test coverage lives*.

## Decision 1 — File layout: mirror industrial exactly

**Chosen:** `palettes/neoclassical.json` with the same five required keys + a
`groups` map, declaring `minecraftVersion: "1.20.1"`. `STYLE_BRIEFS["neoclassical"]`
appended to `src/briefs.mjs` in the same `Object.freeze({ name, brief })` shape.

**Why:** the schema, validator, `loadPalette`, and `single-shot` consumption are all
built around this shape; mirroring it means zero code changes outside the two data
files + tests. Rejected: introducing a richer palette schema (e.g. per-block roles).
That's scope creep — the schema is `additionalProperties: false`, and the brief
already carries role/feature intent. The advisory `groups` map is the right place
for the structure/column/trim/glazing/lighting framing.

## Decision 2 — Block selection: cover neoclassical *form*, stay survival-legal

The brief (T-005-03 will lean on this) demands columns, entablature/cornice,
pediment, a stepped stylobate, tall windows, and symmetry. The palette must give the
model the vocabulary to express each. Mapping feature → material:

- **Columns / pilasters:** `quartz_pillar` (fluted-looking vertical), `quartz_block`,
  plus `quartz_stairs`/`quartz_slab` and `stone_brick_wall`/`diorite_wall` for
  fluted shafts and capitals/bases (walls render as round-ish posts — useful as
  column drums).
- **Walls / structure (light stone):** `smooth_quartz`, `quartz_block`,
  `chiseled_quartz_block`, `quartz_bricks`, `smooth_stone`, `stone_bricks`,
  `chiseled_stone_bricks`, `white_concrete`, `light_gray_concrete`. Light, smooth,
  ashlar-like — the neoclassical "marble" read. `calcite` and `bone_block` give a
  warmer off-white veined alternative; `white_terracotta` a matte stucco.
- **Entablature / cornice / trim:** stairs + slabs let the model project horizontal
  bands: `quartz_stairs`, `quartz_slab`, `smooth_quartz_stairs`, `smooth_quartz_slab`,
  `stone_brick_stairs`, `stone_brick_slab`, `stone_stairs`, `stone_slab`,
  `smooth_stone_slab`, `polished_diorite_stairs`, `polished_diorite_slab`,
  `diorite_stairs`, `diorite_slab`.
- **Pediment:** the same stairs/slabs build the raking cornice + tympanum triangle.
- **Stepped base / stylobate + steps:** stairs/slabs again, plus full `stone`,
  `smooth_stone`, `polished_granite`/`granite`, `polished_andesite`/`andesite`,
  `polished_diorite`/`diorite` as a slightly darker plinth/contrast course.
- **Balustrade / parapet:** `stone_brick_wall`, `diorite_wall`, `cobblestone_wall`,
  `stone_button` (as a small molding/stop) — walls are the closest survival
  baluster.
- **Tall windows / glazing:** `glass`, `glass_pane`, `white_stained_glass`,
  `white_stained_glass_pane` (mullioned tall windows).
- **Warm lighting:** `sea_lantern`, `glowstone`, `lantern`, `end_rod`,
  `redstone_lamp`. (`end_rod` doubles as a slim finial/acroterion.)

**Rejected materials & why:**
- `polished_diorite_wall` — does not exist in 1.20.1 (verified); would fail Layer B.
- Colored concretes beyond white/light-gray, terracotta hues, copper, dark woods —
  off-style (neoclassical is pale stone/marble); they'd dilute the whitelist and
  invite non-neoclassical builds. Keep the palette tight and on-theme.
- `mossy_stone_bricks` / `cracked_stone_bricks` — these read as *ruined/aged*, which
  is a different (picturesque/Romantic) register. Excluded to keep the style crisp
  and "new marble," though they are valid ids. (Documented here so the omission is
  deliberate, not an oversight.)

Net: a ~40-block whitelist, all verified valid+survival for 1.20.1, grouped into
`structure / columns / trim / glazing / lighting`.

## Decision 3 — Groups taxonomy

Industrial used `structure / concrete / metal / glazing / accent`. Neoclassical's
salient axis is *architectural element*, so: **`structure`** (wall/ashlar masses),
**`columns`** (pillars + wall posts + the stair/slab pieces that cap them),
**`trim`** (stairs/slabs/walls/buttons for entablature, cornice, steps, balustrade),
**`glazing`**, **`lighting`**. Every member also appears in `blocks` (subset
invariant). A block may belong to one group only in the map (industrial keeps groups
disjoint); I'll keep them disjoint to satisfy `formatPaletteBlocks` cleanly and avoid
double-listing. Stairs/slabs are conceptually shared between trim and columns —
assign each id to exactly one group (trim) and let the brief explain reuse.

## Decision 4 — The style brief text

A single concatenated string (industrial's pattern), naming the defining features the
AC enumerates: **symmetry / a columned portico / entablature + cornice / a pediment /
a raised stepped base (stylobate) / tall windows**, and explicitly pushing for
*detail and scale over a plain box* so T-005-03 has something to refine. Tone matches
industrial: directive, material-aware, ~5–6 sentences. It must complement (not repeat)
the palette `description`.

## Decision 5 — Test coverage placement

AC #4: "neoclassical palette loads and the style brief is present," existing tests
still pass.

**Chosen:**
- Extend `src/palette.test.mjs` with a test that `loadPalette("neoclassical")`
  returns `id === "neoclassical"`, `minecraftVersion === "1.20.1"`, a non-empty
  `blocks` array containing a signature block (e.g. `quartz_pillar`), and a `groups`
  object — mirroring the existing industrial test.
- Add a new `src/briefs.test.mjs` asserting `STYLE_BRIEFS.neoclassical` exists, has
  `name === "neoclassical"`, and its `brief` names the key features (regex for
  column/portico, pediment, entablature/cornice, stepped/stylobate, symmetry).
  Also assert industrial is still present (no regression) and the map is frozen.

**Why a new briefs test file:** `STYLE_BRIEFS` has no direct unit file today; the
AC asks for explicit "style brief is present" coverage, and a `briefs.test.mjs`
documents the contract independent of single-shot. Rejected: folding brief assertions
into `single-shot.test.mjs` — that couples style-data coverage to the archetype and
hides it.

**Validator run:** `node palettes/validate.mjs palettes/neoclassical.json` is run
manually as the AC-gating check (it's not in `npm test`). Recorded in progress.md.

## Risks

- A mistyped id fails Layer B — mitigated by pre-verifying every id against
  `minecraft-data` 1.20.1 (done in research).
- `groups ⊆ blocks` violation — mitigated by deriving groups from the same id list.
- Over-broad palette inviting off-style builds — mitigated by Decision 2's tight,
  pale-stone selection and deliberate exclusions.
