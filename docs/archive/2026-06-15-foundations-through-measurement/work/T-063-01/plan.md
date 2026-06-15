# T-063-01 — Plan: ordered steps

Three commits, each independently verifiable. Pure core first (fast, offline, definitely runnable), then the
runner wiring, then the live data regeneration. Maps 1:1 to structure.md §ordering.

---

## Step 1 — `pruneStrays` + unit tests  (commit 1)

**Files:** `src/form/voxel-components.mjs`, `src/form/voxel-components.test.mjs`.

1. Add `pruneStrays(occupancy, {connectivity=6, minFraction=0.5, minCells=0})` after `strayVoxelStats`,
   reusing `componentLabels` + `occupiedCells` (no new imports, no 4th flood fill). Delete the stale `thin`
   field on the returned occupancy; pass `dims/bounds/voxelSize/scale` through.
2. Update the module header's one-liner: the module now also *prunes* occupancy, not only measures it.
3. Add the `pruneStrays` test section (structure.md §2 cases): tiny island, two large parts, moai-like
   half-mass dropped, inclusive boundary (4-cell kept / 3-cell dropped at floor=4), `minFraction` knob,
   no-op single mass, empty, **order-preserved**.

**Verify:** `npm test` green (target ≥ 617 + new cases, no regressions). The boundary + half-mass cases
directly exercise AC #1/#2. PURE — runs anywhere, no GL.

**Commit:** `feat(E-19 T-063-01): pruneStrays — keep largest + parts ≥ relative floor; drop TRELLIS strays`.

## Step 2 — wire into the build path + AC-#4 palette change  (commit 2)

**File:** `benchmarks/sculpture/e18-remeasure.mjs`.

1. Add `import { pruneStrays, strayVoxelStats } from "../../src/form/voxel-components.mjs";`.
2. In `buildSubject`: `occPruned = pruneStrays(occThin)`; `strayBefore/strayAfter = strayVoxelStats(...)`.
3. `segmentMaterials` now takes `occupancy: occPruned`, `palette: aug` (drop `augment: true`); extend the
   rationale cell-count note to `occBase→occThin→occPruned`.
4. `speckleScore(occPruned, eKeys)`; add `stray:{before,after}` to the row; extend the console line.

**Verify (no GL needed):**
- `node --check benchmarks/sculpture/e18-remeasure.mjs` (parse) and a dry `import()` of `{buildSubject}` to
  confirm the module loads.
- A **focused offline harness** (one-off `node -e`, not committed): for moai + one clean subject, run
  `voxelizeGlbThin` → `pruneStrays` → `segmentMaterials({occupancy: occPruned,…, palette: aug})` with a stub
  `decodeTexture` is **not** possible offline (needs the real texture/dwebp) — so instead verify the
  **geometry** offline: `pruneStrays(occThin)` for all 7, assert moai `strayAfter.strayCount === 0 &&
  largestFraction === 1` and the other six `before == after`. This proves AC #1/#3-geometry/#5 without GL.
- AC #4 byte-equivalence: build moai's & heart's artifacts the *old* way (`palette: prim, augment: true`) and
  the *new* way (`palette: aug`) against the same decoded texture **if** a decoder is available; assert
  identical manifests (moai 5, heart 7). If no decoder offline, defer this to Step 3's live run and assert on
  the regenerated manifests.

**Commit:** `fix(E-19 T-063-01): apply pruneStrays in combined build; pass augmented palette (AC #4)`.

## Step 3 — live regeneration + data  (commit 3)

**Command:** `node benchmarks/sculpture/e18-remeasure.mjs` (needs GL host + `dwebp`).

1. Regenerate `e18-build/<subj>/{artifact.json,summary.json,render-3q.png}` ×7 and
   `e18-remeasure.{md,json}`.
2. Re-run `node benchmarks/sculpture/cleanliness-baseline.mjs` so the committed baseline's **E18 column now
   reflects the pruned build** — i.e. the *after* (the before is preserved in git history at commit e42882f).
   *Decision:* keep cleanliness-baseline as the live re-score of committed builds; the before/after delta is
   read from git + the new numbers. (Alternatively leave baseline as the frozen "before" and rely on the
   summary.json `stray` block for after — pick whichever keeps the AC-#5 "before/after per subject" clearest;
   default: refresh baseline + cite the before from this plan/research table.)

**Verify (AC #3 headline):**
- moai `summary.json`: `stray.before {comp 3, frac 0.519, stray 2912}` → `stray.after {comp 1, frac 1.0,
  stray 0}`; `e18.formIoU` **higher** than the committed 0.565 (record the exact value).
- moai render: a single statue, no duplicate masses or connecting bars (eyeball the PNG).
- other six: `artifact.json` unchanged vs prior commit (git diff empty for placements), `stray.before ==
  stray.after`.
- AC #4: moai manifest 5 distinct (1 secondary), heart 7 (2 secondary); `assertPaletteDiscipline` passed
  (the runner asserts it — a non-zero exit would fail the run).
- `npm test` still green.

**Commit:** `data(E-19 T-063-01): regenerate e18-build with stray pruning; moai frac 0.52→1.0, IoU rise`.

## Testing strategy summary

| AC | how verified | offline? |
|---|---|---|
| #1 `pruneStrays` keep-largest + floor | unit tests (boundary, half-mass) | ✅ |
| #2 island removed / two parts kept / boundary | unit tests | ✅ |
| #3 wired ×7; moai frac≈1, stray→0; IoU recorded | offline geometry (frac/stray) + live render (IoU) | geometry ✅, IoU needs GL |
| #4 augmented palette placed (manifest) | manifest inspection (moai 5 / heart 7) | needs a decoded texture (live) |
| #5 stray before/after per subject; `npm test` green | summary.json `stray` block + node:test | ✅ |

## Fallback if the GL host is unavailable

Steps 1–2 (commits 1–2) land regardless — they are the substance (the pure metric + the wiring). For Step 3,
if rendering fails, commit the **offline geometric before/after** (a small committed `node -e`-derived note or
a `--geometry-only` path) proving moai → frac 1.0 / stray 0 for all 7, and record the form-IoU rise as
*pending a live render*, with the geometric evidence standing in. The progress/review will state plainly which
parts ran live vs. offline — no claimed render that did not happen.

## Risks & mitigations

- **Thin margin to moai's 0.496** — deterministic for committed GLBs; documented; threshold is a parameter.
- **AC-#4 "bug" already mitigated** — change is behaviour-preserving (single-source-of-truth); verified by
  manifest equality, reported honestly as a hardening, not a fictional fix.
- **Pruning breaks occupiedCells-order join** — guarded by the order-preserved unit test + the fact that
  surface sampling is coordinate-based.
- **Long live sweep** — run in background; the geometric ACs do not depend on it.
