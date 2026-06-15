# T-120-01 research — registration-hardening

Descriptive map of everything the ticket touches. Two gaps, both witnessed by the barn (T-116):
(1) the S-094 checklist gates concept *geometry*, not *lens readability* — the barn passed the
checklist, spent the TRELLIS budget, and was then refused by the zone lens (`no-field-cells`);
(2) `glb-smoke`'s strict single-component gate over-fires on sub-speck debris — the barn GLB
failed at every scale on one floating mesh cell (largestFraction ≥ 0.9813 throughout).

## 1. The registration flow today (no single doc owns it)

The flow is distributed across runners, per-run records, and manual registry edits:

1. **Concept mint** — `benchmarks/sculpture/provision-concept.mjs` (stages 1+2 of the vConcept
   building path: design doc via the pinned Phase-1 model, image via BAML → Nano Banana pro).
   Deliberately stops before any build. Regeneration via `--run-dir` preserves attempts as
   `concept-attempt-N.png`.
2. **Concept sanity checklist** — judged by visual inspection, recorded per-run as
   `runs/<id>/concept-checklist.md`. Items 1–6 are the standing S-094 list (single building ·
   clean background · one canonical 3/4 view · ≥3 material zones · readable silhouette · no
   clutter), item 7 is TRELLIS-viability (bulky throughout). The canonical statement of the list
   lives only in `docs/knowledge/design-learnings.md` (~line 2143) and the per-run records —
   there is no standalone checklist/runbook doc.
3. **TRELLIS spend** — `benchmarks/sculpture/trellis-glb.mjs <png> <glb>` POSTs to
   `MODAL_ENDPOINT_URL` (gitignored `.env`; barn run: 322 s GPU). The CLI is generic (also used
   for sculpture subjects that have no material map); it currently has no preflight of any kind.
4. **GLB smoke** — `benchmarks/sculpture/glb-smoke.mjs <glb> [--scale N]`: voxelize at working
   scale, gate `26-conn components === 1` (6-conn reported only). Exit 0 iff pass. Numbers are
   recorded in `glb/README.md` and the run's `concept-checklist.md` sign-off section.
5. **Registry edits (manual, data-only)** — SUBJECTS entries in `durable-skin.mjs` (the full
   def: concept/glb/map/zoneMapRecord/kitRecord/policy/...), plus the parallel DATA lists in
   `kit-extract.mjs`, `material-map.mjs`, and `resemblance.mjs` (CHALLENGE_SUBJECTS). The
   concept becomes IMMUTABLE at this point (E-25 Rule 2).
6. **Bootstrap order post-registration** (T-116 order, hard preconditions):
   `material-map` (LLM, concept-only) → challenge provision (GLB-based build) → `zone:map`
   (lens, needs the build) → `kit:extract` (needs a concept-derived zone record) →
   generated milestone.

Note the ordering fact at the heart of gap (1): the **material map is concept-only** (LLM bridge
`baml-material-map.mts` over concept PNG + design doc; no GLB input) yet is currently generated
*after* the TRELLIS spend, while the **zone lens is map-relative** — so today there is literally
nothing on disk pre-spend for the lens to run against. A pre-spend smoke requires the map to be
minted before TRELLIS (a reorder of the bootstrap, not a new contract).

## 2. The zone lens (`src/color/band-profile.mjs`, pure)

`extractConceptZoneMap({gridResult, floorLines, layerCounts, upperTop, materialMap}, opts)` →
`{readable:true, bands, roof, params}` or `{readable:false, reason, params}`.

**Concept-side inputs** (available pre-spend):
- `gridResult` — built in `buildSkin` (durable-skin.mjs:365) as
  `gridFromPixels(conceptImg, { whitelist: bareList(matMap.palette), n: SAMPLE_GRID_N (96),
  dropColor: estimateBorderColor(conceptImg), cellMeans: true })`. Concept PNG + material map
  only.
- `materialMap` — the committed `material-map/<subj>.json` (LLM-authored, concept-only).

