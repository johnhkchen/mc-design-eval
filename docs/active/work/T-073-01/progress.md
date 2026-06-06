# T-073-01 — concept-refine-pass · Progress

All plan steps complete. `npm test` green (**742**, was 706). 6 commits, additive — the E-15 loop core
(`loop.mjs`, `region.mjs`) is untouched. One mid-flight design correction (the block-remap op) was
surfaced by an adversarial probe and folded in; documented below.

## Steps completed

- **Step 1–2 — palette policy** ✓ `src/form/material-policy.mjs` + test (11→14 cases). `allowedPalette`,
  `gateAddition` (concept-justified, near-tone-accept, distinct-role), `classifySwap`, `applyCorrection`.
  Commit `feat(E-21 T-073-01): material palette policy …`.
- **Step 3 — material accept metric** ✓ `src/form/material-target.mjs` + test (12 cases).
  `colorAgreement` kernel, `regionColorClusters`, `conceptMaterialTarget`, `resolveMaterialTarget`,
  `liveMaterialScore`. No-top-level-GL static scan. Commit `feat(…): deterministic concept
  material-agreement metric`.
- **Step 4 — material editor** ✓ `src/revise/material-edit.mjs` + test (9→10 cases). `makeMaterialEditor`
  (async-propose/sync-replay stash, mirrors `makeFormEditor`), `defaultProposeCorrection` (lazy live leaf).
  Reuses `applyRegionEdit` + `assertArtifact` + `applyCorrection`. Commit `feat(…): swap-only material
  editor behind the E-15 accept-gate`.
- **Step 5 — proposer transport** ✓ `baml_src/materialcorrect.baml` (`CorrectRegion`, two images) +
  `src/revise/baml-material-correct.mts`. `npm run baml:gen` regenerates the client; `CorrectRegion`
  resolves in `b.request`/`b.parse`. Commit `feat(…): CorrectRegion BAML fn + live … bridge`.
- **Step 6 — runner + gatehouse proof** ✓ `benchmarks/sculpture/material-correct.mjs` (live + `--offline`
  + `--probe`), `package.json` (`material:correct`), `.gitignore`. Commit `feat(…): gatehouse concept
  material-correction run + offline re-verify`.

## Deviation from plan: the block-remap op (commit 6)

The plan specified swap-only ops (reusing `applyFormEdit`). The **`--probe`** adversarial check (deliberately
collapse a material to recreate a real defect) exposed that this does NOT work on the real subject: a
voxelized gatehouse region is **thousands** of individual placements, and the LLM correctly declined to
emit per-index swaps for ~1200 cells (proposed 0). Per-index swaps are the wrong granularity for a dense
voxel build — they fit the sparse, hand-authored placements the form editor was built for, not a
voxelization.

**Fix (folded in, additive):** a whole-material **remap** op `{fromBlock, toBlock}` that recolors every
matching cell in the region at once — the right primitive for "corrections to material *regions*" (AC#1's
own words). Threaded through `applyCorrection` (policy-gated like swaps), `makeMaterialEditor`, the BAML
fn (`MaterialRemap`, steered as the PREFERRED tool), and the bridge. Swaps remain for precise touch-ups.
This is more faithful to the AC, not a workaround. Documented in design-debt terms in `review.md`.

## Live results (the gatehouse, AC#5)

- **As-built run** (`material:correct`): concept colour agreement **0.657 → 0.657 (held)**, 0 corrections,
  P14 ok. The LLM (seeing render + concept) proposed ZERO corrections — the T-072 feature-assigned build
  was already concept-accurate. An honest hold (no regression), exactly the AC's "improves or honestly
  holds." Record: `material-correct/gatehouse.{json,md}` + `gatehouse/artifact.json`.
- **Probe run** (`material:correct --probe`, roof deepslate_tiles→stone_bricks collapse, 1211 cells):
  agreement **0.628 → 0.645 (improved)**, the LLM proposed **1 remap** restoring the dark roof, the
  deterministic gate **ACCEPTED** it (region 0.621→0.641), the corrected region **locked** (P14 ok), the
  already-correct lower region rolled back. This proves the corrective accept path fires end-to-end on the
  real subject. Record: `material-correct/gatehouse-probe.{json,md}` + `gatehouse-probe/artifact.json`.
- **Honest finding (kept, not hidden):** an earlier probe collapsing the NEAR-TONE corners
  (cobblestone→stone_bricks) yielded 0 proposals — a near-tone collapse is nearly invisible in a render,
  so a render-based refine pass cannot catch it. That is precisely why T-072 places near-tone materials by
  GEOMETRY, not colour; this refine pass is the complement for VISIBLE, semantic mis-zoning. Documented.

## Verification
- `npm test` → 742 pass, 0 fail.
- `node benchmarks/sculpture/material-correct.mjs --offline` → re-derives the verdict + re-validates the
  corrected artifact (AJV), no GL/model.
- `npm run baml:gen` → regenerates the gitignored client (the bridge resolves `CorrectRegion`).

## Not done (out of scope / deferred — see review.md)
A second subject (cottage); a finer 2-D concept-region clip for the per-region gate (whole-concept today);
trim/voussoir placement (T-072's documented gap). None block the ACs.
