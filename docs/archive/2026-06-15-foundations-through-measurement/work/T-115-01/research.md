# T-115-01 generate-first-provision — Research

Descriptive map of what exists. The ticket inverts the provision: today the voxelized TRELLIS blob
**is** the build substrate (repaired per surface); generate-first makes the blob fit evidence and
cage target only — every artifact cell must come from a generator.

## 1. The chain today (what the blob touches)

`styled:{cottage,gatehouse,church}` → `styled-milestone.mjs` → `styledChain()` (not exported;
`styled-milestone.mjs:88-160`) which calls `runChain()` (exported,
`challenge-milestone.mjs:267-309`):

1. **Provision** (`provisionBase`, challenge-milestone.mjs:137-165, subjects with `def.provision`
   — church): `voxelizeGlb(glbBytes, {scale})` → `sampleSurfaceColors` → `classifyFeatures` →
   `assignFeatureBlocks` → `keysToArtifact`. **Every base cell is a blob cell.** Cottage/gatehouse
   instead read committed `def.build` artifacts — also blob-descended (E-21/T-074 path).
2. **Shell stage** (`shellStage`, :167-221): componentStrip → closure fill/plug → **T-102
   regularization cage** (`regularizeShell`, gated per-azimuth on silhouette IoU vs GLB `refSils` +
   closure no-regress + protect regions). Output = regularized shell, still blob cells (morphology
   moves them; it does not re-author them).
3. **Reconstruct** (`loadReconstruction`, :228-265): loads committed component/roof/shaped records
   (pinned by sha to the in-chain shell — mismatch THROWS), composes roof-program + shaped-heads
   **deltas** over the shell (`occupancyDelta` + `composeReconstruction`). Only these delta cells
   are generated; the wall body remains blob.
4. **Skin** (`buildSkin`, durable-skin.mjs): value-true → kit overrides → seal → T-092 concept
   zone map → T-090 full-shell fill → coherence → T-088 coverage gates. Recolors cells; never adds
   or removes form. Composes the S-113 authority (`skin.vocabulary`).

Then styled-milestone continues: `grammarStage` (placement-grammar.mjs:97-167, consumes
`skin.vocabulary`) → `extractApertures` on the **raw base** (blob) → `dressOpenings` with
`skin.vocabulary.treatments` → **settle fixpoint** (styled-milestone.mjs:113-157; bounded 4
iterations; criterion = frameWants + foreignFill + gatingDressing === 0; T-113 made church
converge) → **kit-aware multi-angle gate** spawned via its own CLI (frozen contract).

So the blob enters the final artifact at exactly two points: the provisioned/committed **base
cells** that survive shell+skin (the wall body, the un-regenerated surfaces), and the **aperture
reference** (extractApertures reads the blob base). Roof (E-27/T-112), opening heads (T-105), and
all skin/grammar/dressing cells are already parameter-generated.

## 2. Fit machinery available (per ticket component list)

- **Decomposition** — `decompose(occ, {glb, alignment, opts})` (component-decompose.mjs:912-960,
  pure): segments **masses** (id, role primary/attached/protrusion, `plan.runs[]` = per-z x-runs,
  `yRange`, `volume`, `junctions`), **roofPlanes** (kind, extent, voxelFit + glbFit gradients,
  ridge), **wallSlabs** (per face dir: axis, plane `value`, coverage — `slab-low-coverage` finding
  <0.6), **openingGroups** (per mass/dir: openings with extent, sillY, jambs, headProfile,
  archCandidate, spring). Today it runs on the **regularized shell** (committed records
  `components/<subj>.json`, source.shellPath pins). Nothing prevents running it on the raw
  voxelized blob — it takes any occupancy.
- **Footprint / storeys** — `structural-read.mjs`: `footprint(occ)`, `storeyBands(occ)`,
  `wallFields(occ)`, `roofRegion(occ)`, `structuralZones(occ)`. Mass plan runs (decompose) are the
  per-mass footprint. **No parametric footprint/storey/wall-slab FIT exists** — these are read,
  not fitted-with-recorded-error; the ticket's "every fit error recorded" for these is new ground.
