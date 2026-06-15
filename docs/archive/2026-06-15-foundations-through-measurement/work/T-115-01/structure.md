# T-115-01 generate-first-provision — Structure

Blueprint. Two new pure cores in `src/form/`, one new registry-only runner, one extraction
refactor in styled-milestone, registry data, npm scripts. The repair path keeps running unchanged.

## New files

### 1. `src/form/provision-fit.mjs` (+ `provision-fit.test.mjs`) — pure fit core

The full-component-set fit, E-29 Rule 1 throughout (tolerance-or-named-finding, no silent
fallback). Orchestrates only **existing pure fitters**.

```
export const PROVISION_FIT_SCHEMA = "provision-fit/v1";
export const PROVISION_FIT_DEFAULTS = Object.freeze({ ... });   // tolerances, all named

export function fitProvision({ occ, glb, alignment, opts }) → {
  schema, record,            // the decompose component record (fit evidence, serializable)
  masses: [{ id, role, footprint: {runs, bbox, area, findings},
             baseY, wallTop, wallTopSource: "eave-fit"|"mass-top",
             heightDisagreement,                      // vs blob heightfield, recorded
             findings }],
  roofs:  [{ massId, gables|capFit, kind, fitErrors, refusals }],   // gablesFromRecord →
                                                      // fitGableEnds → fitRidgeLine →
                                                      // fitHipCap/fitHipEnds (T-112 ladder)
  openings: [{ groupId, massId, dir, openings: [{extent, sillY, head: {kind, spec, fitError}
              | {kind:"none", finding}}] }],          // fitOpeningHead per opening
  wallSlabs: [...],                                   // decompose evidence (coverage findings)
  findings: [...],                                    // every refusal, flat, named
}
```

- Internal: `decompose(occ, {glb, alignment})` runs **inside** fitProvision on the conditioned
  blob; no committed component record is read (design D1).
- Refused roof ⇒ `{kind: "flat-cap", finding: "roof-unfitted", detail}` — a *generated* flat cap
  parameter, never a blob copy. Refused head ⇒ rectangular aperture with the head refusal carried.

### 2. `src/form/provision-generate.mjs` (+ `provision-generate.test.mjs`) — pure generator + zero-blob check

```
export const PROVISION_GENERATE_SCHEMA = "provision-generate/v1";
export const PROVENANCE_SOURCES = Object.freeze(["mass", "roof", "opening-head"]);

export function generateProvision(fit, { family, policy }) → {
  cells: Map<"x,y,z", { block, provenance }>,   // provenance: "mass-0" | "roof:mass-0" | ...
  artifact,                                     // assembled via keysToArtifact-style placement
  provenance: { byCell: Map, bySource: {mass: n, roof: n, "opening-head": n} },
  findings,
}
```

- Mass cells: solid extrusion of `footprint.runs` over `[baseY, wallTop]`, minus carved fitted
  apertures (carve = never place; `facade-recess-by-exclusion`).
- Roof cells: `roofHeightfield(gables)` + `generateRoof(gables, family)` (src/view/roof-generate
  .mjs:141,191) over the generated masses; flat-cap masses get a one-course cap at wallTop.
