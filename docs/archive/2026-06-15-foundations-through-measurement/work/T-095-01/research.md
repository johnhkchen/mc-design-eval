# T-095-01 challenge-milestone — Research

Descriptive map of what exists for the E-25 terminal milestone: one named run per subject
(cottage, gatehouse, **church**) through shell-integrity → concept-derived zones → full-shell
zone-fill (E-24 stack) → multi-angle same-object gate. No solutions proposed here.

## 1. The stage inventory (all upstream tickets landed)

| Stage | Pure cores (unit-tested) | Impure runner | Inputs | Output |
|---|---|---|---|---|
| Base build (E-21) | `voxelizeGlb`, `classifyFeatures`, `assignFeatureBlocks`, `keysToArtifact`, `sampleSurfaceColors` | `concept-materials-ab.mjs` (`buildSubject`) | GLB + committed `material-map/<s>.json` | `concept-materials/<s>/after-artifact.json` |
| Material map (E-21, LLM) | `parseMaterialMap` | `material-map.mjs` (BAML bridge → `claude -p`) | concept.png + design-doc.md | `material-map/<s>.{json,raw.json}` (committed = the pin) |
| Shell integrity (T-091) | `componentStrip`, `rebuildArtifact`, `openingRegions`, `fillVoids`, `plugClosure`, `closureCheck` (src/view/shell-integrity.mjs) | `shell-integrity.mjs` (`npm run shell:*`) | a build artifact | repaired artifact + record |
| Zone map (T-092) | `extractConceptZoneMap`, `zonesFromBands`, `layerCounts`, `diffZoneMaps` | `zone-map.mjs` (delegates to `buildSkin`) | concept + map + build geometry | `zone-map/<s>.json` (agreement-asserted) |
| E-24 skin (T-085–T-090) | value-select, seal, zoneFill (exposure), paintFace, courses, salt-strip, coverageGate | `durable-skin.mjs` `buildSkin(def)` — **exported** | def registry entry | `durable-skin/<s>/artifact.json` + record |
| Multi-angle gate (T-093) | prompt/parser/`aggregateMultiAngle` (src/form/multi-angle-gate.mjs) | `multi-angle-gate.mjs` (`npm run gate:multi`) | concept + map + GLB + artifact | record + **contact sheet** → `pr/assets/frames/` |

## 2. How the pieces currently connect (and don't)

- **`durable-skin.mjs buildSkin(def)`** is the spine: value-true (T-086, record-agreement THROW) →
  kit overrides (T-096, optional `kitRecord`) → seal → **derived zone map** (committed-record
  agreement THROW when `zoneMapRecord` exists; prior policy = recorded fallback) → exposure-shell
  zone-fill → zone-gated secondaries splat → courses + salt → terminal coverage/band/plaster gates
  (THROW). Deterministic, double-run byte-equality, sha256. `def.build` is **read from disk** inside
  `buildSkin` (durable-skin.mjs:260), so a chained stage must write its artifact to a path first.
- **Shell integrity is NOT wired into the skin chain** (T-091 review concern #1 deferred exactly
  this to S-095). Its runner registry points at the *witnessed-defect* artifacts
  (`spray-paint/cottage/artifact.json`, `building/best/artifact.json`), with cottage AC numbers
  hard-pinned to those inputs — it is a measurement record, not the chain seam. The pure cores are
  the reusable seam; `runShell` itself is not exported.
- **The multi-angle gate is a separate process** (`gate:multi`): GATE_SUBJECTS = durable-skin
  `SUBJECTS` spread + the synthetic-hut fixture. `--artifact <rel>` overrides the judged artifact;
  `--label` namespaces the record/sheet. Default artifact = `durable-skin/<key>/artifact.json`.
  Exit 0/1/2 = PASS/FAIL/REFUSAL. 4 frozen azimuths (config `MULTI_ANGLE_GATE`), per-view T-088
  coverage precondition on the view's projection skin, one `claude -p` judge call per surviving
  view (model pinned `PHASE1_MODEL_ID`), contact sheet = the verdict artifact.
- **`zone-map.mjs` imports durable-skin's SUBJECTS and loops it** — any subject added to that
  registry is picked up by `npm run zone:map` (needs `def.build` to exist on disk).
- **`kit-extract.mjs`** has its own array (cottage, gatehouse). Kit records are **optional** in
  `buildSkin` (absent ⇒ overrides skipped); church has none and needs none (E-26 scope).

## 3. The church's current state (T-094-01)

- Registered **only** as `CHALLENGE_SUBJECTS.church` in `resemblance.mjs` (paths/config only):
  concept `runs/016-vBuilding-a-village-church-with-a-square-bell-tower/concept.png`, glb
  `church.glb`, `scale: 48`. Consumed by nothing yet, by design.
- On disk: `runs/016-…/` has `concept.png` (immutable, checklist-passed), `design-doc.md`,
  checklist; `glb/church.glb` exists (6.47 MB, gitignored; smoke gate: 1 component @48,
  largestFraction 1.0). **No build, no material map, no zone-map record, no kit.**
- Grep confirms zero `src/` references to church; the only benchmark references are the
  resemblance registry block, glb/README.md rows, and the run dir (T-094 review verified).