- **Roof** — `gablesFromRecord` (roof-fit.mjs:239-351; refusals `roof-region-unfitted`,
  `gable-insane`; pitch source voxel-vs-GLB with `fit-source-voxel` refusal), `fitGableEnds`
  (roof-end-fit.mjs), `fitRidgeLine` (roof-ridge-fit.mjs), `fitHipCap`/`fitHipEnds`
  (roof-hip-fit.mjs:148-375, T-112; refusals `hip-cap-candidate-refused`, `hip-cap-unfitted`,
  `hip-end-unfitted`), `programFitError` RMSE gate (roof-fit.mjs:396-416, tol 0.75 cells).
  Generation: `roofHeightfield`/`roofFamily`/`stairShape` (roof-generate.mjs), swap ladder + cage
  arbitration in `roof-swap.mjs` (`swapRoof`, massView, chimneyColumns, roofBandCensus). Runner:
  roof-program.mjs (records `roof/<subj>.json`).
- **Openings/arches** — `fitOpeningHead` (shaped-fit.mjs:95-167; named refusals arch-too-narrow /
  no-rise / degenerate / out-of-tolerance...; flat vs arch vs none), reconstruction in
  opening-reconstruct.mjs; runner shaped-vocabulary.mjs (records `shaped/<subj>.json`).
- **GLB** — `parseGlbMesh`/`loadMeshFromGlb` (glb-mesh.mjs), `voxelizeGlb` (glb-voxelize.mjs:76+,
  deterministic jitter), alignment `scaleAlignment` (church, registry `provision.scale: 48`) /
  `aabbAlignment` (cottage/gatehouse — known unreliable for absolute slopes/offsets;
  `glb-end-fit-anchor-window` memory). `triangleStats` + `glbFitForPlane` (component-glb-fit.mjs).

## 3. The cage and the instruments (the frozen ruler)

- **Silhouette IoU per azimuth**: `silhouetteIoUs(occ, refSils, {grid})`
  (shell-regularize.mjs:416+); refSils = `rasterizeSilhouette(mesh, {view})` at the 4 gate
  azimuths (glb-silhouette.mjs). **Closure**: `closureCheck(occ, {regions})`
  (shell-integrity.mjs:308). Both already used as the regularize/roof-swap cage; evidence-only in
  records (`metrics.cage`).
- **Census**: `protrusionCensus` (spikes = cells ≥4/6 exposed faces) + `raggedColumnRate`
  (shell-regularize.mjs:359-394). Note `spike-census-counts-declared-cells`: diff by block/y
  before reading a rise as regression.
- **Frozen gate**: multi-angle-gate (src/form core + benchmarks runner CLI): 4 azimuths
  45/135/225/315 @ elev 30, verdicts {same object, drifted, different object}, gapBudget 2,
  coverage precondition 0.5/zone, judge pinned `claude-opus-4-8`, single sample, spawned via CLI
  so the contract is reused never re-implemented. Kit-presence (src/form/kit-presence.mjs:73+,
  fixpoint rule) ANDs with resemblance (`composeKitAwareVerdict`).
- **instrument-diff receipts**: `instrumentDiff(preGate, freshGate)`
  (reconstructed-milestone.mjs:71-94) — deep-diff of gate contract + judge models vs the committed
  pre-run gate record; T-111 records carry `instrument: {frozen: true, diffs: []}`.
- **Repro pattern**: deterministic stretch runs twice in-process, byte-compared; `--repro` =
  fresh-process re-run vs committed shas (judge never re-run); `--offline` re-asserts committed
  records. GL renders and resemblance are evidence, never decision inputs.
- **Registry/generalization**: `SUBJECTS` in durable-skin.mjs:96-212 (data only);
  `generalizationGrep()` (reconstructed-milestone.mjs:184-189) embeds
  `subjectKeysInRunner: []` per record.

## 4. The T-111-01 baseline (what the head-to-head joins against)

`reconstructed/{cottage,gatehouse,church}.json` (`reconstructed-milestone/v1`), per subject:
`chain.gate` (outcome, resemblance gapCount/budget, kitPresence, perView verdicts+gaps),
`instrument` (diffs), `metrics.census.{before,after}` (spikes/ragged/columns/raggedRate),
`metrics.roofFit`, `metrics.cage`, findings, repro shas. Results: **cottage FAIL 10 gaps/2**
(135°/225° same-object held), **gatehouse FAIL 12/2** (4/4 drifted, roof-form major everywhere),
**church refused at settle pre-gate** (no styled-label verdicts; T-113 has since fixed the settle
— church now converges, but no post-T-113 gated run is committed). Gate records:
`multi-angle/<subj>-styled.json`.