- Opening heads: fitted arch/flat specs (reusing the shaped vocabulary's head-authoring path);
  blocks = named-space zone dominants from registry `policy` (skin repaints downstream).

```
export function assertGeneratedProvenance(artifact, provenance) → { passed, cells, bySource }
```
THROW-style check: every placement key has provenance; every provenance source ∈
PROVENANCE_SOURCES (the vocabulary admits no `blob`/`sampled`); counts match exactly. Unit test
plants a foreign cell and watches it refuse. Blob-overlap fraction is computed by the **runner**
(evidence, not part of the check).

### 3. `benchmarks/sculpture/generated-milestone.mjs` — impure runner (registry-only)

`npm run generated:{cottage,gatehouse,church}` (+ `--repro`, `--offline`). Stage order:

1. **Evidence**: read `def.glb`; `voxelizeGlb(glbBytes, {scale: def.generated.scale})`; refSils =
   `rasterizeSilhouette(mesh)` at the 4 gate azimuths; condition the blob in memory via the
   exported `shellStage` (see refactor below) on a single-block evidence artifact. The conditioned
   blob occupancy is *evidence only* — asserted never written into any artifact path.
2. **Fit**: `fitProvision({occ: conditioned, glb: triangleStats(...), alignment: scaleAlignment})`.
3. **Generate**: `roofFamily(kitRec.kit, vocab-names)` for the course family;
   `generateProvision(fit, {family, policy: def.policy})`; `assertGeneratedProvenance`;
   **regenerate-and-byte-compare** from the serialized fit record (the check's teeth, design D4).
4. Write `generated/<subj>/base-artifact.json`; assemble the component plan for the grammar
   (`buildComponentPlan` shapes fed from the provision fit record — wallTop/floor lines supplied,
   the solid-shell rule); `buildSkin({...def, build, zoneMapRecord: null, componentPlan})`.
5. **Styled stretch** (shared export, see refactor): grammar → dressing (apertures extracted from
   the *generated* base) → settle fixpoint → kit-aware gate spawned via the multi-angle CLI with
   `--label generated` → `multi-angle/<subj>-generated.json`.
6. **Cage outcomes** (evidence): per-azimuth silhouette IoU of the generated build vs GLB refSils
   AND vs the conditioned-blob silhouettes; `closureCheck`; spike/ragged census (diff by block/y).
7. **Receipts**: `instrumentDiff` vs the committed styled-label gate record (same-ruler proof,
   `diffs: []`); `generalizationGrep` (no subject keys); double-run byte-compare of the
   deterministic stretch (stages 1–5 pre-gate).
8. **Head-to-head**: read `reconstructed/<subj>.json` (+ `styled/church.json` for church's
   freshest repair verdict, cited as such); emit per-subject comparison table into
   `generated/<subj>.md` and the cross-subject sheet `pr/assets/generate-first.md`.

Record: `generated/<subj>.json` (`generated-milestone/v1`): fits (per component:
tolerance-or-finding), zeroBlob {passed, bySource, overlapFraction}, cage, census, chain gate
distillation, comparison rows, reproducible shas, generalization. Honest failure: any
deterministic THROW writes `{status: "pipeline-failed", stage, error}`, exit 1.

## Modified files

### 4. `benchmarks/sculpture/styled-milestone.mjs` — extraction refactor (no behavior change)

- Split `styledChain` at the `runChain` boundary: new exported
  `styledStretch({ def, kitRec, base, skin, reconstruction, track, label })` containing
  grammar → dressing → settle (current lines ~96–160 verbatim); `styledChain` becomes
  `runChain(...)` + `styledStretch(...)`.
- Export `spawnGate(key, artifactRel, label)` and `distillGate(gateRec, key, gateCode, label)`
  (parameterize the module-const `GATE_LABEL`; styled callers pass "styled").
- Proof of no change: `npm run styled:cottage -- --repro` and `--offline` must still MATCH the
  committed shas before anything else lands on top (plan step gate).

### 5. `benchmarks/sculpture/challenge-milestone.mjs`

- `export` the existing `shellStage(baseArtifact, refSils)` (verbatim; it is already a pure-ish
  deterministic function) for evidence conditioning. No call-site changes.

### 6. `benchmarks/sculpture/durable-skin.mjs` — registry data only

- `generated: { scale: 32 }` on cottage and gatehouse; `generated: { scale: 48 }` on church
  (mirrors `provision.scale`). No code changes.

### 7. `package.json`

- `"generated:cottage" | "generated:gatehouse" | "generated:church"` →
  `node benchmarks/sculpture/generated-milestone.mjs --subject <key>`.

## Boundaries & interfaces

- **Pure/impure line**: provision-fit and provision-generate are pure (no I/O, deterministic,
  unit-tested in `npm test`); the runner owns all file/GL/spawn effects. GL renders and the judge
  stay evidence/verdict — never decision inputs.
- **Authority conformance**: the new runner composes vocabulary only by consuming
  `skin.vocabulary` through the shared stretch (the tripwire greps benchmarks/sculpture — new
  files must contain no renaming spreads, no inline own-sets, no mapPolicy).
- **Frozen gate**: spawned via its own CLI only; label `generated`; no contract surface touched.
- **No repair-path coupling**: challenge/styled/reconstructed records, paths, and repro proofs are
  untouched (only additive exports).

## Change ordering

1. Registry + npm scripts (inert until the runner exists).
2. `provision-fit.mjs` + tests (green standalone).
3. `provision-generate.mjs` + zero-blob check + tests.
4. styled-milestone extraction refactor + challenge `shellStage` export; prove `--repro`/`--offline`
   still match on a committed subject before proceeding.
5. `generated-milestone.mjs` runner; live runs cottage → gatehouse → church; `--repro` each.
6. Comparison sheet + docs; full `npm test` green.
