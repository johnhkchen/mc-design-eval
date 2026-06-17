# T-176-01 — Design: source, refine, generalize

Three decisions, each grounded in Research and each carrying its own falsifiable test. The through-line: the
T-175-01 engine stays the load-bearing core; this ticket adds a **sourcing front-end**, a **critique-refine
loop**, and a **roof/opening extension** — composing existing brushes through the door, never a new primitive.

## Decision 1 — Source the spec from program + pack (a pure adapter)

**NEW `src/recognition/treatment-source.mjs`** — lives beside `compile.mjs` (shares `roleBlock`), pure, no GL.

```js
sourceTreatment(program, pack, { mass } = {}) → treatment-grammar/v1 spec
```

It reads `mass.walls.{ground,upper,dressing}.role`, `mass.roof.{trimRole,fieldRole}`,
`mass.openings[].{kind,head,headRole}`, and `pack.decoration`, resolves each role via `roleBlock(pack, role)`,
and emits the spec:
- `field` ← `walls.ground.role` → `{recess:true, material}` (material recorded so the no-op guard can fire).
- `edges.corners`/`base`/`top` ← `walls.dressing.role` (the dressing/quoin role).
- `edges.opening` ← door `headRole` (frame), `door.main` (door leaf), decoration `door-lantern` (light).
- `roof` ← `roof.trimRole` for the eave/ridge/verge band material; `roof.fieldRole` recorded as the field
  the trim must differ from.
- **Fail-loud no-op guard:** if the resolved edge block === the field block, throw with the role names — a
  same-material treatment silently emits nothing (T-175-01's recorded footgun), so sourcing refuses it rather
  than ship an invisible spec. Amplitude defaults are filled by the engine (the pack carries none).

**Why a separate module, not in `compile.mjs`:** `compile.mjs` lowers a program into an *artifact*; this lowers
a program into a *treatment spec* (a different output, consumed by the `src/view` engine). Keeping it separate
keeps `treatment-grammar.mjs` independent of the program schema (it stays unit-testable on synthetic
occupancy) and gives the sourcing its own tests against the real pack/program.

**Falsifiable:** sourcing the gatehouse program+rustic pack must produce a spec **byte-equal in materials** to
the hand-authored `rustic-gatehouse.treatment.json`. If it doesn't, sourcing is wrong (or the hand-authored
spec was). Tested directly.

**Rejected:** *a per-style "pattern-book" JSON keyed on style* (a curated `packs/treatments/rustic.json`).
The program already carries the field/edge role split and the roof-trim role — the pattern-book would
duplicate what recognition emits. Recognition-sourcing is the stronger claim (it generalizes to any
recognized program); the ticket explicitly allows "a curated pattern-book beating LLM authorship is a fine,
reportable outcome" — so the *fallback* is recorded, but recognition-sourcing is the bet. Amplitude is the one
thing recognition does not supply; that is precisely what the critique loop refines (Decision 2).

## Decision 2 — Critique → amplitude refinement (the loop, pure)

Same module: `refineAmplitude(spec, critique) → {spec, changes[]}` — pure, maps each CritiqueItem to an
amplitude bump on the matching layer:

| critique signal (department, kind, missing-text intent) | amplitude action |
|---|---|
| WALL · add/replace · "quoins/dressing under-realized/absent" | `edges.corners.amplitude.headerDepth += 1` (cap at 3) |
| WALL · add · "plinth/base/water-table" | ensure `base`, `base.amplitude.depth = max(1, …)` |
| ROOF/WALL(top) · add · "eave/cornice/trim thin/absent" | `edges.top.amplitude.courses += 1` (cap at 3) |
| OPENING · add · "arch/reveal/frame absent" | ensure `edges.opening` present (frame/door/light filled) |

**The mapping reads `department` + `kind` (typed, structural), never brittle free-text matching** — the
`missing` string only disambiguates *which wall layer* (corner vs base vs top) within the WALL department, and
that is a small fixed keyword set, reported as a known coarseness, not a general NLP claim. `replace` (wrong
material) is **noted but not amplitude-fixable** — amplifying a wrong material makes it louder, not righter;
those route to a `materialMismatch` note (the pattern-book/recognition's job, not amplitude's). Each change is
recorded in `changes[]` so the loop is auditable and the FINDINGS can show *see thin trim → amplify → re-render*.

**Driving it:** the live `DiagnoseBuild` is metered, so the loop is driven two ways — (a) the **deterministic
fixture critique** (`src/baml/fixtures/diagnose/reply.txt` parsed via `bamlParse`) in tests and the default
runner path (no spend), proving the mechanism; (b) an **optional live diagnose** in the runner (env-gated)
for the real measurement. The refinement function is identical on both.

