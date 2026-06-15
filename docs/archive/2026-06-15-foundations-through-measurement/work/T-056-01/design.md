# T-056-01 — Design (ablation-sweep)

Decisions for adding R3 and collecting the R0–R3 data spine. Grounded in research.md.

## D1 — R3: a NEW runner, not an extension of `glb-voxel-surgical.mjs`

**Decision:** add `benchmarks/sculpture/glb-voxel-surgical-sweep.mjs` (rung R3). Leave the E-16 synthesis
runner (`glb-voxel-surgical.mjs`, koi+heart on R1) untouched.

- *Considered:* parametrize the existing runner (input dir, subject list, region source). *Rejected:* it
  is the durable record of a different result (E-16 synthesis, T-052-01, with curated defect regions and
  the LLM `curve` route); generalizing it would entangle two findings and risk its committed AC. Every
  rung in E-17 has its own runner (`glb-voxel-breadth`=R1, `glb-voxel-clean`=R2). R3 follows the pattern.
- The new runner **reuses** `reviseLoop`, `glbFormTarget`, `liveFormScore`, `formVerdictOf`, region
  helpers, and `SUBJECTS` — no re-implementation (`[[parallel-roots-duplicate-shared-deps]]`).

## D2 — R3 regions: auto-derived horizontal slabs, default procedural diagnose

**Decision:** for each subject, derive regions from `artifactBounds(artifact)` by splitting the Y extent
into N=3 slabs spanning full X,Z (`autoRegions`, a **pure** helper). Pass them to `reviseLoop` with the
**default** `diagnose`/`tweakFor` (model-free `proceduralDiagnose`/`scopedTweakFor`); inject only
`score: liveFormScore({ formTarget: glbFormTarget({ glbPath, buildBounds }) })`.

- *Considered:* curated per-subject defect regions like the synthesis runner. *Rejected:* does not scale to
  7 subjects and would be hand-tuned guesses; the AC wants the generic E-15 loop applied uniformly.
- *Considered:* the LLM `curve` route. *Rejected:* metering cost ×7×regions for an expected-null result;
  the AC says "the E-15 `reviseLoop` … with `formTarget: glbFormTarget`", which the default procedural path
  satisfies. R3 stays GL-only (no `claude -p`).
- N=3 vertical slabs guarantee each region has mass (full XZ cross-section) and keeps the loop bounded
  (≤ 3×perRegion attempts/subject). `perRegion: 2`, `maxIterations: 12`.

## D3 — value ΔE reference: the GLB's own texture palette, identical across rungs

**Decision:** `valueDeltaE = valueGate(realizedPaletteFromArtifact(artifact), refClusters).meanDeltaE`,
where `refClusters = extractTexturePalette(decodeTexture(surface.baseColor)).snapPalette` — the GLB's
canonical material palette, computed **once per subject** and used for all four rungs.

- This makes ΔE mean one consistent thing across the ladder: distance from the realized blocks to the
  GLB's true material values (palette cleanliness). R0's arbitrary model palette scores high; R2's snapped
  palette scores lowest; R1 in between; R3 ≈ R2.
- *Considered:* the concept image as reference (the original E-14 use of the gate). *Rejected:* the concept
  is a flat 2-D preview, not the material ground truth the rest of E-17 measures against; mixing targets
  would make the column incomparable to formIoU's GLB target.
- *Considered:* speckle / distinct-block count (R2's own metric). *Rejected:* the AC names
  `value-gate.mjs` specifically; speckle is already in the R2 record. ΔE is the value-true cleanliness
  number, complementary to speckle.
- **Robustness:** `realizedPaletteFromArtifact` → `resolveValueTruePalette` can throw on a block missing
  from the value-true table (possible for an old R0 artifact). The collector catches per (subject,rung) and
  records `valueDeltaE: null` with a note rather than aborting the sweep.

## D4 — formIoU sourcing: read committed summaries for R1–R3, render R0 fresh

**Decision:** the collector reads `silhouetteIoU` (R1), `formIoUAfter` (R2), `wholeObjectIoUAfter` (R3)
from the committed per-rung `summary.json`s — no re-render. **R0 alone** has no GLB-IoU on disk, so the
collector renders each R0 artifact @ `SCULPTURE_VIEW_3Q` and judges IoU vs the GLB (`judgeIoU`, the same
kernel R1/R2 use). One render ×7, recorded into the collector's own per-subject summary so `--offline`
can rebuild the table without GL.

- *Considered:* re-render every rung for uniformity. *Rejected:* wasteful and risks drift from the
  committed rung numbers that the scorecard (T-057-01) and surgical harness already depend on. Reuse the
  numbers each rung already published; only fill the one true gap (R0).

## D5 — verdict + marginal Δ: rung-over-rung on formIoU

**Decision:** per (subject, rung) `verdict` = `formVerdictOf(prevRungIoU, thisRungIoU, accepted=true)`,
with R0 = `"baseline"`. The **marginal Δ** is numeric: `dFormIoU = IoU[Ri] − IoU[Ri−1]` and
`dValueDeltaE = ΔE[Ri] − ΔE[Ri−1]` (negative dValueDeltaE = cleaner). Both live in the structured record.

- The verdict gives the categorical read ("what did this rung buy?"); the signed deltas give the
  magnitude. Form is the primary axis for the verdict (it is the headline metric); value cleanliness is
  read off `dValueDeltaE`. The md surfaces both so a zero/negative rung is visible, not dropped (AC).
- `accepted=true` is passed because at the ablation scale a *rung* that raised IoU is by definition an
  accepted improvement; the gate-vs-verdict subtlety (`[[per-region-vs-whole-object-iou-diverge]]`) lives
  inside R3's own per-region trace, not the rung-level table.

## D6 — pure/impure split and the test surface

**Decision:** the genuinely reusable, GL-free logic goes in `src/form/ablation.mjs` and is unit-tested
(`src/form/ablation.test.mjs`, picked up by the `src/**/*.test.mjs` glob → `npm test`):

- `autoRegions(bounds, { slabs })` — pure region derivation (D2).
- `RUNGS` / rung metadata — the canonical ladder labels.
- `rungVerdict(prevIoU, curIoU)` — the pure categorical (D5), R0→`baseline`.
- `assembleAblation(rows)` — the **metric-collection logic**: group flat `{subject,rung,formIoU,
  valueDeltaE}` rows into the `subject × rung` structured record, compute verdict + marginal deltas, and
  render the markdown table. Tolerant of null/missing cells.

The two runners (`glb-voxel-surgical-sweep.mjs`, `sweep-ablation.mjs`) own all GL/host glue (render, judge,
`dwebp` decode, `reviseLoop` wiring) and call the pure core. P14 confirmation in the R3 runner reuses the
pure `p14Report` shape (small, kept local to the runner — it depends on `boxesIntersect` only).

## D7 — outputs, determinism, gitignore

- R3 runner writes `glb-voxel-surgical-sweep/<subj>/{artifact.json, before.png, after.png, summary.json}`
  and `glb-voxel-surgical-sweep/r3.{md,json}`; `--offline` rebuilds `r3.*` from summaries.
- Collector writes `sweep-ablation/<subj>/ablation.json` (per-subject cells incl. the fresh R0 IoU) and
  the top-level `benchmarks/sculpture/sweep-ablation.{md,json}`; `--offline` rebuilds from the per-subject
  files. The revised-artifact `artifact.json` R3 writes is what the collector reads for R3's `valueDeltaE`.
- `.gitignore` gains `glb-voxel-surgical-sweep/**/*.png` and `sweep-ablation/**/*.png`. The `.json/.md`
  records are the durable, committed output.
