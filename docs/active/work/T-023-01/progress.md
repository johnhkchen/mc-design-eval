# T-023-01 — Progress

All four plan steps complete. `npm test` **200/200** green. No deviations from the plan.

## Completed

### Step 1 — Reuse-boundary test (AC1) ✅
`src/color/reuse-boundary.test.mjs` created. 4 tests:
1. cielab imports nothing relative or in the Minecraft/asset denylist;
2. cielab is a pure leaf (specifier set empty today);
3. `nearest()` usable standalone over a literal `[{key, lab}]` palette (no block-table in the test
   graph) — the E-09-shaped call;
4. `nearestLab()` accepts a Lab target directly (voxel-centroid path).

Green immediately against the current tree. Commit `test(E-10): assert cielab engine has no
project/Minecraft imports`.

### Step 2 — De-dupe block-table's `srgbToLab` (consolidation) ✅
`src/color/block-table.mjs`: imported `srgbToLab as srgbToLabRaw` from `./cielab.mjs`; deleted the
duplicated math (`srgbChannelToLinear`, `linearRgbToXyz`, `D65`/`DELTA`/`DELTA3`, `fLab`); replaced
`srgbToLab`'s body with a `round3`-wrapped delegator; rewrote the DUPLICATION NOTE → CONSOLIDATION
NOTE. ~24 lines of math removed; public surface unchanged.

Three gates all passed:
- **Output identity:** 4096-triple probe, `block-table.srgbToLab` vs `round3(cielab.srgbToLab)` →
  max abs diff **0**.
- **Table untouched:** `git diff --stat src/color/block-lab-table.json` → empty (no rebuild).
- **Suite:** `npm test` 200/200.

Commit `refactor(E-10): block-table delegates srgbToLab to cielab engine`.

### Step 3 — Name E-09 as the engine's third consumer (D3) ✅
`src/color/cielab.mjs` header gained one block naming E-09's voxelizer (stage 4) as the third consumer
and pointing at `reuse-boundary.test.mjs`. Comment-only; boundary test re-confirmed 4/4 (the new
comment contains no quoted import specifier, so the scan is unaffected). Folded into the docs commit.

### Step 4 — Journal + README (AC2, AC3) ✅
- `docs/knowledge/design-learnings.md`: new H2 `## E-10 — color-layer consolidation + E-09 reuse hook
  (S-023, T-023-01)` — what the layer delivers, conversion/ΔE/clustering choices, the
  extracted-vs-declared finding, the reuse-boundary statement, and the **E-09 stage-4 handoff
  paragraph**.
- `src/README.md`: new "Consolidation & reuse boundary (S-023)" subsection; updated the engine
  boundary note (enforced by the test) and the block-table delegation note (former duplicate gone).

Commit `docs(E-10): color-layer consolidation journal + E-09 stage-4 handoff`.

## Deviations
None. The de-dupe was in scope as the codebase's own named S-023 task (block-table's DUPLICATION
NOTE), and proceeded exactly as designed (output-preserving, table untouched). No CIEDE2000, no
k-means, no E-09 code, no table rebuild — all held out per D5.

## Commits (this ticket, on `main`)
1. `test(E-10): assert cielab engine has no project/Minecraft imports (T-023-01)`
2. `refactor(E-10): block-table delegates srgbToLab to cielab engine (T-023-01)`
3. `docs(E-10): color-layer consolidation journal + E-09 stage-4 handoff (T-023-01)`

## AC status
- AC1 (engine no MC/project imports): ✅ `reuse-boundary.test.mjs` + cielab contract line.
- AC2 (design-learnings color-layer section): ✅ section added.
- AC3 (E-09 stage-4 handoff paragraph): ✅ in the journal section + README.
- AC4 (`npm test` green): ✅ 200/200.
