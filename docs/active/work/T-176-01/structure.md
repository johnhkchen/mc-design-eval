# T-176-01 — Structure: files, interfaces, ordering

The blueprint. Two pure modules (one new, one extended), one new impure runner, one generated spec artifact.
No existing production source/schema/pack/instrument file is modified except the additive export surface of
`treatment-grammar.mjs`.

## NEW `src/recognition/treatment-source.mjs` (pure)

Imports: `roleBlock` from `./compile.mjs`; `TREATMENT_GRAMMAR_SCHEMA` from `../view/treatment-grammar.mjs`.
No GL/IO/Date/random. Lives recognition-side because it lowers a *program* (+ pack) into a treatment spec.

```js
export const AMPLITUDE_DEFAULTS = { base:{depth:1}, corners:{headerDepth:2}, top:{depth:1,courses:1},
                                    roof:{eaveDepth:1, ridgeCourses:1} };
export const AMPLITUDE_CAPS = { headerDepth:3, courses:3 };

// program + pack → treatment-grammar/v1 spec (materials sourced by role; amplitude = defaults).
export function sourceTreatment(program, pack, { mass } = {}) → spec
//   resolves field = roleBlock(walls.ground.role); edge = roleBlock(walls.dressing.role);
//   roofEdge = roleBlock(roof.trimRole); roofField = roleBlock(roof.fieldRole);
//   opening.frame = roleBlock(doorOpening.headRole); opening.door = roleBlock("door.main"|fallback);
//   opening.light = decoration door-lantern block; FAILS LOUD if edge === field (no-op guard) and
//   if roofEdge === roofField. Records spec.style, spec.subject, spec.provenance:"sourced".

// (spec, critique) → { spec: refinedSpec, changes:[{layer, knob, from, to, why}], notes:[{kind, dept, text}] }
export function refineAmplitude(spec, critique) → { spec, changes, notes }
//   per CritiqueItem: department + kind drive the bump; the `missing` text only routes WALL→{corners|base}.
//   - WALL  · add|replace · matches /quoin|dressing|corner|pier/  → corners.headerDepth += 1 (≤ cap)
//   - WALL  · add         · matches /plinth|base|water.table/     → ensure base; base.depth = max(1, depth)
//   - WALL/ROOF(top) · add · matches /eave|cornice|trim|verge/    → top.courses += 1 (≤ cap)
//   - OPENING · add       · matches /arch|reveal|frame|door|head/ → ensure edges.opening (frame/door/light)
//   - ANY · replace (wrong material) → notes.push({kind:"materialMismatch", dept, text}); NO bump
//   pure: returns a NEW spec (structuredClone), never mutates the input.
```

Internal helpers (module-private): `decorationBlock(pack, item, where)`; `pickDoorOpening(mass)`;
`hasWord(text, re)`. Every public fn fails loud on a missing role (via `roleBlock`) or a missing mass.

## EXTEND `src/view/treatment-grammar.mjs` (pure, additive)

New exports beside `deriveEdges`/`composeTreatment`/`recessClosureGuard`:

```js
// roof-band edges from the built occupancy — the sibling of deriveEdges over [eaveY+1, ridgeY].
export function deriveRoofEdges(occ, { ridgeAxis, eaveY, ridgeY, faces }) →
  { band:{yLo,yHi}, eaveRow:number, ridgeRow:number, vergeColumns:string[], footprint:{...} }
//   eaveRow = eaveY+1; ridgeRow = ridgeY; vergeColumns = gable-end perimeter columns (the rake), the
//   footprint extrema along the axis PERPENDICULAR to ridgeAxis. Pure; JSON-round-trippable.

// one aperture record → its edge sets (the opening analog of deriveEdges).
export function deriveOpeningEdges(aperture) →
  { kind, reveal: {au,av}[], head: {au,av}[], isArch:boolean }
//   reveal = aperture.perim; head = aperture.lintel (flat) or the solid arch cells (arch); isArch from
//   whether interior-bbox solids exist (the arch corners extractApertures marks). Pure.

// compose the roof band treatment: proud eave course + ridge cap course + verge course, through the door.
export function composeRoofTreatment(occ, roofSpec, { ridgeAxis, eaveY, ridgeY, faces }) →
  { occ, placements, edges, report:{layers}, closure }
//   eave  → eave-overhang brush at eaveRow (door: applyArticulation "eave-overhang")
//   ridge → rowCourse at ridgeRow (door: surface.relief), corner-blind (ridge has no corners)
//   verge → surface.relief keyed to vergeColumns via a column zoneOf (door: surface.relief)
//   single fold; closure guard over the roof band [eaveY+1, ridgeY] (recess-by-exclusion holds — additive).
//   reportleak: report.layers carries a `leak` note where the row-course under-treats the sloped verge.
```

`composeRoofTreatment` reuses the module's existing `overlay`, `runBrush`, `rowCourse`, `recessClosureGuard`
(generalized to take an explicit band) — no new geometry primitive. `eave-overhang` is reached through
`applyArticulation` (the door), consistent with the existing `quoin`/`surface.relief` usage.

