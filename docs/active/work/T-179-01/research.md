# T-179-01 — Research: raking verge + voussoir arch head (the two named E-43 leaks)

Descriptive map of what exists, where, and how the two leaks T-176-01 located actually manifest in code.
No solutions here — those are `design.md`.

## What the leak is, in T-176-01's own words

`docs/active/work/T-176-01/FINDINGS.md §4` and the code comment block at
`src/view/treatment-grammar.mjs:276-282` record it precisely:

> the wall vocabulary covers the eave BAND, the ridge CAP and the opening REVEAL cleanly, but the raking
> VERGE (a sloped line, not a row) and the voussoir ARCH HEAD (a curve, not a row) LEAK — a flat row/column
> course under-treats them.

So the unification is partial: **3 of 5 element edges port with no new primitive; 2 do not.** The ticket asks
us to close the 2, via the **same** compositor, and to record honestly whether it generalizes or whether the
*edge classifier* (not the brush) is the real sub-problem.

## The grammar engine (the thing we extend)

`src/view/treatment-grammar.mjs` — pure, serializable, byte-stable. Three relevant exported derivations + two
compositors:

- `deriveEdges(occ, opts)` — wall edges from geometry: footprint bbox, the ≤4 **corner columns** (quoin set),
  `top.row` / `bottom.row`. The classifier vocabulary is **{corner column, top row, bottom row}** — all
  *flat* (a row is constant-y; a column is constant-(x,z)).
- `deriveRoofEdges(occ, {ridgeAxis, eaveY, ridgeY})` — roof-band sibling: `eaveRow`, `ridgeRow`, and
  `vergeColumns` = the **gable-end columns** at the ridge-axis extrema (a *2-D* `"x,z"` set across the whole
  band). This is the source of the verge leak — see below.
- `deriveOpeningEdges(aperture)` — `reveal` (= `aperture.perim`), `head` (= `aperture.lintel`, a flat band),
  and `isArch` (true when bbox interior carries solids — i.e. air does not fill the bbox). It **detects** an
  arch but emits no arch-curve geometry; `head` is always the flat lintel.
- `composeTreatment(occ, spec, ctx)` — wall layers (base/field/corners/top/opening); each layer runs
  independently against the original `occ`, folded once last-writer-wins; `recessClosureGuard` verdict
  returned.
- `composeRoofTreatment(occ, roofSpec, ctx)` — eave (`eave-overhang`) + ridge (`rowCourse`) + **verge**
  (`surface.relief` keyed to `vergeColumns`). The verge layer carries the honest `leak` string in its report.

### Exactly how the verge leaks (read the code)

`composeRoofTreatment` (`treatment-grammar.mjs:377-389`) builds `vergeSet = new Set(edges.vergeColumns)` and
runs `surface.relief` with `zoneOf: pos => (inBand && vergeSet.has("x,z")) ? "verge" : null` on a row rhythm
`every:1`. Because `vergeColumns` is the **entire** gable-end column set and the rhythm matches every band
row, **every cell of the gable-end triangular face becomes proud** — that is the "heavy end band". A real
raking verge is the *sloped top edge* of that triangle (one board following the pitch), not the whole face.

### Exactly how the arch head leaks

`deriveOpeningEdges` (`treatment-grammar.mjs:328-339`): `head = aperture.lintel ?? []`. `lintel` is the flat
band of cells at `v0-1` (one row above the bbox top — see `opening-dressing.mjs:183-188`). For an arch the
crown follows a *curve* (the voussoir stones step up toward the keystone), which a single flat row cannot
name. `isArch` is computed but never consumed for emission.

## How relief is emitted (the brush we reuse, through the door)

`src/view/surface-relief.mjs` — `surfaceRelief(occ, {material, faces, rhythm, depth, zoneOf, zone})`. Emits
proud cells **one cell out along the face normal**, ONLY in front of existing exterior-skin cells (charter:
recess-by-exclusion, no air op, idempotent). `zoneOf(pos)` is called **per occupied skin cell** and must
return the `zone` string to treat that cell. **Key affordance:** `zoneOf` can key to an exact set of
`"x,y,z"` cell keys, not just a 2-D column set — so a *profile* (a chosen subset of surface cells, e.g. the
rake) is expressible with the existing brush, no new registry entry. Reached only through the door
(`applyArticulation → getBrush`); `treatment-grammar.runBrush` already does this for `surface.relief`.

## The roof geometry source (where a gable end lives)

`src/view/roof-generate.mjs` — `generateRoof` fills the gable as a solid stepped wedge; **gable-end slices
fill to the ridge** (the vertical triangular end faces, `gableEndColumns`, `roof-generate.mjs:84-97`). So at
the ridge-axis extremum (e.g. `x=xMin`), the band cells form a full triangle whose **top-cell-per-across-
coordinate** is exactly the rake line. The occupancy already carries this — the rake is *derivable*, the
question is the classifier. `gableSurfaceHeight`/`evalSideHeight` are the analytic pitch, but the occupancy
profile is enough and avoids importing roof-fit.

## The opening geometry source (where an arch lives)

`src/view/opening-dressing.mjs` — `extractApertures(refOcc)` returns per-aperture: `cells` (air, world
`{au,av}`), `perim` (solid ring, **including bbox-interior solids = the arch corner voussoirs**, line 176),
`lintel`/`sill`/`flanks`, `bbox`, `region` (world AABB). `dressOpenings` recolors lintel/sill/frame and
probes depth itself. **`au`/`av` are WORLD coordinates** (`uvWorld`, line 164). So the arch crown is
derivable in `(au,av)` space from `cells` + `perim` alone; depth for a recolor comes from `dressOpenings`'
probing (the injected seam composeTreatment already uses).

The concept (`gatehouse.program.json` summary): **ridge runs x, the arched passage faces −x** (the gable
end), slit windows on ±z. So the verge rake and the arch head appear on the **same −x gable elevation** — one
witness azimuth shows both.

## Tests & witness harness

- `src/view/treatment-grammar.test.mjs` — TG1–TG20. TG14–TG16 cover roof edges; **TG16 currently asserts
  `byLayer.verge.leak` is truthy** (it asserts the leak EXISTS). Closing the verge leak means this assertion
  must change. TG18–TG19 cover `deriveOpeningEdges` flat/arch detection (the hook for the head curve).
  Synthetic stubs: `gableBoxStub` (wall box + gable prism), `boxWithOpening`.
- `experiments/eval-alignment/treatment-sourced-beside.mjs` — the T-176 witness runner (unswept by the
  brush-door tripwire; under `experiments/`). Loads `builds/gatehouse/faithful/artifact.json`, sources the
  spec, injects the `extractApertures`/`dressOpenings` seam, composes, renders beside the concept with
  `renderBesideConcept`. GL is available here (it produced the three T-176 PNGs).

## Constraints / assumptions

- **Pure**: no GL/IO/Date/random in `treatment-grammar.mjs`; byte-stable placement order.
- **Brush door**: a `src/view` brush may not import a technique directly; reach `surface.relief` via
  `applyArticulation`. The opening-dressing seam stays dependency-injected.
- **Recess by exclusion / closure**: additive only; `recessClosureGuard` must not regress (`closureOf` over
  the band). The rake and the voussoir recolor are additive/replace — closure holds by construction, but the
  guard must still be asserted.
- **Serializable**: derivations must round-trip JSON (no functions), consistent with S-176 sourcing.
- **The judge is the render** (FINDINGS posture): the numeric score is not the gate here; the glance is.
