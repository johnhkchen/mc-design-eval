# T-063-01 — Design: stray-voxel pruning

Three decisions: (1) the shape and threshold policy of `pruneStrays`; (2) where it is wired into the build and
how before/after is recorded; (3) the AC-#4 palette change, given the bug is already mitigated. Grounded in
Research — especially the measured moai component ratios (1.000 / 0.496 / 0.430).

---

## Decision 1 — `pruneStrays`: keep largest + any component ≥ a relative floor

### The shape

```
pruneStrays(occupancy, { connectivity = 6, minFraction = 0.5, minCells = 0 }) → occupancy
```

A **pure geometric transform**: same record shape in, a shrunk occupancy out. Lives in
`src/form/voxel-components.mjs` beside `componentLabels`/`strayVoxelStats` — it is connectivity-over-occupancy,
the same family, and reuses the existing flood-fill core (no 4th DFS, per the house rule).

Algorithm:
1. `componentLabels(occupancy,{connectivity})` → `{labels, sizes}`.
2. `largest` = argmax `sizes` (ties → lowest label index, matching `strayVoxelStats`). `largestCount`.
3. `floor = max(minCells, minFraction * largestCount)`.
4. Keep label `l` ⇔ `l === largest || sizes[l] >= floor` (**inclusive** at the boundary).
5. Filter `occupied` to kept labels, preserving `occupiedCells` order; rebuild `Int32Array` + `count`.
6. Return `{...occupancy, occupied, count}` with the stale `thin` field **deleted** (its component count no
   longer describes the pruned grid). `dims`/`bounds`/`voxelSize`/`scale` pass through untouched.

Empty / single-component occupancy → returned unchanged (no-op). Determinism: `componentLabels` is
deterministic and the filter preserves order, so output is byte-stable.

### Why a *relative* floor (the load-bearing choice)

The measured reality forces it. moai's spurious masses are **0.496×** and **0.430×** the principal mass — they
are *large*. An absolute "drop islands < N cells" floor cannot remove them without also removing legitimate
small parts. A floor expressed as a **fraction of the largest component** is the only size-based rule that:

