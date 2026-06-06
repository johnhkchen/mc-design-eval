# T-049-01 — Progress

## Step 1 — Pure kernel (`mapVoxelRegionToMesh`, `glbSilhouetteScore`) ✅

`src/form/form-target.mjs`: added the two pure exports + the form-fidelity imports
(`extractSilhouette, normalizeSilhouette, iou, RENDER_BG, FORM_DEFAULTS`). `mapVoxelRegionToMesh` does the
per-axis whole-AABB fractional map (degenerate-axis guard → full mesh span; min≤max normalization).
`glbSilhouetteScore` extracts the render silhouette (`RENDER_BG`), normalizes both masks to G×G, returns
`iou`. Tests (group F): identity/asymmetric/degenerate map; identical→1, proportion-mismatch→<1. Green.

## Step 2 — `glbFormTarget` adapter (replaced the throwing stub) ✅

Replaced `glbFormTarget(opts){ throw FormTargetNotImplementedError }` with the real adapter:
- `scoreRender(renderPath, R)` → per-region IoU (maps `R.subBounds`→mesh region via `buildBounds`, clips
  the GLB silhouette to it, IoUs vs the R-framed render). Falls back to whole-object IoU when `buildBounds`
  is absent.
- `wholeObjectScore(renderPath)` → whole-object IoU (no region clip) for the harness verdict.
- Lazy + memoized 5 MB GLB load; `view=SCULPTURE_VIEW_3Q`, `grid/fit` from `FORM_DEFAULTS`;
  `_loadMesh/_rasterize/_decode` injectable.
- `FormTargetNotImplementedError` kept exported (back-compat; docstring updated — no longer thrown).
- `resolveFormTarget` UNCHANGED — the seam invariant.

Tests: deleted the old "throws" test (B); added group G (region-forwarding, whole-object no-region,
no-buildBounds fallback, load-once memoization, glbPath-required) + extended swap-invariance (D) to the
real GLB target. `form-target.test.mjs` → 19 local tests, all green; full `npm test` green.

## Step 3 — Metered E-15 re-run harness + recorded result ✅

`benchmarks/sculpture/glb-formtarget-ab.mjs` (mirror of `form-revise-ab.mjs`; the ONLY behavioral
difference is `score: liveFormScore({ formTarget: glbFormTarget({ glbPath, buildBounds }) })`). Ran LIVE
(headless render + `claude -p`/BAML editor) on both subjects; wrote `glb-formtarget-ab.{json,md}` +
before/proposed/after/crop renders under `glb-formtarget-ab/<subject>/`.

**Result (honest):**

| subject | GLB whole before→after | region IoU before→after | E-13 concept ref | kept? | verdict |
|---|:--:|:--:|--:|:--:|---|
| koi | 0.472→0.472 | 0.593→0.593 | 0.481 | ✗ | **held** |
| heart | 0.456→0.462 | 0.449→0.456 | 0.347 | ✓ | **improved** |

**The 3-D GLB target moved the loop on the heart** (the flat concept run held 2/2). The koi held — a
genuine null on that build. So the 3-D target gives signal the flat concept could not, on 1 of 2 builds.

### DEVIATION (caught + fixed before commit): verdict metric-mixing

The first live emit flagged the koi **"regressed"** — an alarm that is *impossible* for a rolled-back
(unchanged) build. Root cause: I had inherited `form-revise-ab.mjs`'s `formVerdictOf(e13Baseline, after,
…)`, which compared the **GLB-measured** after against the **concept-measured** E-13 baseline (0.481).
Different targets → the GLB simply reads the unchanged koi at 0.472 ≠ the concept's 0.481, falsely
tripping "regressed". Fix: the verdict gate now compares **GLB-after vs GLB-before** (apples-to-apples);
the E-13 concept IoU is reported as a cross-reference column only. Re-derived via `--offline` (all measured
numbers preserved — no metered re-run): koi→held, heart→improved. This is the *honest* picture and removed
a real false-alarm.

## Verification

- `npm test` green (validation + unit; 0 fail).
- `glb-formtarget-ab.md` table renders; verdicts now internally consistent (rollback ⇒ before==after ⇒
  held; accept + Δ>eps ⇒ improved).
- No edit to `loop.mjs` / `region.mjs` / `glb-silhouette.mjs` / `form-fidelity.mjs` — the seam invariant
  (AC #3) holds by construction.

## Remaining

- Commit (Step 4) + `review.md`.
</content>