**Occupancy-side inputs** (NOT available pre-spend):
- `layerCounts` — `src/view/zone-map.mjs` over the sealed build occupancy.
- `floorLines`, `upperTop` — `structuralZones(occSealed)` (or the component-definition wallTop
  pin, T-106 seam 4).

**Refusal taxonomy** (all named): `too-few-cells` (< MIN_PROFILE_CELLS=200 filled),
`extent-too-short`, `no-field-cells` (wall segmentation empty after the T-117 rung),
`weak-dominant:band{i}` / `weak-dominant:roof` (< MIN_DOMINANT_SHARE=0.3),
`unmapped-dominant:<block>` (dominant has no map row).

**Which refusals are concept-decided:** the row→layer map (`mapRowsToLayers`) only relocates
row histograms onto y values; it never changes their content. `robustExtent`/`anchorIndex` are
computed with the *same* statistic on both axes. So with a proxy geometry whose layer profile is
the concept's own row profile (reversed; identity-shaped map), every material-readability
refusal (`too-few-cells`, `no-field-cells`, `weak-dominant:*`, `unmapped-dominant:*`)
reproduces exactly; only band y-geometry (snapping, ranges) differs from the eventual real run.
The barn's `no-field-cells` was precisely this class — visible from concept + map alone.

**T-117 rung (must be active in the smoke):** `fieldResolution(materialMap)` builds a
feature-key → walls-key map from the committed map's own `placementRule` rows +
`nearTonePairs`; engages only from the exact zero-field-cells state; honest refusal survives.
The barn ΔL 2.082 witness is unit-tested (`band-profile.test.mjs` group H, 29 tests in file).

**The wall/roof split** is geometric (`upperTop`). Pre-spend there is no `upperTop`. The lens
treats rows mapping at/above it as one roof histogram; rows below as wall bands. Any proxy must
pick a split line from concept-side evidence (the widest-row anchor — the eave — is the natural
candidate; `anchorIndex` returns null on broad plateaus, so a fallback is needed).

## 3. kit-extract and what a "dry-run" can mean

`benchmarks/sculpture/kit-extract.mjs` (impure runner) per subject:
1. loads `zoneMapRecord` + map; `bandRefsFromZoneRecord(zoneRecord)` **throws unless
   `schema === "zone-map/v1" && source === "concept" && derived.bands[]`** — this is the
   precondition that refused the barn while its record was prior-fallback;
2. `buildKitPrompt({subject, promptBands})` (pure);
3. LIVE multimodal call (`callModel`, strong tier) — the only spend;
4. `parseKit`/`assertKit`/`verifyKitValues` over `gridFromPixels` + `sampleRoleSwatches`
   (concept-only, pure given the image);
5. guarded record writes (`pin-guard.mjs`).

Everything except step 3 and the writes is executable against a concept + a (possibly ephemeral)
zone-map-shaped object with zero spend. T-119's `preflightPins` precedent already establishes
"validate everything cheap before the first live call" in this exact file.

## 4. glb-smoke and the speck problem

`glb-smoke.mjs` is a thin script: `voxelizeGlb` → `strayVoxelStats(occ, {connectivity:26})` →
gate `s26.components === 1`. The decision is inline (line 35) — there is **no pure, unit-tested
gate function**; `strayVoxelStats` (src/form/voxel-components.mjs) returns only
`{components, largestCount, largestFraction, strayCount, subFloorCount}` — no per-component
sizes. Per-component sizes ARE available one level down: `componentLabels` returns `sizes[]`.

**Witness numbers:**
- barn (`glb/barn.glb`, sha pinned in README/checklist): scales 32/40/48/56/64 → 26-conn
  components 8/4/2/7/2, largestFraction 0.9813/0.9962/0.9997/0.9973/0.9995. At the working
  scale 48: ONE floating cell of 3,579 (dims 48×21×26). Strict gate fails every scale.
- moai (the control the gate exists for): 3 components, largestFraction 0.5213 — must still
  fail under any tolerance.
