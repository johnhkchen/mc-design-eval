# T-063-01 — Progress

Status: **implementation complete**, all three planned commits landed, `npm test` green (636). One material
deviation from the plan's *hypothesis* (moai form IoU fell, not rose) — documented below and in review.md.

---

## Commits

1. `feat(E-19 T-063-01): pruneStrays — keep largest + parts ≥ relative floor` — the pure metric + 10 tests +
   RDSPI research/design/structure/plan artifacts.
2. `fix(E-19 T-063-01): apply pruneStrays in combined build; pass augmented palette` — runner wiring + AC #4.
3. `data(E-19 T-063-01): regenerate e18-build with stray pruning` — live ×7 sweep outputs.

## Step 1 — `pruneStrays` + tests ✅

- `src/form/voxel-components.mjs`: added `pruneStrays(occupancy, {connectivity=6, minFraction=0.5,
  minCells=0})`. Keeps the largest component + any component ≥ `max(minCells, minFraction×largest)` (inclusive).
  Reuses `componentLabels` (no 4th flood fill); pure, deterministic, order-preserving; drops the stale `thin`
  field; no-op on empty/single-component.
- `src/form/voxel-components.test.mjs`: +10 tests — tiny island removed, two large parts kept, moai-like
  half-mass dropped, inclusive boundary (4-cell kept / 3-cell dropped at floor 4), `minFraction` knob,
  `minCells` knob, no-op single mass, empty, **order-preserved**, thin-field dropped. All pass.

## Step 2 — wiring + AC #4 ✅

`benchmarks/sculpture/e18-remeasure.mjs`:
- Import `pruneStrays, strayVoxelStats`.
- `buildSubject`: `occPruned = pruneStrays(occThin)`; `strayBefore/strayAfter` recorded; `segmentMaterials`
  now takes `occupancy: occPruned`; speckle scored on `occPruned`.
- **AC #4:** `palette: prim, augment: true` → `palette: aug` (the already-computed augmented set). Verified
  with the real decoded texture (offline, pre-render) that old vs new manifests are **byte-identical** — the
  change is behaviour-preserving and removes a snap-set/guard-set divergence risk (single source of truth).
- Summary gains `thin.occPruned` + a `stray:{before,after}` block; console line shows `stray N→M (frac …→…)`.

## Step 3 — live regeneration ✅ (with a deviation)

`node benchmarks/sculpture/e18-remeasure.mjs` (GL + dwebp both present) regenerated all 7. Results:

| subject | stray before→after | frac before→after | comp | E18 IoU old→new | distinct old→new |
|---|--:|--:|--:|--:|--:|
| dancing-man | 0→0 | 1→1 | 1 | 0.814→0.814 | 5→5 |
| **moai** | **2912→0** | **0.519→1.0** | **3→1** | **0.593→0.399 ↓** | 5→4 |
| pineapple | 0→0 | 1→1 | 1 | 0.845→0.845 | 4→4 |
| bow-and-arrow | 0→0 | 1→1 | 1 | 0.526→0.526 | 6→6 |
| heart | 0→0 | 1→1 | 1 | 0.895→0.895 | 7→7 |
| mushroom | 0→0 | 1→1 | 1 | 0.929→0.929 | 6→6 |
| koi | 0→0 | 1→1 | 1 | 0.706→0.706 | 5→5 |

The six clean subjects are **exact no-ops**: placements byte-identical (confirmed by diffing the placements
arrays vs the prior commit), IoU unchanged. Only the `style.rationale` string and the new `stray` block differ.

### Deviation: moai form IoU FELL (0.593 → 0.399), the opposite of the AC's hypothesis

The geometric headline is met (frac 0.519→1.0, stray 2912→0, 3→1 components). But `judgeIoU` measures the
build's render silhouette against the **GLB's own** silhouette, and the moai GLB *is* the 3-view hallucination
(three statues + bridging bars). Pruning the build to its largest component makes it cover **less** of that
corrupted reference → IoU drops. The drop is a property of the **reference**, not a build-quality regression.
Inspecting the new render confirms the kept largest component is itself a tangle of partial statues joined by
the bars that remained 6-connected — geometric pruning removes the two fully-detached masses but cannot
reconstruct a clean single statue from a hallucinated mesh. The real moai fix is **upstream** (regenerate the
GLB from a single-view concept). Reported in review.md as the critical open concern.

## AC checklist

- [x] **#1** `pruneStrays` — connected-component (face-adjacency), keep largest + ≥ size floor, deterministic,
  pure, GL-free.
- [x] **#2** unit-tested: island removed / two parts kept / boundary (inclusive) — all green.
- [x] **#3** wired ×7; moai largest-frac ≈ 1 (=1.0), stray → 0; **form IoU recorded** (0.399). The
  parenthetical "expected to rise" did **not** hold — see deviation.
- [x] **#4** combined build passes `aug`; gated secondary placed where warranted (heart 2 secondary; moai 0
  after pruning — its secondary lived on a removed duplicate mass); discipline guard passes.
- [x] **#5** stray before/after per subject in each `summary.json`; `npm test` green (636).

## Not done / deferred (by design)

- `cleanliness-baseline.{md,json}` left **frozen** as the T-062-01 "before" snapshot (the after is in each
  `summary.json` `stray` block). Re-running it would now show the pruned numbers; intentionally not done to
  preserve the before deliverable.
- `assembleRemeasure` roll-up not extended with stray columns (per-subject `summary.json` is the AC-#5 record).