- Prior research (T-094) found **no existing registry can take a partial church entry**: every
  roster either crashes on missing fields or runs all entries live. Specifically:
  `material-map.mjs` `SUBJECTS` is an array whose main() **loops all entries live** — adding
  church and re-running would regenerate the committed cottage/gatehouse maps (LLM,
  non-deterministic) and break every downstream record-agreement assert.

## 4. The church base-build path (what cottage/gatehouse actually did)

`concept-materials-ab.mjs buildSubject` (T-074) produced both committed `after-artifact.json`s:
parse GLB surface → decode texture (dwebp) → `voxelizeGlb({scale})` → `sampleSurfaceColors` →
`classifyFeatures` → `assignFeatureBlocks(map)` → `keysToArtifact` — **deterministic given GLB +
committed material map + scale** (LLM only in `ensureMap`, which for `kind:"architectural"` never
generates — maps must be pre-committed). Caveats for reuse: its `runLive --only church` would
**overwrite the committed 4-subject `concept-materials-ab.json`** report with a 1-row version,
and its before-side (`segmentMaterials`) + renders are A/B baggage the milestone doesn't need.
The pure cores it composes are all importable. Scale: cottage/gatehouse used `DEFAULT_SCALE`;
the church's registered working scale is 48 (= the smoke-checked voxelization).

## 5. Registry shapes (what a church entry must satisfy)

`durable-skin.SUBJECTS.<key>` requires: `key, build, concept, glb, map, valueSelectRecord
(nullable), zoneMapRecord (nullable — agreement asserted only when the file exists), kitRecord
(optional), policy {zone: {dominant, preserve[], splat[]}} (the fallback prior + diff baseline +
legacy zone mapping), legacy {zone: [blocks]} (the E-23 splat-only counterfactual), plasterInvariant
(nullable), frontDir, sideDir`. Gatehouse precedent: prior policy authored 1:1 from the material
map's roles; `valueSelectRecord: null` = "this run is the result"; legacy = counterfactual,
labeled. The gate's def needs `concept, map, glb, policy, build`.

## 6. Known divergence risks (recorded, will bind Design)

- **Multi-angle gate currently FAILS the durable skins** (T-093 finding): cottage drifted ×4
  (major: roof form/massing at the 30° roof-dominated elevation); gatehouse 3× drifted + 1×
  different-object. The synthetic hut proves the pass path. The gate's budget edge is flappy
  (single judge sample per view). AC2 ("all three pass, ≤2 named minor gaps") is therefore NOT
  currently true for any real subject; the ticket itself sanctions recording named gaps (Rule 6)
  while noting DoD needs pass-or-reviewer-acceptance.
- **Zone-map record agreement is geometry-sensitive**: committed `zone-map/<s>.json` was derived
  from the *unrepaired* builds. Running the derivation on a shell-repaired build may shift
  `layerCounts`/floor-line anchoring → the `buildSkin` agreement assert would THROW on a chained
  (shell-first) pipeline. The assert is path-conditional (`def.zoneMapRecord` nullable).
- **Shell-integrity cottage pins**: `expect {components:23, …}` is bound to the spray-paint
  artifact; the concept-materials base build will measure differently — pins are per-registry-entry
  data (`expect: null` is the gatehouse precedent).
- **Reproducibility**: every deterministic core double-runs byte-equal (E-24 Rule 2); GL renders
  and judge verdicts are evidence/decisions outside the byte-hash (memory: byte-reproducible runs
  gate on coverage; the judge is the live tail). LLM-authored inputs (material map) are pinned by
  one-time committed records; the judge model is pinned by `PHASE1_MODEL_ID` but verdict variance
  across re-runs is real (T-093 review names multi-sample voting as the follow-on).
- **`npm run milestone:cottage` name collision**: `milestone:*` is taken by
  `hollow-cottage-milestone.mjs` (E-23). The new per-subject scripts need a different prefix.
- **Before/after baseline (AC5)**: the "grey-roofed, pink-patched" E-23/E-24 state exists as
  committed frames `pr/assets/frames/durable-<s>-{before,after}.png` + the T-093 baseline sheets
  (`multi-angle-cottage-baseline`); the working tree currently has sibling-session modifications
  to some of these PNGs — commits must be path-scoped (T-094 review concern #6 precedent).

## 7. Conventions that bind this ticket

- RDSPI seam invariant: anything that transforms a build is a unit-tested pure core under `src/`;
  runners are impure wiring, never under the `npm test` glob (`src/**/*.test.mjs`, 1105 green
  pre-T-096; 1129 after T-096).
- E-25 rules: (1) the contact sheet is the deliverable; (2) concepts immutable; (3) church via
  registry entry only — the generalization grep is an AC; (4) all 4 azimuths at contract
  resolution, no flags to weaken; (5) no hand edits, reproducible; (6) gaps named honestly.
- Lisa concurrency: T-094/T-096 sessions were live minutes ago; working tree carries their
  modified ticket files + frames — all commits here must be path-scoped to this ticket's files.
- Evidence layout: records committed as `<runner-dir>/<subj>.{json,md}`, artifacts committed,
  PNGs gitignored except `pr/assets/frames/*` evidence copies; design-learnings.md is the journal.
