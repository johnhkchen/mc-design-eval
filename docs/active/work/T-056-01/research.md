# T-056-01 — Research (ablation-sweep, E-17 rung R3 + the data spine)

Descriptive map of what exists for the E-17 consolidation sweep. Two jobs in this ticket: (1) **add R3**
— the E-15 surgical loop run on the R2 cleaned builds across all 7 subjects; (2) **collect all metrics**
R0–R3 into one structured record `benchmarks/sculpture/sweep-ablation.{md,json}`.

## The ladder, as it stands on disk

```
R0  text→JSON        runs/00[2-9]-*/artifact.json                 (exists — E-13 builds, all 8 incl. sword)
R1  glb-voxel        benchmarks/sculpture/glb-voxel/<subj>/        (exists — T-054-01, 7 subjects)
R2  + material-clean benchmarks/sculpture/glb-voxel-clean/<subj>/  (exists — T-055-01, 7 subjects)
R3  + surgical       THIS ticket                                   (does not exist yet)
```

The 7-subject set is the single source of truth `SUBJECTS` in `glb-voxel-breadth.mjs` (R1 runner),
already imported by the R2 runner (`glb-voxel-clean.mjs`) — sword is excluded (TRELLIS 500'd on the thin
blade). Each subject row carries `{ key, glb, run }`: `key` = output-dir/table name, `glb` = file under
`glb/`, `run` = the R0 concept-image dir under `runs/`.

All 7 GLBs are present on disk (`glb/*.glb`, gitignored), `dwebp` is on PATH, the headless render stack
(`render/src/render-tool.mjs`) works (smoke-rendered koi R2 @ 3/4 → 2164 placed). So a **live** sweep is
runnable here.

## R3 — the surgical rung

The surgical machinery is fully built and already proven on koi+heart at R1 by `glb-voxel-surgical.mjs`
(the E-16 synthesis, T-052-01). The pieces:

- `reviseLoop(artifact, opts)` (`src/revise/loop.mjs`) — the deterministic cage. Walks a caller-supplied
  region list once; per region: select → (observe) → diagnose → scoped procedural tweak → re-score →
  **accept-if-strictly-improved else roll back** → lock. Terminates in ≤ regions×perRegion attempts. The
  **only seam this ticket touches is `score`**; `diagnose`/`tweakFor` default to the model-free procedural
  path (`proceduralDiagnose`/`scopedTweakFor`), so R3 needs **no LLM** (no `claude -p` metering).
- `glbFormTarget({ glbPath, buildBounds })` (`src/form/form-target.mjs`) — the form target. `scoreRender`
  = true per-region IoU (R mapped into mesh space when `buildBounds` given); `wholeObjectScore` = whole
  silhouette IoU. Consumed via `liveFormScore({ formTarget })` — the loop body is unchanged.
- `artifactBounds`, `selectRegion`, `subBoundsOf`, `applyRegionEdit` (`src/revise/region.mjs`) — region
  addressing; `selectRegion` accepts `{ bbox }` specs.
- P14-safety: the existing surgical runner has a local **pure** `p14Report(out)` that confirms (from the
  loop's own `locked`+`trace`) that accepted regions lock and no edit touched an already-locked region.
- `formVerdictOf(before, after, accepted)` (`glb-formtarget-ab.mjs`) — categorical `improved|held|
  regressed|unknown` (GLB-after vs GLB-before, eps 1e-3).

**Key difference from the existing surgical runner:** it runs on **R1** inputs (`glb-voxel/`) with
hand-curated per-subject regions, only koi+heart. R3 here must run on **R2** inputs (`glb-voxel-clean/`)
across **all 7** subjects — so regions must be **auto-derived** from each artifact's bounds (no curated
defect list for 7 subjects), and routing left to the default procedural diagnose.

**Expected result is a near-null, and that is the finding.** The E-16 synthesis already showed that on the
already-close GLB-voxel builds, local single-view tweaks mostly roll back (the cage holds). R2 only
re-colors (occupancy unchanged from R1), so the R3 start is just as close. AC explicitly requires
zero/negative Δ rungs be **recorded honestly, not dropped**.

## The metrics — same three at every rung

1. **form IoU vs the GLB** — `src/form/glb-silhouette.mjs` (`loadMeshFromGlb`, `rasterizeSilhouette`) +
   `src/form/form-fidelity.mjs` (`extractSilhouette`, `normalizeSilhouette`, `iou`, `RENDER_BG`) at
   `SCULPTURE_VIEW_3Q`. Already computed and committed for R1 (`summary.json.silhouetteIoU`) and R2
   (`summary.json.formIoUAfter`). R3 produces `wholeObjectIoUAfter`. **R0 has no GLB-IoU on disk** — it
   must be rendered + judged here (text→JSON coords differ from the GLB, but `normalizeSilhouette` removes
   translation + uniform scale, so it is comparable; R0 is expected low — the honest baseline).

2. **value ΔE** (palette cleanliness) — `src/color/value-gate.mjs`. `realizedPaletteFromArtifact(artifact)`
   gives the build's placed manifest at value-true Lab, count-weighted (the segmentation-free render proxy,
   T-039 table invariant). `valueGate(realized, reference)` → `meanDeltaE`. The **reference** is the GLB's
   own canonical material palette: `extractTexturePalette(decodedTexture).snapPalette` (`material-clean.mjs`,
   the E-10 CIE-Lab extractor) — `[{ key, lab }]`, which `toReferenceClusters` accepts directly. Same
   reference for all 4 rungs of a subject → measures "how far is the realized palette from the GLB's true
   material values." R0 (arbitrary model palette) high; R2 (snapped to that palette) lowest; R3 ≈ R2.

3. **judge categorical (verdict)** — `formVerdictOf` applied rung-over-rung on form IoU (`improved|held|
   regressed`), with R0 = `baseline`. This doubles as the sign of the **marginal Δ** the AC asks for.

## Boundaries & constraints

- **Test glob is `src/**/*.test.mjs`** (`package.json`). Pure metric-collection logic must live in `src/`
  to be exercised by `npm test`; the benchmark runners (`benchmarks/**`) are GL/host-metered and are NOT in
  the glob — same split as every prior rung.
- Decoding a GLB baseColor texture needs `dwebp` (WebP→PNG host tool) — the established impure edge, kept
  local to runners (`decodeTexture`), injected into pure cores. Never in CI.
- Artifacts validated by `assertArtifact` (AJV); `style` is `additionalProperties:false` (the
  T-055-01 `paletteDescription` trap — keep provenance in summaries, not on the artifact).
- Determinism: every prior rung ships `--offline` to rebuild `r{n}.{md,json}` from committed per-subject
  summaries with no GL/network. R3 + the collector must follow that contract.
- `.gitignore` already excludes `glb/*.glb`, `glb-voxel/**/render-3q.png`, `glb-voxel-surgical/**/*.png`.
  New PNG-emitting dirs (R3 sweep, R0 ablation renders) need matching entries.

## Lessons in scope (memory)

- `[[parallel-roots-duplicate-shared-deps]]` — reuse `SUBJECTS`, `glbFormTarget`, `reviseLoop`,
  `formVerdictOf`, `valueGate`; do not re-implement.
- `[[per-region-vs-whole-object-iou-diverge]]` — R3's per-region accept-gate ≠ whole-object verdict; a kept
  local clean can lower whole IoU. `regressed` is a real possible outcome, not a bug.
- `[[form-revision-needs-3d-target]]` — surgical edits hill-climb poorly against a single-view silhouette;
  the near-null R3 result is expected and must be reported, not hidden.