## EXTEND `src/view/treatment-grammar.test.mjs` (TG14–TG20)

- **TG14** `deriveRoofEdges` on a synthetic gable box (a box + a triangular roof prism): eaveRow=eaveY+1,
  ridgeRow=ridgeY, vergeColumns = the two gable-end column lines.
- **TG15** `deriveRoofEdges` ridgeAxis z vs x — verge columns swap axis (geometry, not assumed-x).
- **TG16** `composeRoofTreatment` — eave + ridge + verge layers all place; closure ok over the roof band.
- **TG17** `composeRoofTreatment` closure has teeth — a synthesized roof-band carve trips it.
- **TG18** `deriveOpeningEdges` on the `boxWithOpening` aperture (flat head): reveal = perim, isArch=false.
- **TG19** `deriveOpeningEdges` on a synthesized arch aperture (interior solids present): isArch=true, head =
  arch cells.
- **TG20** purity/serializable — roof edges round-trip through JSON; composeRoofTreatment does not mutate.

## NEW `src/recognition/treatment-source.test.mjs` (TS1–TS8)

- **TS1** `sourceTreatment(gatehouseProgram, rusticPack)` → materials byte-equal to the hand-authored spec
  (`field=stone_bricks`, `corners/base/top=cobblestone`, `opening.frame=dark_oak_log`, `door=spruce_door`,
  `light=lantern`). The "sourced, not hand-authored" proof.
- **TS2** roof sourced: `spec.roof.edge.material = stone_bricks` (trimRole) vs `field = dark_oak_planks`
  (fieldRole) — edge ≠ field.
- **TS3** no-op guard trips: a program whose dressing role === ground role throws (`/same material/`).
- **TS4** schema/amplitude defaults present; spec validates as `treatment-grammar/v1` (round-trips JSON).
- **TS5** `refineAmplitude` on a WALL·add "quoins…plinth" item → `corners.headerDepth` bumped + `base`
  ensured; a `changes[]` entry per bump.
- **TS6** `refineAmplitude` on an OPENING·add item → `edges.opening` ensured present.
- **TS7** `refineAmplitude` on a ROOF·replace item → `notes` has a `materialMismatch`; NO amplitude bump.
- **TS8** caps: repeated WALL·add never pushes `headerDepth` past 3; purity — input spec unmutated.

## NEW `experiments/eval-alignment/treatment-sourced-beside.mjs` (impure runner, unswept)

Mirrors `treatment-beside.mjs`. Loads `builds/gatehouse/faithful/artifact.json`, the gatehouse program, the
rustic pack; injects `extractApertures`/`dressOpenings` (under `experiments/`, allowed). Steps:
1. `sourceTreatment(program, pack)` → write `gatehouse.sourced.treatment.json`; assert materials match the
   hand-authored spec (the proof-on-disk).
2. compose + render the **sourced** build beside concept (`sourced-beside.png`).
3. load a gatehouse critique (default: a small inline gatehouse fixture "quoins thin / cornice absent /
   arch present"; `LIVE_DIAGNOSE=1` → call `DiagnoseBuild`), `refineAmplitude`, compose + render the
   **refined** build (`refined-beside.png`); print the `changes[]`.
4. `deriveRoofEdges` + `composeRoofTreatment` → render the **roof-treated** build (`roof-beside.png`);
   print the verge leak note.
5. `deriveOpeningEdges` for each aperture → render the **opening-treated** build (`opening-beside.png`).
6. assert `closure.ok` on every composed build; exit non-zero on regression.

## NEW `experiments/eval-alignment/score-gatehouse-treatment.mjs` (impure, metered — optional)

A thin variant of `score-gatehouse-selfconcept.mjs` pointed at the **refined** artifact, reporting
`styleFidelityScore` vs the **token baseline 42** (not the ~2 floor). `GUARD_ONLY=1` wires without spend.
Writes `docs/active/work/T-176-01/treatment-score.json`. The live re-score is the metered glance-confirmation;
FINDINGS reports the number if run, else the deterministic projection from the refined critique.

## Generated artifacts (work dir)

`gatehouse.sourced.treatment.json` (the sourced spec); `sourced-beside.png`, `refined-beside.png`,
`roof-beside.png`, `opening-beside.png` (witness renders); `treatment-score.json` (if the metered scorer
runs); `FINDINGS.md` (the busy-vs-rich call, the lift, the leak report).

## Ordering (why this sequence)

1. `treatment-source.mjs` + tests (pure, no deps on the roof work) — the sourcing+loop, committable alone.
2. `treatment-grammar.mjs` roof/opening extensions + tests (pure) — committable alone.
3. The runner + generated spec — depends on 1 & 2; renders are evidence, not a test gate.
4. The metered scorer — last, optional, env-gated.

Steps 1 and 2 are independent and each leaves `npm test` green; step 3 is GL-gated evidence; step 4 is
LLM-gated measurement. The pure core (1+2) is the durable, falsifiable contribution.
</content>
