# T-005-01 — Review

Handoff for a human reviewer. The work adds a **neoclassical** style (palette +
brief + coverage). Purely additive — no existing signature or consumer changed.

## What changed

| File | Change | Notes |
|------|--------|-------|
| `palettes/neoclassical.json` | **created** | 43-block whitelist, `minecraftVersion "1.20.1"`, groups `structure/columns/trim/glazing/lighting`. |
| `src/briefs.mjs` | **modified** | Appended `STYLE_BRIEFS.neoclassical` (frozen `{name, brief}`); industrial entry untouched. |
| `src/palette.test.mjs` | **modified** | +1 test: `loadPalette("neoclassical")`. |
| `src/briefs.test.mjs` | **created** | +6 tests: brief present/named-features, industrial regression, frozen map. |

Commit: `fe784bf`. Work artifacts in `docs/active/work/T-005-01/`.

## Acceptance criteria — status

- **AC#1 — palette exists, 1.20.1, validator passes.** ✅
  `node palettes/validate.mjs palettes/neoclassical.json` →
  `✓ neoclassical: 43 blocks valid & survival-obtainable for Minecraft 1.20.1`.
  Validator confirms schema-validity (Layer A), every id real + survival-obtainable
  for 1.20.1 (Layer B), and `groups ⊆ blocks`.
- **AC#2 — materials coherent for neoclassical.** ✅
  Pale-stone structure (quartz family, smooth/stone bricks, white/light-gray
  concrete, calcite, bone, white terracotta, polished diorite/andesite/granite);
  `quartz_pillar` columns; stairs/slabs/walls for entablature, cornice, steps,
  balustrade; clear + white-stained glazing for tall windows; sea lantern/glowstone/
  lantern/end rod/redstone lamp for warm lighting. Rationale in `design.md`.
- **AC#3 — `STYLE_BRIEFS["neoclassical"]` names defining features + pushes detail.** ✅
  Brief names symmetry, columned portico, entablature/cornice, pediment, stepped
  base/stylobate, tall windows; rewards "detail and scale … over a plain box."
  Asserted by regex in `briefs.test.mjs`.
- **AC#4 — existing tests pass + new coverage.** ✅
  `npm test` → **101/101** (was ~95). New: palette-load + briefs suite. Industrial
  palette re-validated (`✓`, 37 blocks) — no regression to the shared path.

## Test coverage

- **Covered:** palette loads with correct id/version/blocks/groups; brief exists,
  is named, is frozen, and names every required feature; industrial non-regression;
  validator gate on the real file.
- **Gaps (acceptable for this ticket):**
  - The palette validator is a CLI, **not part of `npm test`** — neoclassical's
    survival-legality is proven by a manual run recorded here/in `progress.md`, not by
    CI. If desired later, a unit test could shell out to `validate.mjs` or assert each
    id against `minecraft-data`. Out of scope here (mirrors how industrial is treated).
  - No render/visual test — rendering this style end-to-end is T-005-03/T-005-04.
  - The brief↔palette *fit* (does the brief only ask for things the palette can
    build?) is reasoned, not test-enforced. The feature words are matched textually,
    not against the block set.

## Open concerns / notes for the reviewer

- **Subjective material calls.** `mossy_stone_bricks`/`cracked_stone_bricks` were
  valid but intentionally excluded as "ruined/aged" (off-register); `calcite`,
  `bone_block`, `white_terracotta` were included as warm off-white marble
  alternatives. If the reviewer wants a stricter "pure quartz marble" palette, these
  three are the trim points. Easy to drop without code impact.
- **Wall vocabulary for balustrades is approximate.** Survival 1.20.1 has no true
  baluster; `stone_brick_wall`/`diorite_wall`/`cobblestone_wall` + `stone_button` are
  the closest. The brief asks for a balustrade; the archetype (T-005-03) will decide
  how literally to render it.
- **`columns` group has a single member** (`quartz_pillar`) by design — it's the one
  purpose-built column block; the brief directs reuse of quartz blocks/stairs/walls as
  drums/capitals/bases. Honest grouping (disjoint) over padding the group.
- **No human attention required** — additive data + tests, full suite green.

## Verification commands (reproduce)

```
node palettes/validate.mjs palettes/neoclassical.json   # ✓ 43 blocks
node palettes/validate.mjs palettes/industrial.json     # ✓ 37 blocks (regression)
npm test                                                 # 101/101
```
