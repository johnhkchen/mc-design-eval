# T-060-01 — Review (handoff)

**Integrate-and-remeasure** — E-18's two fixes combined into one glb-voxel build and re-measured across the
7 subjects vs the E-17 R1/R2 baselines, so T-061's consolidation is a pure read. The combined build is
`voxelizeGlbThin → segmentMaterials`. Headline: the speckle/palette directives hold on all 7; form IoU is a
**routed tradeoff** (up on thin forms, down on solid) — the key finding for T-061.

## Files

| File | Action | Notes |
| ---- | ------ | ----- |
| `src/form/remeasure.mjs` | **created** | pure assembler (rows → md/json + direction-aware deltas) |
| `src/form/remeasure.test.mjs` | **created** | 9 GL-free unit tests |
| `benchmarks/sculpture/e18-remeasure.mjs` | **created** | GL/host combined-build + collect runner (not in CI) |
| `benchmarks/sculpture/e18-build/<subject>/{artifact,summary}.json` | **generated** | 7 subjects, tracked |
| `benchmarks/sculpture/e18-remeasure.{md,json}` | **generated** | the roll-up, tracked |
| `benchmarks/sculpture/e18-build/<subject>/render-3q.png` | **generated** | gitignored (repo convention) |
| `.gitignore` | **modified** | one stanza: ignore `e18-build/**/render-3q.png` |

**No dependency modified.** `voxelizeGlbThin` (`glb-thin.mjs`, T-059) and `segmentMaterials`
(`material-segment.mjs`, T-058) are consumed read-only, as are the R1/R2 baselines. Commits: `6c1a4cf`
(assembler + tests), then the runner + sweep + gitignore + a corrected tautology note (bundled by Lisa's
commit lock under a neighbouring message — content verified in HEAD).

## What the integration does

Per subject: `occThin = voxelizeGlbThin(glb,{scale:32})` (thin members survive) and `occBase =
voxelizeGlb(glb,{scale:32})` (for baseline speckle); `artifact = segmentMaterials({occupancy: occThin,
surface, texture})` (value-true colour + tight-palette region segmentation). Five metrics for E18, R1, R2:
form IoU (render vs GLB silhouette), speckle (`speckleScore` over the matching occupancy), distinct
(`manifest.length`), off-palette (`offPaletteCount` vs the k=6 build palette), value ΔE
(`valueGate(realizedPaletteFromArtifact, refClusters)` vs the k=8 texture palette, E-17 parity). The pure
`assembleRemeasure` turns the rows into the `{md, json}` record with vs-R1/vs-R2 deltas and an honest
regressions list.

## Results (scale 32, R1→R2→E18; full table in `e18-remeasure.md`)

| metric (avg) | R1 | R2 | E18 | read |
| ------------ | -- | -- | --- | ---- |
| form IoU | 0.76 | 0.76 | 0.76 | net flat: **+** on thin (bow .47→.53, koi .62→.71, heart→.90, moai→.59), **−** on solid (dancing-man −.10, pineapple −.06, mushroom −.05) |
| speckle | 0.62 | 0.30 | **0.13** | down on all 7 |
| distinct | 53.3 | 6.4 | **5.3** | down on all 7 |
| off-palette | 1968 | 1172 | **0** | zero on all 7 (the leakage directive) |
| value ΔE | 4.53 | 0 | 1.35 | below R1; small cost vs R2's tautological 0 on pineapple/heart/mushroom |

## Acceptance criteria

| AC | status | evidence |
| -- | ------ | -------- |
| Combined thin+segmented build for all 7, AJV-valid, rendered, saved to `e18-build/<s>/` | ✅ | runner + `assertArtifact` in-loop; 7 `e18-build/*` dirs |
| One record with form IoU + speckle + distinct + off-palette + value ΔE vs R1 & R2 + deltas | ✅ | `e18-remeasure.{md,json}` (`subjects[].deltas.vsR1/vsR2`) |
| All 7 present; a fix that didn't help recorded honestly | ✅ | `json.regressions` (form-IoU dips, value-ΔE costs, no-change cells) + md section |
| Pure assembly/metric logic unit-tested; live render GL-isolated; `npm test` green | ✅ | 9 tests in `remeasure.test.mjs`; runner is GL/host; suite 588 |

## Test coverage

The pure assembler is fully covered: direction-aware `improved`/`delta` (IoU higher-better vs speckle
lower-better, equal, null), happy-path assemble (deltas + averages + md content), honest worse-regression
recording, value-ΔE tautology flagging, all-improving → empty regressions, null-build handling, and the
`e18-remeasure/v1` schema/shape. `npm test` 588/588; no regression in the deps' suites.

**Gaps:** the GL path (render, silhouette IoU), dwebp decode, and the `voxelizeGlbThin → segmentMaterials`
wiring are verified by running the runner, not in CI (the established split). The before/after numbers are
reproducible via `node benchmarks/sculpture/e18-remeasure.mjs 32` and committed as the roll-up + summaries.

## Open concerns / handoff to T-061

1. **Thin voxelization should be routed, not universal (the headline).** On real curved TRELLIS meshes the
   conservative surface trace adds a ~1-voxel boundary shell to *every* subject (occupancy grew on all 7),
   which recovers missing members on thin forms (bow, koi: form IoU up) but over-thickens already-solid
   forms (dancing-man, pineapple, mushroom: form IoU down 0.05–0.10). T-059 only measured thin subjects, so
   this integration sweep is the first to surface the solid-form cost. **T-061's thin-angular boundary
   finding should decide *when* to apply thin (by form type / connected-component or thinness signal)**
   rather than applying it to all. The combined build here applies it universally per the ticket spec.
2. **Value-ΔE reference is k=8, build palette is k=6.** The mismatch is what surfaces E18's small value
   cost (pineapple 4.73, heart 3.41). Keeping the reference at the E-17 k=8 preserves comparability with the
   ablation sweep; a k-matched reference would zero the delta but hide the real cost of E18's tighter
   palette. Documented in `notes.valueDeltaETautology`; T-061 should pick one convention for the scorecard.
3. **Heavier builds.** Thin ≈ +20–135% cells (mushroom 9505→11958, bow 513→1210). Renders stayed well
   within budget at scale 32 (max ~57 s/subject); a scale sweep would need a re-check (memory: fidelity
   non-monotonic in scale).
4. **moai shows 3 connected components** (thin diagnostic) — the GLB surface has small disconnected patches;
   reported honestly, not a failure (T-059 design D4: a non-manifold mesh yields >1 component).

## Verdict

All four acceptance criteria met and verified. The integration confirms E-18's speckle/palette directives
hold under combination (off-palette → 0, speckle and distinct down on all 7) and produces an honest,
machine-readable remeasure record — including the form-IoU tradeoff and the value-ΔE cost — that hands T-061
a clean data spine and a concrete routing decision. Ready for consolidation.
