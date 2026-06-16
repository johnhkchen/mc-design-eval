# T-175-01 — Design: the compositional treatment grammar, properly

The spike chose **A**. The decision this phase makes is *how A becomes a real module*: the spec shape, the
edges-from-geometry engine, the compositor's layer order, where the brush-door seam goes, and how the recess
guard is wired — grounded in the modules Research mapped.

## The load-bearing decision: edges are COMPUTED from geometry (decision (4) of the epic)

The epic's thesis is that **edges are derived from the element's geometry** (corners→quoins, top→cornice,
bottom→plinth, opening-perimeter→reveal). That is what makes "trim ABC on the edges" portable across shapes
and what unifies element types. So the module's spine is a pure `deriveEdges(occ, {faces, floor, eaveY})`
that, from the occupancy alone, returns serializable edge descriptors:

- **corners** — the 4 footprint corner columns `(x,z)` (from per-face `faceSkin` along-axis extrema
  `aMin/aMax`, intersected into footprint corners). The quoin brush already derives these internally; the
  engine surfaces them as DATA so the cornice can *exclude* them (the spike's crisp-junction fix) and so the
  derivation is unit-testable on synthetic boxes.
- **top** — the eave row (`eaveY`, or the max skin y) + the corner-column set to exclude.
- **bottom** — the floor row (`floor`, or the min skin y).
- (**openings** are derived by the injected `extractApertures` — not pure-internal, so kept as a separate
  seam, not in `deriveEdges`.)

`deriveEdges` is pure, returns plain data, and is the thing the AC's "geometry→edge-sets, unit-tested on
square / rectangle / with-opening" names. This is the **anti-hedge fixture**: if the derivation is wrong on a
plain rectangle the tests fail loudly; if it's right on square+rect but breaks on the cottage's two masses,
that is the named S-176 generalization risk (reported, not hidden).

## The serializable treatment spec (`treatment-grammar/v1`)

A declarative, layered, amplitude-carrying spec — pure JSON, no functions, so recognition/a pattern-book can
emit it (S-176). The epic's four-layer abstraction (base / plane / field / edges), pruned to A's restraint:

```jsonc
{
  "schema": "treatment-grammar/v1",
  "base":  { "material": "stone_bricks", "amplitude": { "depth": 1 } },        // a proud course at the bottom edge (water-table/plinth)
  "field": { "recess": true },                                                  // recess BY EXCLUSION: no proud emission on the field
  "edges": {
    "corners": { "material": "cobblestone",  "amplitude": { "headerDepth": 2 } },// full-height quoins; run defaults to the wall band
    "top":     { "material": "stone_bricks", "amplitude": { "depth": 1, "courses": 1 } }, // single eave band, corner-excluded
    "opening": { "frame": "dark_oak_log", "door": "spruce_door", "light": "lantern" }     // arch reveal via injected dressOpenings
  }
}
```

**Amplitude is first-class** (epic decision #1): every layer carries `amplitude` (depth / headerDepth /
courses / run). The compositor reads these; nothing is a magic constant. **Restraint by omission** (the
spike's lesson): no `field.field` pattern, no mid-height string course — B's busy tell. A spec MAY add them
later; the gatehouse spec does not.

## The compositor: `composeTreatment(occ, spec, ctx)`

Pure (modulo the injected dressing seam), `occ → {occ, placements, report, edges, closure}`. Layer order
(base→field→edges→openings), each layer mapped to an existing brush — **no new geometry primitive**:

1. **base** → `surfaceRelief` row-rhythm at `floor` (a proud course; the plinth/water-table). Distinct from
   the cornice only by row.
2. **field (recess)** → **no-op proud emission**. The field reads recessed because the edges stand proud of
   it. The compositor records `field.recess=true` and the closure guard proves no cell was removed. (This is
   the recess-by-exclusion the AC wants *guarded* — the honest content is that A is additive, so the guard
   confirms an invariant rather than catching a carve; an air-op field would trip it.)
3. **edges.corners** → `quoin(occ,{material, faces, run = eaveY-floor+1, headerDepth})` — full-height
   geometry-derived corners. The load-bearing detail.
4. **edges.top** → `surfaceRelief` row-rhythm at `eaveY` **with a corner-excluding `zoneOf`** built from
   `deriveEdges().corners` — the field-only cornice that fixes the spike's quoin/band overlap. (NOT
   `eaveOverhang`, which is corner-blind — that is the concrete reason the compositor calls `surfaceRelief`
   directly here.)
5. **edges.opening** → the injected `extractApertures`+`dressOpenings` with `{slots:{door,frame,light}}` —
   the timber arch reveal. Absent the injection, openings are skipped (graceful, the wall-skin rule).

Folding is last-writer-wins (`overlay`, the wall-skin precedent). The compositor returns the final occupancy
plus a per-layer report (cells placed per layer) and the closure verdict.

## Recess-by-exclusion closure guard

`recessClosureGuard(occBefore, occAfter, {floor, eaveY})` (pure, exported): build the wall-band ring (`"x,z"`
columns occupied at `floor≤y≤eaveY`) for both, **restricted to the BEFORE footprint bbox**, and assert
`closureOf(after') ≥ closureOf(before')` AND no before-column dropped. Restricting to the before-bbox
neutralizes the benign bbox-growth from proud quoins (Research's caveat) so the metric measures *holes*, not
*growth*. Returns `{ok, before, after, droppedColumns}`. The compositor calls it and surfaces the verdict;
the runner asserts `ok`. Tests prove it stays `ok` for the additive treatment and FAILS for a synthetic
air-op (a removed field column) — so the guard is shown to have teeth, not just pass vacuously.

In-plane silhouette is *also* guarded with the existing `reliefNoRegress` over the relieved faces (the spike
review's instruction) — proud relief widens the perpendicular extent (honest) but must not move the own-face
mask or height ratios.

## Where it lives / the seam

- **NEW `src/view/treatment-grammar.mjs`** (pure, swept by tests): `TREATMENT_GRAMMAR_SCHEMA`, `deriveEdges`,
  `composeTreatment` (dressing injected), `recessClosureGuard`. Does **not** import `opening-dressing` (the
  brush-door tripwire) — the runner injects it, exactly as `wall-skin.mjs` does.
- **NEW `experiments/eval-alignment/treatment-beside.mjs`** (impure runner, unswept): loads the faithful
  gatehouse, the serialized rustic spec, injects `extractApertures`/`dressOpenings`, composes, renders the
  treated build AND the token baseline beside the concept; prints the closure + per-layer report.
- **NEW `docs/active/work/T-175-01/rustic-gatehouse.treatment.json`** — the serialized spec (the reusable
  artifact S-176 sources).

## Options considered & rejected

- **Extend `eaveOverhang` with a corner-exclude set** instead of calling `surfaceRelief` for the cornice.
  Rejected: it mutates a shared brush's signature for one caller; the compositor expressing the corner
  exclusion via a `zoneOf` keeps brushes untouched and makes the edges-from-geometry dependency explicit
  (the cornice literally consumes `deriveEdges().corners`). Honest composition over a brush edit.
- **Put the compositor in `compile.mjs` as a second `*ArticulationPlan`.** Rejected for this ticket: the
  program/recognition path (facade records) is the S-176 sourcing seam; S-175's job is the engine + a
  hand-authored spec proven on the render. A standalone `src/view` module keeps the engine independent of the
  program schema and directly unit-testable on synthetic geometry. `compile.mjs` can lower a treatment spec
  into this engine in S-176 (the spec shape is designed to make that a thin adapter).
- **Implement the field recess as a carve (air op).** Rejected — violates the standing
  `facade-recess-by-exclusion` charter; it is exactly the failure the guard exists to catch (and the test
  asserts the guard catches it).
- **Carry B's bold quoins (hd3) + drop the string course.** This is the reviewer's open taste call. Default:
  **A's restraint (hd2)** per the spike recommendation; the runner exposes `headerDepth` in the spec so the
  reviewer can bump it and re-render without code change. Recorded as the one judgement the glance owns.

## Decision

Build `treatment-grammar.mjs` = `deriveEdges` (geometry→edge data) + `composeTreatment` (declarative spec →
layered relief over the existing brushes, dressing injected) + `recessClosureGuard`; a serialized rustic
gatehouse spec; unit tests on square/rectangle/with-opening (derivation, layering, recess-by-exclusion,
closure-not-regressed *and* the air-op trip, in-plane no-regress, idempotence, purity, fail-loud); and a
runner that renders the treated gatehouse beside the concept against the token baseline. Report busy-vs-rich
on the render.
