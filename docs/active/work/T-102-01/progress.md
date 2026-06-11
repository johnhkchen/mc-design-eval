# T-102-01 regularization-cage — Progress

All six plan steps executed. Five deviations, each documented below with rationale. `npm test`
green in this ticket's scope (one unrelated red from sibling T-103-01 mid-edit work, see review).

## Steps

- **Step 1+2+3 — pure core, silhouette path, cage, lift** → commits `018b5dc`, `5591220`.
  `src/view/shell-regularize.mjs` (census, open/close, exposedFaceMesh→rasterizeSilhouette
  silhouettes, regularizeShell cage) + `shell-regularize.test.mjs` (28 tests, synthetic shells
  only) + `protrudingStackRegion` lifted from spray-paint.mjs (import swap, behavior identical).
- **Step 4 — evidence runner** → commit `d031ef8`. `benchmarks/sculpture/regularize-shell.mjs`,
  `regularize:{cottage,gatehouse,church}` npm scripts, gitignore rule, three durable records +
  artifacts + committed before/after frames. `--offline` re-asserts all three.
- **Step 5 — chain wiring** → commits `8289f59`, `c9d7a98`. runChain rasterizes GLB refSils →
  `shellStage(base, refSils)` runs the cage after plugClosure; record/md/PIPELINE_ORDER updated in
  both milestone runners; full live cottage chain ran end-to-end as integration evidence.
- **Step 6 — docs** → this file + review.md.

## Results (AC #4 — declared targets: spikes −50%, ragged −10% relative; both asserted in-runner)

| subject | spikes (≥4/6 faces) | ragged columns | cage |
|---|---|---|---|
| cottage | 276 → 57 (**−79.3%**) | 23.9% → 9.6% (−59.9% rel) | open+close accepted |
| gatehouse | 132 → 44 (**−66.7%**) | 28.1% → 13.8% (−50.8% rel) | open+close accepted; close plug-remediated (2 cells) |
| church | 602 → 242 (**−59.8%**) | 24.3% → 14.4% (−40.7% rel) | **open REJECTED** (closure no-regress 225>213, recorded, rolled back); close accepted |

Zero cage regressions (every accepted step has an empty reasons list — asserted). IoU vs the GLB
held within 0.02 of the input shell at all 4 gate azimuths on every accepted step. Double-run
byte-identity on all three; the live cottage chain reproduced the standalone runner's numbers
exactly. Renders: the cottage "fake rafters" visibly gone (roof reads as a coherent stepped
slope); church's gappy roof plane filled coherently. Frames committed under
`pr/assets/frames/regularize-*-{before,after}.png`.

## Deviations from plan/design

1. **Structuring element: 26-cube, not the design's 6-cross.** Discovered via failing unit tests,
   then proven: opening is the union of structuring-ball translates that fit inside the mass, and
   an L1 ball (cross) fits with a 1-cell spike at its north pole — cross-opening keeps every
   1-voxel bump at ANY radius. The L∞ ball (3×3×3) shaves spikes/fins and fits right-angle box
   edges (the cross shaved corners). Documented in the module header.
2. **Cage closure check: strict-when-input-closed / no-regress-when-open, plus one plug
   remediation.** The design assumed "closure still passes"; reality: the committed church shell
   reads OPEN (213 reachable) under openings re-derived on the repaired artifact (its own chain
   run plugged against openings from the pre-shell base). Strict mode governs the chain path
   (input closed by construction); the standalone runner falls back to reached-count no-regress,
   whose hole-poking blind spot is named in the code. When a close roofs a recess on a closed
   shell, one plugClosure remediation runs and is re-judged by all three checks (gatehouse: 2
   plugs, flipped close from rejected to accepted).
3. **Plan steps 1–3 consolidated into two commits** — the SE correction (deviation 1) forced the
   morphology and cage to co-evolve; splitting them artificially would have committed a known-bad
   intermediate.
4. **Chain smoke flag**: the plan said `challenge:cottage -- --verify`; the real flag is
   `--repro`. The unknown flag fell through to the FULL live chain (including the metered
   kit-aware gate judge). Outcome treated as stronger-than-planned integration evidence and
   committed (run-refreshed records, repo precedent cc84103); gate verdict remains FAIL with the
   known E-25 roof-form gap — nothing tuned. Judge cost: one 4-view gate pass.
5. **Open is weak on raw rough shells** (cottage: 5 cells; gatehouse: 23; church: rejected): the
   erosion-removed set of a rough mesh-voxelized shell is one giant connected rough-skin component
   that minKeep correctly restores. Close does the heavy lifting (fills the concavities that MAKE
   the spikes read as spikes), then the census drops. Sequence kept as the declared default
   [open, close]; no per-subject tuning.

## Named residuals (Rule: honest gaps)

- **Ridge-beam fins survive** on all subjects: they are long, coherent, ≥minKeep components (or
  IoU-load-bearing mass) — exactly what the cage exists to protect. Re-authoring the roof is
  T-104 roof-as-program scope, per the epic decomposition.
- **Church retains 242 spikes**: its open was cage-rejected (closure no-regress on an open input).
  In the chain path (strict mode, closed input) open gets another chance at the S-107 re-run.
- **Close grows mass** (cottage +30% cells): concavity fill is silhouette-invisible by
  construction (IoU-gated) but downstream consumers see more placements.

## AC checklist

- [x] Pure morphological ops + census metrics, unit-tested on synthetic spiky shells (28 tests)
- [x] The cage: per-azimuth IoU tolerance vs GLB · closure (no-regress, strict on chain path) ·
      protected sub-regions (chimney stack + openings, ops honor + cage verifies) · automatic
      recorded rollback
- [x] Wired after shell integrity behind named npm chains; no hand-edits; no subject constants
- [x] Cottage/gatehouse/church run with before/after numbers vs the 276 / 23.9% baseline,
      declared targets met, residuals named, zero cage regressions
- [x] Before/after oblique renders per subject (committed frames); `npm test` green in scope
