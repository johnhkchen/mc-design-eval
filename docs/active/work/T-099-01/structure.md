# T-099-01 opening-dressing — Structure

## Files

| file | action | role |
|---|---|---|
| `src/view/opening-dressing.mjs` | **create** | PURE core: slot derivation, aperture extraction, dressing op, artifact append |
| `src/view/opening-dressing.test.mjs` | **create** | synthetic-occupancy unit + integration tests |
| `benchmarks/sculpture/dress-openings.mjs` | **create** | impure runner (I/O, GL, record, frames) |
| `package.json` | modify | `"dress:cottage"` script |
| `.gitignore` | modify | gitignore stanza for `benchmarks/sculpture/dress-openings/**/*.png` (keep record JSON/md + dressed artifact committed) |
| `benchmarks/sculpture/dress-openings/cottage.{json,md}`, `cottage/artifact.json` | generated, committed | the durable record + dressed artifact |
| `pr/assets/frames/dress-cottage-{before,after}.png` | generated, committed | render evidence |

**Untouched on purpose**: `structural-read.mjs`, `shell-integrity.mjs`, `occupancy.mjs`, `kit.mjs`,
`fixture-card.mjs` — the op composes their frozen contracts (design D8).

## `src/view/opening-dressing.mjs` — public interface

```js
// Orientation tables (geometry constants, not subject constants)
export const COMPASS        // {"+x":"east","-x":"west","+z":"south","-z":"north"}
export const SHUTTER_FACING // dir → trapdoor `facing` whose OPEN panel lies against that wall
                            // (initial table: opposite of the wall's compass; verified vs card renders)
export const FENCE_RUN_STATE // {"+x"|"-x": {north:"true",south:"true"}, "+z"|"-z": {east:"true",west:"true"}}

export function speciesFence(block, vocabNames)
// "spruce_trapdoor" → "spruce_fence" iff in vocab, else null. Exported for tests.

export function treatmentsFromKit(kitRecord, { vocab } = {})
// kit/v1 record → {
//   slots: { infill: {block, state?, source}, shutter: {block, source}, door: {block, source},
//            light: {block, source}, frame: {block, source} | null },
//   derivations: [{slot, block, from, reason}],   // e.g. the species-fence derivation
//   unfulfilled: [{slot, reason}],
// }
// Routing: whereUsed includes "openings"; rail→infill, *_trapdoor→shutter, *_door→door,
// lantern family→light; cube entry with "trim" → frame. Confidence rank breaks ties, first-seen after.

export function extractApertures(refOcc, dirs = SIDE_FACES)
// Measured on the REFERENCE occupancy's solid view (openings() + its projected grid), converted to
// WORLD terms immediately (design D3). Per aperture:
// { dir, kind: "window"|"door", bbox: {u0,v0,u1,v1},          // ref uv, reporting only
//   cells:  [{au, av}],          // world coords on (axisU, axisV) of each AIR cell inside bbox
//   flanks: { left: [{au,av}], right: [{au,av}] },            // u0-1 / u1+1 columns, rows v0..v1
//   lintel: [{au,av}], sill: [{au,av}],                       // rows v0-1 / v1+1, u0-1..u1+1
//   perim:  [{au,av}],                                        // the solid ring (wall-plane probe set)
//   region: {min,max} }                                       // full-depth world AABB (= openingRegions twin)

export function dressOpenings(targetOcc, apertures, treatments, opts = {})
// World-space application (design D2/D3/D5/D6). Returns:
// { placements: [{op:"voxel", pos, block, state?}],           // namespaced, deterministic order
//   perOpening: [{ dir, kind, bbox, region, planeW,
//                  applied: {infill, shutterLeft, shutterRight, lintel, sill, door, light}, // counts
//                  conflicts: [{slot, name, reduction}] }],
//   regions: [{min,max}],                                     // placement footprint per opening (D8)
//   stats: {openings, fullyDressed, placements, conflicts, alreadyDressed} }
// Wall plane: modal first-solid depth over `perim` probed on TARGET (irregular ring → named conflict,
// modal proceeds). Pane solid→replace, air→add, same-fixture→already-dressed (idempotent),
// other-fixture→conflict. Shutters need backing jamb solid at planeW and a free cell at planeW±1.
// Lintel/sill: recolor-by-append of SOLID cells only, skip when already frame block. Door: leaf rules
// (1→single, 2→hinge left/right pair, >2→centered + named reduction); needs height ≥ 2. Light: beside
// door top row at shutter depth. Stairs never placed.

export function applyDressing(artifact, placements)
// Pure append: placements concatenated, palette.manifest recomputed as sorted union (rebuildArtifact
// precedent). Does NOT validate — callers run assertArtifact.
```