- church (clean pass): scale 48, 11,423 cells, 1 component, largestFraction 1.0000.
- GLB binaries are on disk but **gitignored**; records (README table, checklist sign-offs) are
  the durable pins. Regression fixtures can re-run against local GLBs but committed unit tests
  must be synthetic (suite is decode-/GL-free; the T-117 precedent).

**The standing remediation the tolerance delegates to:** `shellStage`
(challenge-milestone.mjs:175, exported; reused by generated-milestone.mjs:131) starts with
`componentStrip` (src/view/shell-integrity.mjs) — strips non-principal components and declares
them. The barn deviation probe showed: voxelize @48 → shellStage → 7,157 cells, 26-conn = 1
component. Both consuming chains run shellStage before any fit, so sub-speck debris never
reaches a build (`assertGeneratedProvenance` additionally proves zero blob cells in artifacts).

## 5. Idioms and constraints that bind the implementation

- **Pure/live split**: decisions in `src/**` with unit tests (`npm run test:unit`,
  `node --test "src/**/*.test.mjs"`, currently 1580/1580 green); runners in
  `benchmarks/sculpture/` are impure leaves. `npm test` also runs the schema self-tests.
- **Pin guard (T-119)**: all committed-record writes go through
  `guardedWriteRecord`/`preflightPins` (`src/form/pin-guard.mjs`, ROTATE_FLAG
  `--rotate-pins`); `pin-guard.conformance.test.mjs` enforces a closed PIN_WRITERS list +
  forbidden write patterns — a new record-writing runner must join that list.
- **npm flag swallowing**: `npm run x --flag` drops the flag; scripts must be robust (the
  preflight fail-closed lesson) and docs must show `--`.
- **E-25 Rule 2**: concepts immutable only *at* registration — a pre-spend refusal that forces
  regeneration is checklist-compatible by construction.
- **E-25 Rule 3 / E-30**: no subject-specific constants; subjects contribute data only. No
  contract relaxation: kit-extract/generated-milestone preconditions stay verbatim; the smoke
  *adds* a gate; the speck tolerance must be a *declared, bounded* constant, strict above it.
- **Determinism**: pure cores avoid Date/random; records are byte-reproducible
  (`--offline`/`--repro` asserts elsewhere).
- **Knowledge-doc precedent**: `docs/knowledge/pin-rotation-policy.md` is the model for a
  citable, binding runbook doc (referenced from code comments and enforced by conformance
  tests). The registration runbook has no home today.

## 6. Existing test surface to build on

- `src/color/band-profile.test.mjs` — synthetic-grid helpers, refusal tests per reason, the
  barn witness (group H). The smoke's pure core can reuse the same fixture style.
- `src/form/voxel-components.test.mjs` — occupancy fixtures for componentLabels/strayVoxelStats;
  a speck-tolerance gate function slots beside them with synthetic occupancies shaped like the
  barn (1-cell speck) and moai (half-mass second component).
- No tests exist for `glb-smoke.mjs` itself (script, inline decision) or for any registration
  orchestration (none exists).

## 7. Open questions carried to Design

1. Proxy geometry for the pre-spend lens run: identity row↔layer map is faithful for material
   refusals; how to pick the wall/roof split (`upperTop`) without occupancy, and what to do
   when the eave anchor is null.
2. Whether the smoke is a standalone runner only (runbook-enforced) or also wired as a hard
   preflight into `trellis-glb.mjs` (whose CLI also serves map-less sculpture subjects).
3. The declared speck budget: per-component cell-fraction vs total stray fraction; the value
   that admits the barn's worst sweep point (8 components @32, each tiny) and still fails
   moai's 0.4787-fraction second mass.
4. Where the smoke + tolerant glb-smoke records land (per-run dir vs `glb/` vs a new
   `registration/` dir) and which are committed pins (pin-guard implications).
5. Kit dry-run depth: precondition + prompt-build only, or also the grid/swatch value pass.
