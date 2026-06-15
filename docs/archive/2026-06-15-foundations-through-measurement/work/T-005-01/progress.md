# T-005-01 — Progress

Executed `plan.md`. No deviations from the plan. Committed as one atomic change
after each step verified clean (the steps are tightly coupled data+test, so a single
commit was the right granularity rather than four micro-commits).

## Completed

- **Step 1 — palette authored + validated.**
  Created `palettes/neoclassical.json`: 43 bare block ids, `minecraftVersion
  "1.20.1"`, grouped `structure / columns / trim / glazing / lighting` (groups
  disjoint, union = `blocks`, no ungrouped extras).
  `node palettes/validate.mjs palettes/neoclassical.json` →
  `✓ neoclassical: 43 blocks valid & survival-obtainable for Minecraft 1.20.1`.

- **Step 2 — style brief added.**
  Appended `STYLE_BRIEFS.neoclassical` to `src/briefs.mjs` (frozen `{name, brief}`,
  industrial untouched). Brief names symmetry, columned portico, entablature +
  cornice, pediment, stepped base/stylobate, tall windows; explicitly rewards detail
  and scale over a plain box.

- **Step 3 — palette-load coverage.**
  Added `loadPalette("neoclassical")` test to `src/palette.test.mjs` (id,
  version 1.20.1, non-empty blocks, includes `quartz_pillar`, has columns/trim groups).

- **Step 4 — brief-present coverage.**
  Created `src/briefs.test.mjs` (6 tests): frozen map, industrial regression,
  neoclassical present + name match + frozen, feature-naming regex, detail/plain-box.

- **Step 5 — final verification.**
  - `npm test` → **101/101 pass** (was ~95; +6: 1 palette-load + 5 briefs).
  - `node palettes/validate.mjs palettes/neoclassical.json` → `✓` (43 blocks).
  - `node palettes/validate.mjs palettes/industrial.json` → `✓` (37 blocks, no
    regression to the shared validator path).

- **Commit:** `fe784bf` —
  "T-005-01: add neoclassical palette + style brief (AC #1-#4)" (4 files).

## Deviations

- Single commit instead of four (plan allowed folding Steps 3–4). The palette,
  brief, and their tests are one logical unit; splitting would have left
  intermediate commits with a palette but no test. No scope change.

## Notes for review

- `polished_diorite_wall` was deliberately excluded — it does not exist in 1.20.1
  (verified in research); only `diorite_wall` (no "polished") is real. `cobblestone_wall`,
  `stone_brick_wall`, `diorite_wall` are the survival balustrade vocabulary used.
- `mossy_stone_bricks` / `cracked_stone_bricks` were valid but intentionally omitted
  (they read as ruined/aged, off the crisp-marble neoclassical register).
- Ticket frontmatter (`phase`/`status`) left untouched per RDSPI — Lisa advances it
  from the artifacts. The pre-existing working-tree edits to the T-005-0x ticket
  files were not staged or committed by this work.
