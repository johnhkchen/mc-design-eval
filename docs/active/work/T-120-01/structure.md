# T-120-01 structure — registration-hardening

File-level blueprint. Two pure cores, two runner changes, one new runner, one runbook doc,
committed fixture records. Ordering matters: pure cores → runners → fixture records → docs.

## New files

### 1. `src/form/registration-smoke.mjs` (pure core, ~150 lines)

Composes the real lens over proxy geometry + the kit dry-run. Imports:
`rowProfile, robustExtent, anchorIndex, extractConceptZoneMap` from
`../color/band-profile.mjs`; `bandRefsFromZoneRecord, buildKitPrompt` from `./kit.mjs`.
No I/O, no GL, no thresholds of its own (committed map data + existing lens constants only).

```
export const REGISTRATION_SMOKE_SCHEMA = "registration-smoke/v1";

export function proxyGeometry(gridResult, materialMap, opts?)
  → { layerCounts:{yMin:0, counts:number[]},   // reversed row filled-counts (identity-shaped map)
      floorLines:[],                            // snapping is not the smoke's claim
      upperTop:number,
      eave:{source:"anchor"|"roof-run", row:number} }
  | { undecidable:true, reason:"proxy-eave-undecidable" }
```
Ladder: (1) `anchorIndex` on row widths within `robustExtent` (verbatim constants) — eave =
anchor; (2) anchor null and the map declares BOTH walls- and roof-class blocks → top-down scan
for the first row whose field-class cells ≥ roof-class cells; (3) neither → undecidable.
Rows above the eave map at/above `upperTop` (row order is top-first; proxy y = reversed index).

```
export function registrationSmoke({ gridResult, materialMap, subject }, opts?)
  → { schema, subject, pass:boolean,
      refusal:null | {stage:"proxy"|"lens"|"kit-dry-run", reason:string},
      proxy:  …proxyGeometry result (params recorded even on refusal),
      lens:   null | {readable, reason?, bands?, roof?, params},   // verbatim lens output
      kitDryRun: null | {ok:true, bandNames:string[], promptChars:number},
      note:   "readability verdict only — band y-geometry is proxy-true, never registry data" }
```
Flow: proxy → undecidable ⇒ pass:false; else `extractConceptZoneMap({gridResult,
floorLines:[], layerCounts, upperTop, materialMap})` → `readable:false` ⇒ pass:false (lens
reason verbatim); else build the EPHEMERAL `{schema:"zone-map/v1", source:"concept",
derived:{bands}}`, run `bandRefsFromZoneRecord` + `buildKitPrompt({subject, promptBands})`
inside try/catch (a throw is a named kit-dry-run refusal, not a crash) ⇒ pass:true.

### 2. `src/form/registration-smoke.test.mjs` (~12 tests)

Fixture style: band-profile.test.mjs synthetic grids + its barn-transcribed map literal shape.
- proxyGeometry: eave-anchor path (bulged width row); roof-run fallback (flat plateau + map
  with both classes); undecidable (flat plateau, map without roof rows) — named reason.
- registrationSmoke PASS end-to-end on a synthetic readable concept grid; bands feed a
  working kit dry-run (bandNames include band0… + roof; promptChars > 0).
- THE BARN SHAPE: wholesale-flipped field rows + nearTonePairs map → pass:true with
  `lens.params.fieldResolution` present (the T-117 rung engages inside the smoke).
- Refusals: unreadable concept → pass:false, `refusal.stage:"lens"`,
  reason `no-field-cells` verbatim; too-few-cells; kit dry-run stage covered by feeding a
  doctored lens output with no bands (throws → named).
- Determinism: same inputs → deep-equal records (no Date/random anywhere).

### 3. `benchmarks/sculpture/registration-smoke.mjs` (impure runner, ~120 lines)

