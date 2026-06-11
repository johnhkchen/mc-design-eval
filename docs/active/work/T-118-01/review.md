# T-118-01 roof-form-seam — Review (handoff)

## What this ticket shipped

A standing, judge-free **roof-region diff instrument** that turns "major: form @ roof" into
named, measurable, per-region gaps — plus the one refit the instrument's findings justified
(apex-evidence repair), with every pre-named refit candidate that the evidence refuted
explicitly named instead of built (E-30 Rule 2).

## Commits (main, in order)

| commit | content |
|---|---|
| `748b849` | `normalizePlacement` exposed from form-fidelity (one letterbox definition) + tests |
| `21b9b3c` | `src/view/roof-region-diff.mjs` pure core + 20 synthetic tests |
| `be5b8b3` (+ runner commit) | `benchmarks/sculpture/roof-diff.mjs` runner, `diff:roof` script, gitignore; 6 measured + 2 barn skip records; committed contact sheets |
| `3dcaf33` | committed findings (`benchmarks/sculpture/roof-diff/findings.md`) |
| `ad18214` | `fitRidgeLine` evidence repair + refreshed `roof/{cottage,gatehouse,church}.json` + before/after table in findings |

## Files created / modified

- **New**: `src/view/roof-region-diff.mjs` (+`.test.mjs`), `benchmarks/sculpture/roof-diff.mjs`,
  `benchmarks/sculpture/roof-diff/` (6 records + 2 skips + per-record `.md` + `findings.md`),
  `pr/assets/frames/roof-diff-*.png` (6 committed sheets), work-dir artifacts incl.
  `artifacts/before/` copies.
- **Modified**: `src/form/form-fidelity.mjs` (placement extraction, behavior-identical),
  `src/form/roof-ridge-fit.mjs` (footprint-cols sampling, dilated protrusion exclusion,
  dominant-line selector, `spike`/`excludedColumns` record fields), `src/form/provision-fit.mjs`
  + `benchmarks/sculpture/roof-program.mjs` (exclude wiring), `package.json`, `.gitignore`,
  `benchmarks/sculpture/roof/{cottage,gatehouse,church}.{json,md}` (evidence fields only).

## Acceptance criteria

- **Diff instrument**: ✅ pure (`src/view/roof-region-diff.mjs`, no fs/GL/RNG), unit-tested
  (25 new tests across two files; suite 1575 green), 4 gate azimuths, regions
  gable-ends/ridge/slopes/eaves (+`wall`, +`unpartitioned` fallback), per-region silhouette
  mismatch px + ridge/rake height profiles; run on cottage/gatehouse/church × both paths;
  records + sheets committed beside the gate records; barn **named-skipped** (T-117 not landed;
  skip records list the exact missing inputs).
- **Findings before fixes**: ✅ committed (`roof-diff/findings.md`); the gatehouse 315°
  regression decomposed: `unpartitioned` missing 403px — the GLB parapet/crenellation band above
  the build's slope line, NOT ridge height (raw ridge Δ −0.32 central span).
- **Targeted refits under the cage**: ✅ in the findings-gated sense — cottage gable-end residual:
  verge tips already match the GLB roof ends (−16 vs −16.5 etc.); the faceRmse 1.5 worry is GLB
  cluster noise; NO refit built, named with evidence. Gatehouse ridge: the invalid intersect's
  **impossibility named with the diff evidence** (the AC's resolve-or-name fork) — resolving
  would lower a correct ridge by 1.5. The justified repair: `fitRidgeLine` protrusion pollution
  (cottage apexLine was the chimney, church nave's the tower) — fit errors re-recorded, placements
  asserted byte-identical, cage outcomes unchanged (accepted rungs identical), before/after
  apexLine table + before copies prove the movement (record-level, intentionally not geometric).
- **No judge runs**: ✅ (greps clean; the instrument is the pure rasterizer end-to-end).
  **`--repro`**: ✅ roof-program PASS ×3 against refreshed records; `diff:roof -- --repro` 6×
  repro-pass; changed modules unreachable from legacy sculpture paths (importer audit).
  **No subject constants**: ✅ registry-iterated; params in `ROOF_DIFF_DEFAULTS` /
  `RIDGE_FIT_DEFAULTS`, shared. **`npm test`**: ✅ 1575/1575.

## Test coverage

New: placement transform (5); region partition/precedence/fitted-ends/fallback/guards (6);
attribution partition-invariant/nearest/empty (4); height-profile exactness/anchors/uncovered/
rakes (5); end-to-end semantics + determinism + fallback + projection (5); fitRidgeLine
spike-rejection/parapet-cols/back-compat (3). Gaps: the runner itself is untested under
`test:unit` (repo convention — runners are impure; its determinism is covered by the recorded
double-run + `--repro`); overlay PNG composition is display-only and unasserted.

## Open concerns for a human reviewer

1. **The dominant-line selector changes `fitRidgeLine` semantics** (longest contiguous wins, not
   highest; higher-but-shorter recorded as `spike`). All 17 module tests pass and the three
   refreshed records read correctly, but any downstream consumer that *wanted* "highest" should
   be checked — importer audit found only roof-program/provision-fit (evidence fields) and
   roof-swap's `ridgeVariant` (does not read apexLine).
2. **Attribution is a screen-space heuristic** (nearest projected exposed cell, BFS) — it
   localizes, it does not adjudicate; documented in the module's honesty ledger and the records'
   params note. `glbEave` plan-view-max pollution (gatehouse) is known and noted; eave-relative
   profiles for parapeted subjects should be read with the raw row alongside.
3. **Generated-path provision-fit records keep pre-repair apexLine values** until the generated
   chain re-runs under S-121 (re-running re-judges; forbidden here). Code path already repaired.
4. **Standing constructive targets for S-121/E-29** (named, not built): generated cottage
   cross-gable ridge −3.445 (the strongest single fixable signal the instrument found);
   gatehouse parapet/crenellation band (the actual 315° driver — wall-top form, outside the
   roof-program's gable vocabulary); church porch/apse mass at the nave lo-rake.
5. **Concurrency**: T-119-01 landed mid-flight and T-117-01 is in review in this same tree;
   my commits were staged file-by-file and touch none of the sibling files — but the branch
   state should be sanity-checked at merge/done-flip time.
