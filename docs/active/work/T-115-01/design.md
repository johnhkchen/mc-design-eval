# T-115-01 generate-first-provision — Design

The inversion: the voxelized blob never becomes the build. From concept + GLB we **fit** the full
component set (errors recorded), **generate** every artifact cell from parameters + kit, cage the
result against the blob, and run the frozen gate head-to-head with T-111's repair-path results.

## Decision 1 — Where the fits come from: fresh decompose on a conditioned in-memory blob

**Chosen:** voxelize the GLB at a registry-declared scale, condition the blob **in memory** with
the existing morphology (closure fill/plug + T-102 `regularizeShell` vs GLB refSils), and run
`decompose(conditionedOcc, {glb, alignment})` fresh. The conditioned blob is *evidence*: it never
enters the artifact; its only products are parameters + the cage target.

- **Rejected: reuse committed `components/<subj>.json` records.** They are sha-pinned to the
  repair-path regularized shells (research §6) — a different substrate; the pins would refuse, and
  silently re-cutting them would re-import blob-shaped decisions. Generate-first must demonstrate
  the *fits themselves* are derivable from concept + GLB alone.
- **Rejected: decompose the raw parity-voxelized blob.** The decompose detectors (roof planes,
  opening interiors) were built against closed shells; parity voxelization leaves holes that break
  interior/opening detection. Conditioning with the same exported cage machinery is measurement
  practice, not substrate leakage — and it is exactly what `shellStage` already does per run.
- Alignment: church uses `scaleAlignment` (registry scale); cottage/gatehouse get registry
  `generated.scale` (new data) and therefore also scale alignment — this *removes* the known
  aabb-affine unreliability for the generated path. Scales: cottage/gatehouse 32 (near the
  committed ~31.x aabb scales), church 48 (matches `provision.scale`). Registry data, never code.

## Decision 2 — The component set and its honesty contract (E-29 Rule 1)

Each component is **fit → tolerance-or-named-finding**; a failed fit is a registered limitation
with a declared *generated* fallback (never a blob copy):

| Component | Fit source | On refusal (registered limitation) |
|---|---|---|
| Footprint per mass | decompose `masses[].plan.runs` (+ degenerate-run findings) | mass omitted only if volume < floor; named `mass-unfit` |
| Storey heights / wallTop per mass | roof eave fits where gables exist, else mass `yRange`; disagreement vs blob heightfield recorded | wallTop = mass top, finding `walltop-default` |
| Wall slabs | decompose `wallSlabs` (coverage; `slab-low-coverage` ≥ existing rule) | walls still generated from footprint; slab evidence recorded only |
| Roof forms | `gablesFromRecord` → ends → ridge → hip/pyramid ladder (`fitHipCap`/`fitHipEnds`, T-112) with all existing named refusals | mass capped FLAT at wallTop, finding `roof-unfitted` (visible, named — not a blob roof) |
| Opening groups | decompose `openingGroups` + `fitOpeningHead` per opening (arch/flat/none refusals) | rectangular aperture, finding carries the head refusal |

This reuses every existing fitter unchanged; the **new** fit ground is footprint/storey/wallTop
parameterization (research §2: today these are read, not fitted-with-recorded-error).

## Decision 3 — Generation: solid mass extrusion + existing generators

**Chosen:** a new pure generator composes the build occupancy entirely from parameters:
1. **Masses:** solid extrusion of each fitted footprint over [baseY, wallTop]. Solid (not hollow)
   matches the chain's existing shell topology; the known solid-shell storey problem is solved the
   proven way — the component plan supplies wallTop/floor lines (`plan.wallTopEffective` already
   threads skin→grammar→settle).
2. **Roofs:** fitted gables/hips through `roofHeightfield` + the course generator (stair/slab
   family from the kit via the S-113 authority) — the same cells roof-swap would author, minus the
   swap (there is no inherited roof to swap against).
3. **Openings:** carve fitted apertures into the masses; author heads via the shaped vocabulary
   (arch reconstruct or flat). Carved openings make `extractApertures(base)` read the *generated*
   base — the dressing/presence seam works unchanged.
4. **Blocks:** named-space zone dominants from the registry policy (base/upper/roof) — the skin
   chain (value-true → zones → fill → coherence → gates) repaints exposure surfaces exactly as it
   does today; generation supplies form, the skin supplies material truth.