Direct-args runner (pre-registration subjects have no SUBJECTS entry):
```
node benchmarks/sculpture/registration-smoke.mjs --concept <png> --map <json> \
     [--subject <name>] [--rotate-pins]
```
- Loads map JSON; `loadBlockVocab()` as preflight (kit's vocab must load — part of "kit-extract
  dry-run executes"); decodes concept; builds the grid EXACTLY as buildSkin
  (`gridFromPixels(img, {whitelist: bareList(map.palette), n: SAMPLE_GRID_N, dropColor:
  estimateBorderColor(img), cellMeans:true})`).
- Calls `registrationSmoke`; writes `registration-smoke.json` + `.md` BESIDE the concept via
  `guardedWriteRecord` (repo-rel path; `ROTATE_FLAG` honored).
- Exit 0 pass / 1 refusal (stderr: `✗ REFUSED — <stage>: <reason>`) / 2 usage. No model calls,
  no network, no GL — structurally zero-spend.
- Imports pin-guard (conformance rule 1) and nothing from sdk-binding (rule 2).

### 4. `docs/knowledge/registration-runbook.md` (~120 lines)

THE one place (AC 3). Sections: (a) S-094 checklist items 1–7 verbatim + **item 8 — lens
smoke** (command, sibling record, pass required, refusal ⇒ regenerate concept+map);
(b) ordered flow `provision-concept → checklist 1–7 → material-map --subject <new> →
registration:smoke → trellis-glb → glb-smoke [--record] → registry edits → bootstrap order`;
(c) the four registry DATA lists enumerated (durable-skin / kit-extract / material-map /
resemblance); (d) glb-smoke gate semantics (speck budget, delegation to shellStage strip,
moai control numbers); (e) immutability boundary (E-25 Rule 2) and what a refusal may
regenerate. Cites the barn deviations as the motivating fixtures.

### 5. Committed fixture records (implement-phase outputs, all guarded writes)

- `benchmarks/sculpture/runs/017-…/registration-smoke.{json,md}` — barn passes (deviation 1
  closed as a fixture).
- `benchmarks/sculpture/glb/smoke/barn@48.json` — pass:true, one speck (1/3579).
- `benchmarks/sculpture/glb/smoke/moai@48.json` — pass:false (oversize component; the control).
- `benchmarks/sculpture/glb/smoke/church@48.json` — pass:true, zero specks (clean baseline).

## Modified files

### 6. `src/form/voxel-components.mjs` (+~45 lines)

```
export const GLB_SMOKE_SPECK_FRACTION = 0.02;  // per-component cell-fraction budget (declared)
export function speckVerdict(sizes, total, { speckFraction = GLB_SMOKE_SPECK_FRACTION } = {})
  → { pass, principal:{cells, fraction},
      specks:   [{cells, fraction}],   // non-principal ≤ budget — delegated to componentStrip
      oversize: [{cells, fraction}],   // non-principal > budget — the gate failure
      speckFraction }
```
Principal = max size, lowest index on ties (strayVoxelStats idiom). `total === 0` → pass:false
(`principal:{cells:0,fraction:0}` — an empty voxelization is never a registrable mesh).
Pure, deterministic, sorted descending for stable records.

### 7. `src/form/voxel-components.test.mjs` (+~6 tests)

Barn shape (3579 cells, 1-cell speck → pass, 1 speck reported); moai shape (two near-half
masses → fail, oversize listed); boundary (component at exactly `floor(total·budget)` cells
passes; one more cell fails); many-tiny-specks (8 components, all sub-budget → pass — the
barn @32 sweep shape); single component (pass, empty lists); empty occupancy (fail).

### 8. `benchmarks/sculpture/glb-smoke.mjs` (replace gate, +record flag; ~+30/-5 lines)

- `componentLabels(occ, {connectivity:26})` for `sizes[]`; `speckVerdict(sizes, occ.count)`.
- Report: existing fields verbatim (conn26/conn6 evidence unchanged) + `speckGate: verdict` +
  `pass` now = `header.ok && verdict.pass`. stderr line names specks/oversize.
- New `--record <repo-rel.json>` → `guardedWriteRecord` (+ pin-guard import; `--rotate-pins`
  honored). Header comment: gate semantics + runbook pointer.

### 9. `benchmarks/sculpture/trellis-glb.mjs` (CLI main only, +~15 lines)

Before the POST: look for `registration-smoke.json` in `dirname(inPath)`. Present+`pass:false`
→ `console.error` named refusal, exit 1 (zero spend). Present+pass → proceed, note record.
Absent → proceed with one stderr note (sculpture path unchanged). `generateGlb` export
untouched.

### 10. `src/form/pin-guard.conformance.test.mjs`

PIN_WRITERS += `benchmarks/sculpture/registration-smoke.mjs`,
`benchmarks/sculpture/glb-smoke.mjs`. (Both import pin-guard, neither touches sdk-binding,
no banned idioms — rules apply as-is, no new patterns.)

### 11. `package.json`

`"registration:smoke": "node benchmarks/sculpture/registration-smoke.mjs"` (docs always show
`npm run registration:smoke -- --concept … --map …` — the `--` lesson).

### 12. One-line doc touches

`provision-concept.mjs` final hint gains "…then `npm run registration:smoke` (see
docs/knowledge/registration-runbook.md)". `glb/README.md` gate paragraph: strict-single-mass →
speck-budget semantics + pointer to `glb/smoke/` records and the runbook.

## Boundaries and ordering

- **Pure logic never imports runners**; `registration-smoke.mjs` (core) sits in src/form beside
  kit.mjs — form→color import direction already exists (kit.mjs ← value-select.mjs).
- **No runner contract changes**: zone-map.mjs, kit-extract.mjs, durable-skin.mjs,
  generated-milestone.mjs untouched (E-30 no-relaxation, T-117 AC echoed).
- **Change order** (each independently committable, tests green at every step):
  1. voxel-components: `speckVerdict` + tests (pure, no consumers yet).
  2. registration-smoke core + tests (pure, no consumers yet).
  3. glb-smoke gate swap + `--record` + trellis-glb sibling check + conformance list +
     package.json script + runner (the impure wave, one commit).
  4. Fixture records: barn/moai/church glb-smoke records, barn registration-smoke record
     (re-runs of real subjects; guarded writes; zero model spend).
  5. Runbook + doc touches + checklist-doc step.