Imports: `solidOccupancy`, `bareBlock` (occupancy); `openings`, with the projected solid grid via
`projectSurface`/`gridMaskOf`/`orthoSpec`/`cellWorldPos` (surface-grid); `SIDE_FACES`
(shell-integrity); `derivedFormClass`, `loadBlockVocab` (kit); `CARD_ROWS` (fixture-card — tests
assert every emitted state shape appears in the proven vocabulary, modulo door facings noted in D5).

## `src/view/opening-dressing.test.mjs` — coverage map

Synthetic fixtures: the shell-integrity-style hut (solid box, hollow interior, 1–2 window
through-holes, optional door slot), built via `occupancyFromCells`.

1. `treatmentsFromKit`: cottage kit JSON → shutter/door/light slots + derived spruce_fence
   (derivation recorded; spruce_fence ∈ committed vocab); a kit WITH a rail entry → rail wins, no
   derivation; no trapdoor + no rail → infill unfulfilled with reason; frame from trim entry.
2. `extractApertures`: window bbox/cells/flanks/lintel/sill/perim world coords on ±x and ±z faces;
   region equals `openingRegions` twin for the same opening.
3. `dressOpenings` happy path per face dir: fence states (`north/south` on ±x, `east/west` on ±z),
   shutter positions at planeW±1 with the table facing, lintel/sill recolors only where block differs.
4. Sealed-pane case: hut with the aperture filled by wall material → pane replaced by fence, counts
   identical to the open-hole case.
5. Idempotency: dress → apply → dress again ⇒ 0 placements, `alreadyDressed` > 0.
6. Conflict honesty: window at facade corner (no left jamb) → `shutter-no-jamb-left`+reduction;
   blocked shutter cell → `shutter-blocked`; 1-tall door → `door-too-short`/`left-undressed`;
   missing ring → `no-wall-plane`/`opening-skipped`. Every non-applied slot has a named conflict
   (asserted exhaustively: applied + conflicts covers the slot set).
7. Door: 1-wide → lower+upper pair, facing = wall compass, hinge left; 2-wide → left+right hinges;
   3-wide → centered + `centered-single-leaf`.
8. Integration (AC #3): dressed hut — `openings()` same bbox/kind with `dressing.cells > 0`;
   `openingRegions` identical pre/post; `closureCheck(occ, regions)` closed with
   `dressed.cells` == infill count; `strayFixtures(occ, regions ∪ result.regions)` == [].
9. `applyDressing`: manifest union, placement append order, assertArtifact round-trip
   (state-carrying voxel ops pass the live AJV gate — the T-097 pin extended to dressing output).

## `benchmarks/sculpture/dress-openings.mjs` — runner shape

```
SUBJECTS = { cottage: {
  key, target: "durable-skin/cottage/artifact.json", ref: "concept-materials/cottage/after-artifact.json",
  kit: "kit/cottage.json", angles: ["right", "+x+z", "-x-z"] } }   // registry DATA (durable-skin pattern)
```
Ladder (exit 0 ⇔ deterministic steps pass; renders are evidence):
1. load target/ref/kit; `treatmentsFromKit` (log derivations/unfulfilled).
2. `extractApertures(refOcc)`; **expect > 0** (else hard fail — nothing to dress is a wiring bug here).
3. CORE ×2 on fresh occupancies → byte-identical placements (JSON compare) — the E-24 determinism proof.
4. `applyDressing` → `assertArtifact` (AJV gate on the dressed artifact); sha256 recorded.
5. INTEGRITY: openings on target before (expect 0 for cottage — recorded) vs dressed after (every
   window aperture re-detected, `dressing.cells > 0`); `closureCheck` with `openingRegions(dressedOcc)`
   → closed + dressed tally; `strayFixtures` with composed regions → empty.
6. ACCEPTANCE GATE: every window-kind aperture fully dressed (infill + both shutters + lintel + sill)
   — any window conflict ⇒ exit 1. Door: if no door-kind aperture, record the named honesty row
   `door: none-detected` (design D7) — recorded, not fatal; if one exists it must be framed.
7. Renders before/after at `angles` (best-effort, recorded); frames copied to
   `pr/assets/frames/dress-cottage-{before,after}.png`; record `dress-openings/cottage.{json,md}`
   (`schema: "dress-openings/v1"`) + committed `cottage/artifact.json`.
8. `--offline`: re-assert committed record + artifact sha + gates (durable-skin precedent).

## Ordering

1. Core module + unit/integration tests (the bulk; verify trapdoor-facing table against the
   committed card renders BEFORE pinning `SHUTTER_FACING`). Commit.
2. Runner + npm script + .gitignore stanza. Commit.
3. Live cottage run → record + dressed artifact + frames. Eyeball renders (E-25 Rule 1: the render
   is the evidence — shutters/fence visible at the gate angles). Commit.
4. `npm test` full suite green throughout; RDSPI artifacts.