**Falsifiable:** feeding the fixture critique (which says quoins are absent + roof trim wrong) must bump
`headerDepth` and add a cornice course and leave a `materialMismatch` note for the roof — a deterministic,
asserted transform. If amplitude refinement *overshoots* (the render reads busy), that is the glance's call,
recorded in FINDINGS — the loop caps each knob (headerDepth ≤ 3, courses ≤ 3) to bound the overshoot.

## Decision 3 — Generalize the edges vocabulary to roof + openings

**Extend `src/view/treatment-grammar.mjs`** (the geometry+compositor home), additively:

- `deriveRoofEdges(occ, {ridgeAxis, eaveY, ridgeY, faces})` → `{eaveRow, ridgeRow, vergeColumns, band}`.
  Same machinery as `deriveEdges` but over the **roof band** `[eaveY+1, ridgeY]`: `eaveRow = eaveY+1` (bottom
  roof course), `ridgeRow = ridgeY` (top), `vergeColumns` = the gable-end perimeter columns (the rake), read
  from the band footprint along the non-ridge axis. Pure, JSON-serializable.
- `deriveOpeningEdges(aperture)` → `{reveal: perim, head: lintel|arch cells, kind}` — derived from one
  `extractApertures` record. Pure.
- `composeRoofTreatment(occ, spec.roof, {ridgeAxis, eaveY, ridgeY, faces})` — proud **eave course** via the
  door-reached `eave-overhang` (eaveRow = eaveY+1) + **ridge cap course** via `rowCourse` at `ridgeRow` +
  **verge course** via a column-keyed `surface.relief` on the gable-end columns. Returns placements + a
  per-edge report + the closure verdict over the roof band.
- The **opening head** layer is folded into the existing `edges.opening` path: when the aperture has an arch
  head, the injected `dressOpenings` already dresses the reveal; the head course is the `lintel`/arch-cell
  band (already in the aperture record), so this is a report+witness, not a new brush.

**Why extend `deriveEdges` rather than reuse it verbatim:** the wall derivation assumes axis-aligned corner
columns and a single top/bottom *row*. The roof's eave/verge are **sloped lines**; the honest design is a
**sibling** derivation that names `eaveRow`/`ridgeRow`/`vergeColumns` and **documents the leak**: a flat
row-course treats the eave/ridge band and the gable verge *at the band edges*, but the raking verge that
follows the pitch per-column is **not** expressible as one row — and the arch head is a curve, not a row.
Where the wall vocabulary covers it (eave bottom band, ridge cap, opening reveal) it composes cleanly; where
it leaks (raking verge, voussoir arc) the witness render shows it and FINDINGS names it.

**Rejected:** *refactoring `roof-generate.mjs` to persist gable/owner metadata into the occupancy* (agent-3's
"metadata persistence" path). That is a real improvement but a separate, larger change touching the
construction chain — out of this ticket's scope. Deriving roof edges from the **already-built** roof-band
occupancy is sufficient for the witness renders and surfaces the leak honestly.

## Where it all lives / the seams

- **NEW `src/recognition/treatment-source.mjs`** (pure): `sourceTreatment`, `refineAmplitude`.
- **NEW `src/recognition/treatment-source.test.mjs`**: sourcing reproduces the hand-authored materials;
  no-op guard trips; refinement transforms on fixture critique; `replace` → note, not bump.
- **EXTEND `src/view/treatment-grammar.mjs`** (pure): `deriveRoofEdges`, `deriveOpeningEdges`,
  `composeRoofTreatment`. **EXTEND `treatment-grammar.test.mjs`**: roof derivation on a synthetic gable box;
  opening-edges on the with-opening box; roof composition closure.
- **NEW `experiments/eval-alignment/treatment-sourced-beside.mjs`** (impure runner, unswept): sources the
  spec, composes, renders the sourced build + the refined build beside concept; derives+composes roof and
  opening edges → witness renders; optional env-gated live re-score; asserts closure.
- **NEW `docs/active/work/T-176-01/gatehouse.sourced.treatment.json`** — the sourced spec (the artifact that
  proves "not hand-authored"; diffs against T-175-01's hand-authored one).

## Decision

Build the pure sourcing adapter + the pure critique-refine loop in a new recognition-side module, extend the
treatment-grammar engine with roof/opening edge derivation + roof composition (reporting the leak), and a
runner that renders the sourced→refined→roof→opening evidence beside the concept. Re-score via the existing
self-concept pattern; report the lift vs 42 and the busy-vs-rich call on the render. Recognition-sourcing is
the bet; the pattern-book fallback and the unification leak are recorded outcomes, not hidden.
</content>
