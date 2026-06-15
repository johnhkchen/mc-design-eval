# T-060-01 — Design: integrate-and-remeasure

Decisions with rationale + rejected alternatives, grounded in `research.md`. Shape: a **pure** assembler
`src/form/remeasure.mjs` (the 5-metric × 3-build record + deltas, unit-tested) and a GL/host runner
`benchmarks/sculpture/e18-remeasure.mjs` (build combined, render, collect, emit). No edits to the deps.

## Decision 1 — The combined build is `segmentMaterials` over a `voxelizeGlbThin` occupancy

**Chosen.** Per subject:
```
occThin  = voxelizeGlbThin(glb, { scale: 32 })          // thin members survive (T-059)
surface  = parseGlbColoredSurface(glb)
texture  = decodeTexture(surface.baseColor)             // injected dwebp edge
artifact = segmentMaterials({ occupancy: occThin, surface, texture })   // value-true colour + clean (T-058)
```
`segmentMaterials` already samples value-true surface colour and snaps to a tight fixed palette, so the
ticket's three middle stages (thin → value-true colour → segment) collapse into this one call. Verified
offline on koi (AJV-valid; speckle 0.17, distinct 6, off-palette 0, value ΔE 0, 1 component, +991 cells).

*Why.* It's the minimal correct composition — both fixes apply, nothing is reimplemented, and the
occupancy `thin` field rides along for the no-dropped-thin diagnostic. `voxelizeGlbThin`'s drop-in record
shape (research §1) makes the substitution a one-line change from the T-058 seg runner.

*Rejected.* (a) **A separate explicit colour pass then segment** — redundant; `segmentMaterials` samples
internally. (b) **`segmentMaterialsGlb(glb)`** — convenient but it calls `voxelizeGlb` (not thin); I need
the thin occupancy *and* a handle on it for speckle, so the runner composes the steps explicitly. (c)
**Add a `voxelize` injection option to `segmentMaterials`** — would edit a shipped dep for no gain; the
runner composing the two pure functions is cleaner and keeps deps read-only.

## Decision 2 — Metrics: reuse every existing function; compute, don't invent

**Chosen.** form IoU via the silhouette kernel (render PNG vs GLB mesh, `SCULPTURE_VIEW_3Q`); speckle via
`speckleScore`; distinct via `manifest.length`; off-palette via `offPaletteCount`; value ΔE via
`valueGate(realizedPaletteFromArtifact(art), refClusters)`. Two palettes per subject:
- `refClusters = extractTexturePalette(texture).snapPalette` (default k) — the **value-ΔE reference**,
  identical to the E-17 ablation so numbers are comparable.