- drops moai's 0.496/0.430 masses at `minFraction = 0.5` → after pruning, total = 3147, **largest-frac → 1.0**,
  stray → 0 (AC #3 headline), and
- keeps "two large legitimate parts" (each near the largest, ratio ≥ 0.5) — AC #2, and
- drops a "tiny floating island" (ratio ≈ 0.01 ≪ 0.5) — AC #2, and
- has a crisp **boundary case**: a component of size exactly `0.5 × largest` is kept (inclusive `>=`); one cell
  smaller is dropped — AC #2's "size-floor boundary case behaves as specified".

`minCells` is retained as a secondary absolute floor (default 0, i.e. inactive) so a caller can additionally
require a minimum cell count; it does not affect the committed 7 but makes the knob honest and future-proof.

### Why `minFraction = 0.5` and the thin-margin caveat

0.5 is a clean Schelling point that sits **above moai's 0.496** (strictly: `0.496 < 0.5` → dropped) and below
any equal-halves legitimate split (ratio 1.0). The margin to moai (0.004) is **thin but deterministic** for the
committed GLBs — flagged as a known limitation. It is a *parameter*, not a constant baked into logic: a future
subject with genuinely separate comparable parts can raise it, and one with large legitimate secondaries can
lower it. Since **moai is the only multi-component subject** in the committed 7, the threshold acts on exactly
one build and is fully observable.

### Rejected alternatives

- **Keep only the single largest component (drop everything else).** Rejected — violates AC #1/#2 ("keep …
  plus any ≥ a size floor … so a legitimately separate part — an arrow — is kept"). It would also be wrong for
  any future multi-part subject. The floor *is* the requested behaviour.
- **Absolute cell floor only (`minCells`).** Rejected as the primary rule — cannot drop moai's half-sized
  duplicate masses without nuking legitimate small parts (Research §the-problem).
- **Shape/spatial heuristics (drop thin connectors, drop off-axis masses).** Rejected — fragile, and edges
  toward the segmentation the user vetoed (no SAM, stay geometric). Size-relative is the simplest rule that
  satisfies every AC.
- **Bounding-box-overlap or distance-from-centroid pruning.** Rejected — moai's duplicates overlap the
  principal mass's bbox; distance heuristics need tuning per subject. Component size is parameter-light.

---

## Decision 2 — Wiring + before/after recording in `e18-remeasure.mjs`

Prune **between** `voxelizeGlbThin` and `segmentMaterials` in `buildSubject`:

```
const occThin   = voxelizeGlbThin(glbBytes, { scale });
const occPruned = pruneStrays(occThin);                 // NEW — geometric, ×7
const strayBefore = strayVoxelStats(occThin);
const strayAfter  = strayVoxelStats(occPruned);
… segmentMaterials({ occupancy: occPruned, surface, texture }, …)
… speckleScore(occPruned, eKeys)    // keys length now === occPruned.count
… judgeIoU(render of the pruned build)
```

- **Applied ×7, no-op for 6.** Only moai loses cells; the other six are single-component so `pruneStrays`
  returns an equal-count occupancy. "Applied to the build path, ×7" (AC #3) without disturbing clean subjects.
- **Surface sampling stays correct** because it is nearest-vertex by *coordinate* (Research) — removing cells
  cannot mis-map the survivors.
- **before/after** (AC #5): both `strayVoxelStats` results go into the per-subject `summary.json` as
  `stray:{before, after}` and into the console line. moai: `before {comp 3, frac 0.519, stray 2912}` →
  `after {comp 1, frac 1.0, stray 0}`; the other six: before == after (already clean).
- **`thin.components` diagnostic** in the summary is read from `occThin` **before** pruning (so the "thin pass
  produced N components" story is preserved); the post-prune state is the new `stray.after`.
- The `occBase.count → occThin.count` note in the style rationale is extended to
  `occBase → occThin → occPruned` so the artifact self-documents the pruning step.

Why here and not in `voxelizeGlbThin`: voxelization is *geometry capture*; pruning is a *cleanup policy* with a
tunable threshold. Keeping them separate preserves the thin diagnostic (raw component count) and lets other
callers voxelize without an opinion about strays. The combined runner is the one place the ×7 builds are
produced and form IoU is judged, so it is the correct wiring site.

---

## Decision 3 — AC #4: pass `aug`, drop the redundant `augment:true`

Research established the secondary blocks are **already placed** (moai 5 distinct, heart 7) via the internal
`augment:true`; the "never placed" premise is stale. The honest, still-worthwhile change:

```
-   { palette: prim, augment: true, … }
+   { palette: aug,                 … }     // aug = augmentPalette(prim, texture), already computed above
```

Rationale — **single source of truth**: the runner already computes `aug` for `assertPaletteDiscipline` and
`offPaletteCount`. Passing that same object as the snap-candidate set makes the *built* palette identical to the
*checked* palette by construction, instead of relying on `segmentMaterials` re-deriving an equal set
internally. The two are equal **today** (`augmentPalette(prim,texture)` ≡ `augmentPalette(prim,texture,
undefined,{})`), so manifests are expected **byte-identical** — this is a correctness/clarity hardening, not a
behaviour change. **Verification:** diff each subject's manifest before/after the edit; assert moai still has 5
distinct, heart 7, and `assertPaletteDiscipline` still passes. The progress/review will report the *true* prior
state (already placed), not a fictional fix.

Risk guarded: passing `palette: aug` **with** `augment: true` would *double-augment* (augment the already-
augmented set), possibly exceeding the K=2 cap → tripping the discipline guard. Hence `augment:true` is
**removed**, not kept.

---

## Summary of files

- **edit** `src/form/voxel-components.mjs` — add `pruneStrays` (reuses `componentLabels`).
- **edit** `src/form/voxel-components.test.mjs` — `pruneStrays` AC cases (tiny island, two large parts,
  boundary, moai-like half-masses, no-op single component, empty).
- **edit** `benchmarks/sculpture/e18-remeasure.mjs` — wire `pruneStrays`; record `stray:{before,after}`;
  AC-#4 palette change; extend rationale + console line.
- **regenerated (live, if GL available)** `e18-build/<subj>/{artifact.json,summary.json,render-3q.png}` and
  `e18-remeasure.{md,json}` — moai now `frac 1.0 / stray 0`, form IoU recorded.