## 5. The S-113 authority (how a new runner consumes vocabulary)

`composeVocabulary()` (src/form/material-vocabulary.mjs:78-162) is the ONE composition point —
returns {combined, sub, zones, ownSets, fixtures, treatments, record}. The conformance tripwire
(material-vocabulary.conformance.test.mjs) **greps src/form, src/view, benchmarks/sculpture** and
forbids inline renaming-map spreads / kit-override spreads / mapPolicy / inline own-set
construction outside the authority. Any new runner must compose through the authority (or consume
`skin.vocabulary` like styled-milestone does) or the tripwire fails.

## 6. Constraints and assumptions surfaced

- **"Zero blob cells" cannot be set-disjointness.** Generated walls are *supposed* to coincide
  with blob occupancy (the cage maximizes IoU). The machine check must be provenance-based:
  artifact cells == union of generator outputs, no cell sourced by copy from the voxelized mesh.
  The AC's "set-intersection against the voxelized mesh" reading only works as
  "no *sampled/copied* cell", not "no overlapping position".
- **Committed component/roof/shaped records are pinned to the regularized shell** (blob-derived).
  Generate-first fits must come from the blob directly (fresh decompose on `voxelizeGlb` output)
  or the pins don't apply; reusing the committed records would silently re-import blob-shaped
  decisions cut from a different substrate (and their sha pins would refuse anyway).
- **Solid vs hollow**: `cage-solid-shells-break-occupancy-storeys` — generated solid masses make
  every layer read as a floor; the component plan must supply wallTop/floor lines (the chain
  already threads `plan.wallTopEffective` through skin→grammar→settle).
- **Apertures**: extractApertures currently reads the blob base. A generated base must carry its
  fitted openings (carved + headed) for dressing/presence to bind.
- **aabb-affine alignment** (cottage/gatehouse, no registry scale) makes absolute GLB
  slopes/offsets unreliable — fits must stay relative/windowed (existing roof-fit practice).
- **styledChain is not exported**; the post-shell stretch (grammar→dress→settle→gate spawn) lives
  inline in styled-milestone.mjs. A generate-first runner either refactors it out or re-wires the
  same exported pieces (grammarStage, dressOpenings, settle loop, gate CLI spawn).
- **Church kit/zone-map exist** (kit/church.json, zone-map/church.json, registry policy); all
  three subjects have committed kit records, concept PNGs, and GLBs (GLBs gitignored binaries,
  present on disk per glb/README.md).
- `npm test` = validator + unit tests (1431 passing at T-111 close); GL + judge runs are on-demand
  only, never in `npm test`.

## 7. Relevant files (quick index)

| Concern | Path |
|---|---|
| Chain + provision + shell + reconstruct | benchmarks/sculpture/challenge-milestone.mjs |
| Styled terminal (grammar/dress/settle/gate) | benchmarks/sculpture/styled-milestone.mjs |
| Repair-path baseline records | benchmarks/sculpture/reconstructed/<subj>.json |
| Decompose (masses/planes/slabs/openings) | src/form/component-decompose.mjs |
| Roof fit/generate/swap | src/form/roof-fit.mjs, roof-hip-fit.mjs, roof-end-fit.mjs, roof-ridge-fit.mjs; src/view/roof-generate.mjs, roof-swap.mjs |
| Opening head fit / reconstruct / dressing | src/form/shaped-fit.mjs; src/view/opening-reconstruct.mjs, opening-dressing.mjs |
| Cage + census | src/view/shell-regularize.mjs, shell-integrity.mjs; src/form/glb-silhouette.mjs |
| Authority | src/form/material-vocabulary.mjs (+ conformance test) |
| Gate (frozen) | src/form/multi-angle-gate.mjs + benchmarks/sculpture/multi-angle-gate.mjs CLI |
| Registry | benchmarks/sculpture/durable-skin.mjs `SUBJECTS` |
| Structure reads | src/form/structural-read.mjs (footprint, storeyBands, wallFields) |