- `segPalette = extractTexturePalette(texture, { k: SEG_DEFAULTS.k }).snapPalette` (k=6) — the
  **off-palette reference** (the build's own fixed palette), identical to the T-058 seg metric.

*Why.* AC #2 names exactly these five. Reusing the shipped functions guarantees the E18 numbers are on the
same scale as R1/R2 and the E-17 sweep. The two-palette split is intentional: off-palette measures
*discipline against the build's fixed palette*; value ΔE measures *value fidelity against the canonical
texture palette* — different questions, the same questions T-058 and E-17 asked.

*Rejected.* **One palette for both** — would either make off-palette meaningless (k=8 ref ≠ the k=6 build
palette) or break value-ΔE comparability with E-17.

## Decision 3 — Occupancy matching: score each build against its own voxelization

**Chosen.** Compute **two** occupancies per subject: `occThin` (for the E18 build + its speckle) and
`occBase = voxelizeGlb(glb)` (for R1/R2 baseline speckle). distinct/off-palette/value ΔE for the baselines
come from their committed artifacts; **speckle is recomputed** over `occBase` because `speckleScore` indexes
keys by `occupiedCells` order and the baselines were built non-thin.

*Why.* A correctness requirement (research §2): scoring R2's keys against the thin occupancy would
mis-pair cells and produce garbage. R1's `silhouetteIoU` and R2's `formIoUAfter` are read from summaries
(no re-render of baselines — they're committed).

*Rejected.* **Re-render R1/R2** — wasteful and risks drift from the committed rung records; read them.

## Decision 4 — A pure assembler `assembleRemeasure(rows, opts) → {md, json}`

**Chosen.** A new pure module `src/form/remeasure.mjs`. Input `rows`: per subject `{subject, e18, r1, r2,
thin}` where each build cell is `{formIoU, speckle, distinct, offPalette, valueDeltaE}` (any may be null).
It computes, per metric, the **E18 deltas vs R1 and vs R2** with the correct *direction* (IoU: higher
better; speckle/distinct/off-palette/value ΔE: lower better), flags regressions (zero/negative
improvement), and formats both a markdown table and a JSON record (`e18-remeasure/v1`). Unit-tested on
synthetic rows (AC #4: "pure assembly/metric logic unit-tested").

Metric directions, encoded once:
```
METRICS = [
  { key:"formIoU",     label:"form IoU",  better:"higher" },
  { key:"speckle",     label:"speckle",   better:"lower"  },
  { key:"distinct",    label:"distinct",  better:"lower"  },
  { key:"offPalette",  label:"off-pal",   better:"lower"  },
  { key:"valueDeltaE", label:"value ΔE",  better:"lower"  },
]
```
`improved(metric, a, b)` = `better==="higher" ? a>b : a<b`; null on either side → delta null, no verdict.

*Why.* The pure/GL split is the house pattern (`ablation.mjs`+test, `scorecard.mjs`+test). It makes AC #4
satisfiable in CI without GL, and makes "a fix that didn't help recorded honestly" (AC #3) a tested code
path (the regression flag), not a hope.

*Rejected.* (a) **Format inside the runner** — untestable in CI, repeats the anti-pattern the house style
avoids. (b) **Reuse `assembleAblation`** — it's rung-over-rung with 2 metrics (IoU, value ΔE); E-18 wants
5 metrics across 3 named builds with vs-R1/vs-R2 deltas. Different shape; a focused assembler is clearer
than overloading the ablation one.

## Decision 5 — Output layout mirrors the siblings

**Chosen.** `benchmarks/sculpture/e18-build/<subject>/{artifact.json, render-3q.png, summary.json}` (renders
gitignored, like every sibling sweep); roll-up `benchmarks/sculpture/e18-remeasure.{md,json}` (tracked).
`--offline` rebuilds the roll-up from the per-subject `summary.json`s. The json carries per-subject cells +
deltas + a `regressions` list + headline averages; the md is a per-subject table (R1→R2→E18 per metric)
with a deltas/notes column.

*Why.* AC #1 names `e18-build/<subject>/`; AC #2 names `e18-remeasure.{md,json}`. Matching the sibling
layout (per-subject dir + roll-up + `--offline`) keeps T-061-01's consolidation a pure read across all
E-18 records.

## Decision 6 — Honest reporting of the value-ΔE tautology and any non-improvement

**Chosen.** Record value ΔE for all three builds even though R2 and E18 are ~0 by construction (they snap
to the texture palette — memory `ablation-value-ΔE-tautology`). The assembler's regression flag will mark
the E18-vs-R2 value-ΔE delta as "no change" (Δ≈0); the md/json note that value ΔE is tautological for
palette-snapping builds and that **speckle/distinct/off-palette** carry the real discrimination. Any genuine
non-improvement on any subject/metric is surfaced in the `regressions` list, not hidden.

*Why.* AC #3 ("a subject where a fix didn't help … recorded honestly") and the project's honesty norm
(memory: report zero/negative results). The tautology is a known property, not a bug — naming it prevents a
future reader from over-reading a 0.

*Rejected.* **Drop value ΔE** — AC #2 requires it; dropping it would hide that the combined build holds R2's
value fidelity while fixing form (the thin cells sample real surface colour, so value ΔE stays ~0).

## Risks

- **Heavier thin builds** (≈2× cells on bow/koi) — render cost up; within budget, watched (T-059 #1).
- **form IoU could dip if thin cells add silhouette the GLB lacks** — measured, reported honestly; the
  expectation (from T-059) is a *rise* on thin subjects and parity on thick ones.
- **A subject's GLB/texture missing** → null cells with a note (no hard fail), per the sweep convention.