- **Rejected: hollow walls + interior floors.** Interior design is out of the ticket's scope; the
  gates judge exterior form/material only.

## Decision 4 — Zero blob cells: provenance check, not set-intersection

**Chosen:** the generator returns a **provenance map** (cell key → component id: `mass-*`,
`roof-*`, `opening-*`); a pure check asserts (a) every artifact cell has generator provenance,
(b) no provenance source is `blob`/`sampled` (the vocabulary admits none), and — the teeth —
(c) the assembled artifact is byte-identically reproducible from the recorded parameters alone
(re-generate, compare). Blob overlap *fraction* is recorded as fit-quality **evidence** beside it.
- **Rejected: set-intersection against the voxelized mesh as the gate.** Generated walls are
  *supposed* to coincide with blob occupancy (the cage maximizes IoU); disjointness would invert
  the objective. The AC's intersection reading survives as the recorded overlap evidence + the
  explicit absence of any copy path (the runner never holds a blob→artifact edge; the conformance
  of that claim is the provenance check + a unit test that plants a foreign cell and watches it
  refuse).

## Decision 5 — Runner shape: new `generated:<subj>`, reusing the styled stretch verbatim

**Chosen:** `benchmarks/sculpture/generated-milestone.mjs` behind `npm run generated:{cottage,
gatehouse,church}`. Stages: evidence (voxelize + condition + refSils) → fit → generate → write
`generated/<subj>/base-artifact.json` → `buildSkin` (authority-composed, as today) → **the same
post-chain stretch styled-milestone runs** (grammar → dressing → settle fixpoint → kit-aware gate
spawned via the multi-angle CLI, label `generated`) → cage outcomes (per-azimuth `silhouetteIoUs`
+ `closureCheck` vs the blob) → zero-blob check → head-to-head table.

To avoid re-implementing the settle/gate seam, **extract styled-milestone's post-chain stretch
into an exported function** (`styledStretch({def, kitRec, base, skin, componentPlan, …})`);
styled-milestone calls `runChain` then the stretch; generated-milestone calls its generate
provision then the *same* stretch. The frozen gate stays spawned through its own CLI (contract
reused, never re-implemented); `instrumentDiff` runs against the committed styled-label gate
records to prove the same ruler judged both paths.
- **Rejected: copy the grammar/dress/settle loop into the new runner.** Two settle
  implementations is the exact class of drift T-113 just eliminated; the conformance tripwire
  would also have to whitelist a second composition site.
- **Rejected: a `--generate-first` flag on challenge/styled.** The repair path must keep running
  unchanged beside the new mode (the head-to-head needs both); a mode flag inside the terminal
  runner couples their records and repro proofs.

## Decision 6 — Head-to-head, baselines, and honesty

Per subject, `generated/<subj>.json` + `.md` record: fit table (per component:
fit/tolerance/finding), cage outcomes (IoU per azimuth, closure), zero-blob check, censuses
(spike/ragged, diffed by block/y per `spike-census-counts-declared-cells`), gate verdicts, kit
presence, repro shas, `generalizationGrep`. A comparison table (per subject, committed under
`pr/assets/` + summarized in the record) joins **the T-111 repair-path rows**
(`reconstructed/<subj>.json`; for church also the post-T-113 `styled/church.json` gate FAIL — the
freshest repair-path verdict, cited as such) against the generated rows: verdicts per azimuth,
fit errors, spike/ragged census, kit presence. **Losses are findings with causes** — no re-rolls,
single judge sample, verdicts committed as judged.

## Reproducibility & generalization

Deterministic stretch (voxelize → condition → fit → generate → skin → grammar → dress → settle)
double-runs in-process with byte-compare; `--repro` re-proves from a fresh process vs committed
shas (judge never re-run); `--offline` re-asserts the committed record. The runner contains no
subject keys (`generalizationGrep` embedded); subjects/scales/policies are registry data.

## Risks accepted

- Fitted footprints inherit blob noise (runs are blob-measured) — acceptable: parameters are
  *measurements of evidence*, the inversion bans *copying cells*, not measuring them.
- Cottage/gatehouse generated at scale 32 vs committed ~31.x builds: head-to-head compares gate
  verdicts and censuses, not geometry; the cage target is the same-scale blob (consistent).
- The judge may fail generate-first builds (e.g. lost dormers/detail masses). That is the
  experiment's answer, recorded beside the repair path (E-29 honesty).
