# T-049-01 — Review (handoff)

## What this ticket delivers

Arm A of E-16 — the **direct test of E-15's cliffhanger**. E-15's surgical loop rolled back 2 of 2 form
edits on the koi/heart text→JSON builds because its form target was a **flat concept silhouette**; it left
a documented `glbFormTarget` seam (throwing) for a real 3-D target. This ticket:

1. **Implements `glbFormTarget`** behind the existing `scoreRender(renderPath, R)` interface — projecting a
   TRELLIS GLB (via T-048-01's rasterizer) to a target silhouette, with a **true per-region IoU** masked to
   R's projected bounds (the signal the flat concept could not give).
2. **Re-runs the E-15 loop** on both builds with the GLB target swapped in and records the honest result.

**Headline finding:** the 3-D target **moved the loop on the heart** (an edit was accepted: GLB whole-object
IoU 0.456→0.462, per-region IoU 0.449→0.456) where the flat concept held 2/2. The **koi held** (a genuine
null on that build). So a 3-D target *does* supply signal a flat single-view concept cannot — on 1 of 2.

## Files changed

| File | Δ | Summary |
|---|---|---|
| `src/form/form-target.mjs` | **modify (+~150)** | `mapVoxelRegionToMesh` + `glbSilhouetteScore` (pure kernel) + real `glbFormTarget` (replaces the throwing stub). `conceptFormTarget`/`resolveFormTarget`/schema **unchanged**. |
| `src/form/form-target.test.mjs` | **modify** | Deleted the "throws" test; added groups F (kernel) + G (adapter via injected seams); extended swap-invariance (D) to the real GLB target. |
| `benchmarks/sculpture/glb-formtarget-ab.mjs` | **new** | The metered re-run harness (mirror of `form-revise-ab.mjs`; one line differs — the target). |
| `benchmarks/sculpture/glb-formtarget-ab.{json,md}` | **new (committed)** | The recorded before/after IoU + verdict. |
| `benchmarks/sculpture/glb-formtarget-ab/{koi,heart}/*.png` | **new (committed)** | before/proposed/after/crop renders (572 K; mirrors the committed `form-revise-ab/` renders). |

**Not touched:** `loop.mjs`, `region.mjs`, `glb-silhouette.mjs`, `form-fidelity.mjs`. The swap needed zero
change to the loop body / observe / diagnose / accept gate — **the seam invariant (AC #3) holds by
construction**, proven by the unchanged `resolveFormTarget` + the swap test. Committed as `d042016`.

## Acceptance criteria — status

- **AC #1 — `glbFormTarget` behind `scoreRender`, whole + true per-region IoU:** ✅
  `scoreRender(renderPath, R)` maps `R.subBounds` (voxel) → a 3-D mesh region (`mapVoxelRegionToMesh`),
  clips the GLB silhouette to it (`rasterizeSilhouette(mesh,{region})`), and IoUs vs the R-framed render —
  a *true* region-vs-region 3-D signal (not the concept's 2-D rect over a whole-object mask).
  `wholeObjectScore` gives the whole-object IoU. Replaces the throwing stub.
- **AC #2 — re-run via `liveFormScore`/`resolveFormTarget`, before/after IoU + judge recorded:** ✅
  `glb-formtarget-ab.{json,md}` from a LIVE run (headless render + `claude -p`/BAML editor). The LLM-edit
  route + per-region accept signal + whole-object before/after are all recorded per subject.
- **AC #3 — no loop control-flow change (drop-in `scoreRender`):** ✅ no `loop.mjs` edit; the harness's only
  behavioral difference from the concept run is `score: liveFormScore({ formTarget: glbFormTarget(...) })`.
- **AC #4 — honest did-it-move; pure logic unit-tested; `npm test` green:** ✅ heart moved, koi held —
  stated plainly. Kernel + adapter unit-tested offline (no GL, no 5 MB GLB). `npm test` green.

## Test coverage assessment

**Covered (offline, in `npm test`):**
- `mapVoxelRegionToMesh`: identity passthrough; an asymmetric mesh AABB with a front-lower-third voxel box
  → exact expected mesh region; a degenerate (zero-span) build axis → full mesh span, no NaN.
- `glbSilhouetteScore`: identical silhouettes → 1.0; proportion-mismatch → strictly <1 (and ≥0).
- `glbFormTarget` via injected `_loadMesh/_rasterize/_decode`: `kind`/`glbPath`; `scoreRender` forwards the
  mapped 3-D region (asserted equal to `mapVoxelRegionToMesh(...)`); `wholeObjectScore` forwards **no**
  region; `buildBounds` omitted → whole-object fallback; the 5 MB mesh loaded **once** (memoization);
  `glbPath` required.
- Swap-invariance: `resolveFormTarget({formTarget: glbFormTarget(...)})` returns it unchanged and
  `scoreRender` runs end-to-end — the AC #3 proof.

**Gaps / not automated (intentional):**
1. **The live A/B is metered + GL** (`claude -p` + headless render) — out of the unit suite by design
   (mirrors `form-revise-ab.mjs`). Its numbers are committed as a record, regenerable offline (`--offline`).
2. **The voxel→mesh fractional map is unit-tested on synthetic bounds, not on the real koi/heart AABBs** —
   the real alignment quality is an *eyeball* gate (the committed before/proposed/after renders) plus the
   IoU magnitudes. The map's correctness as math is asserted; its *appropriateness* for these two specific
   GLB/build pairs rests on the renders + the plausible IoUs (heart 0.46, koi 0.47 — same ballpark as the
   concept's 0.35/0.48, i.e. the GLB is not wildly misframed).
3. **`rasterizeSilhouette` itself** is T-048-01's, tested there; this ticket consumes it unchanged.

## Open concerns / known limitations (by design, not defects)

- **Orientation/axis mismatch is NOT corrected.** `mapVoxelRegionToMesh` corrects translation + per-axis
  scale only. If a TRELLIS GLB is rotated/axis-permuted vs the build, the silhouettes misalign and IoU
  drops — a *real* signal, but one that could confound a form judgment. The koi/heart GLBs happen to frame
  upright at `SCULPTURE_VIEW_3Q` (T-048-01's koi sanity PNG), so this did not bite here; a future subject
  could need a per-subject orientation hint. Documented in the module honesty ledger + the report note.
- **Single 3/4 view; silhouette ≠ form; absolute IoU depressed by coordinate-space mismatch** — the
  inherited E-13/E-14/E-15 ledger. The loop reads the **relative Δ**, which is what moved the heart.
- **The "n=2" caveat.** One accept (heart) and one hold (koi) is evidence the 3-D target is *load-bearing*,
  not a population claim. The result is honest, not a score-chasing win.

## Flag worth a reviewer's eye (a bug I caught + fixed pre-commit)

The first live emit flagged the **koi "regressed"** — impossible for a rolled-back (unchanged) build. Cause:
the verdict gate (inherited from `form-revise-ab.mjs`) compared the **GLB-measured** after against the
**concept-measured** E-13 baseline (0.481) — two different targets, so the GLB simply reading the unchanged
koi at 0.472 tripped a false alarm. **Fix:** the gate now compares **GLB-after vs GLB-before**
(apples-to-apples); the E-13 concept IoU is a cross-reference column only. Re-derived offline (measured
numbers preserved). Result: koi→**held**, heart→**improved**. If a reviewer extends this harness to more
subjects, keep the gate same-target — do not reintroduce the concept baseline into the verdict.

## Forward note

- The seam now proven load-bearing live (concept → GLB swap, zero loop change) is the foundation E-16's
  later arms (GLB-voxel build, surgical loop on GLB-voxel) build on.
- A natural follow-up if the per-region signal is to be trusted more: a per-subject orientation/scale
  calibration (or an ICP pre-align) to remove the residual rotation confound — explicitly out of scope here.
</content>
