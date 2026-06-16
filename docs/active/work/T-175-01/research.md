# T-175-01 — Research: build the chosen approach (compositional treatment grammar) to readable amplitude

Epic **E-43** (surface-treatment-grammar), Story **S-175**. T-174-01's spike chose **candidate A — the
compositional treatment grammar** — at **A's restraint, not B's boldness**, and named the load-bearing lever
as **amplitude** (token→amplified is the glance jump; the load-bearing trio is full-height geometry-derived
quoins + a single eave band + the timber arch reveal). This ticket builds A as a *real, serializable,
tested* module and proves it on the gatehouse beside the concept. Descriptive only — options live in
`design.md`.

## What the spike concluded (the mandate, verbatim where it matters)

- **Winner: A.** `docs/active/work/T-174-01/review.md`: build "the declarative layered treatment with
  **amplitude (depth · run · course-count) as a first-class, tuned knob** — at A's restraint, not B's
  boldness. Keep the load-bearing trio (full-height geometry-derived quoins + a single eave band + the timber
  arch reveal); **do not** add mid-field belts/string courses unless the concept shows one (B's lesson: more
  layers ≠ richer → busy)."
- **Recess guard owed here.** "Guard the recessed-field layer with `reliefNoRegress` when S-175 adds one
  (this spike used only additive proud relief, so closure was never at risk — the recess-by-exclusion guard
  is still untested and remains S-175's job)."
- **Concrete open concern the build must fix.** "`eaveOverhang` as a 'band' covers corners too (whole-row
  proud course) — in the spike the band slightly overlaps the quoin tops. S-175's real treatment should
  derive the band as a *field-only* edge (exclude corner columns) so the quoin/cornice junction reads
  crisply." → the cornice must be **edges-from-geometry aware**, not a blind whole-row course.
- **Generalization caveat.** Single subject; "edge-derivation breaks on hard geometry" (L-masses, gables) is
  untested → retest the geometry-derived edges on a rectangle (and note two-mass for S-176).

## The brushes that already exist (the layer implementations — I compose, I don't re-invent geometry)

All pure, `occ → {placements, report}`, byte-stable, charter-bound (proud cells ONLY in front of existing
exterior shell cells; **recess by exclusion — NO air op**; idempotent):

- **`src/view/surface-relief.mjs`** — `surfaceRelief(occ,{material,faces,rhythm{axis,every,span,phase},depth,
  zoneOf,zone})` is THE shared proud-emission op (column or row rhythm; a `zoneOf` gates which cells are
  eligible). `reliefNoRegress(occBefore, placements, {faces})` is the exported in-plane no-regress predicate
  (own-face elevation mask + `maskProportions` + height ratios byte-identical) — the closure/silhouette guard
  the AC names. `RELIEF_DEFAULTS`.
- **`src/view/facade-articulation.mjs`** — `quoin(occ,{material,faces,run,headerDepth,band/zoneOf})` (corner
  columns derived from `faceSkin` geometry — aMin/aMax along-axis extrema — with an alternating
  stretcher/header depth schedule); `eaveOverhang(occ,{material,faces,depth,eaveRow})` (one proud course at a
  row — a trim band, but **corner-blind**: this is the overlap the spike flagged); `pilaster`, `infillPanel`.
  `faceSkin(occ,f)` returns `{voxels, aMin, aMax, yMin, yMax}` — the geometric edge primitive (NOT exported;
  I will compute corners the same way).
- **`src/view/opening-dressing.mjs`** — `extractApertures(occ)` + `dressOpenings(occ, apertures, {slots})`:
  the arch reveal/frame/door/lantern. **A registry technique — a `src/view` brush may not import it (the
  brush-door tripwire); it is reached by DEPENDENCY INJECTION** (the wall-skin precedent).
- **`src/recognition/compile.mjs`** — `applyArticulation(occ, plan)` (the registry DOOR: `{brush,params}[]`
  → placements, each brush resolved via `getBrush`), `roleBlock(pack, role)`. `facadeArticulationPlan(m,pack)`
  (T-147-01) is the closest precedent: it lowers a recognized facade record into an ordered brush plan as
  PURE DATA. My compositor is its generalization (edges from *geometry*, not from a facade record).

## The fixed-recipe precedent I am promoting (`src/view/wall-skin.mjs`)

`wallSkin(occ,{program,pack,floor,eaveY,extractApertures,dressOpenings})` + `wallSkinPlan(...)` is the S-160
**fixed rustic recipe**: per-storey field → clinker → quoin → limewash → plinth, plus injected
`dressOpenings`. It is exactly the shape E-43 wants to generalize from "a flat role→pass list" into "a
structured, edge-aware, amplitude-carrying grammar". Key reusable patterns from it: the **injected dressing
seam** (`extractApertures`/`dressOpenings` passed in, never imported); `tryRole`/`packTreatments`
(role→block presence-gated, graceful omission); `overlay(occ, placements)` (last-writer-wins fold). On the
gatehouse `wallSkin` no-ops the per-storey field (ground==upper) and fires quoins at the *default* run
(token) — which is precisely why the spike drove the brushes directly. My module makes amplitude explicit.

## The closure guard the AC names (`closureOf`)

`src/view/wall-generate.mjs` exports `closureOf(ring)`: a `ring` is a `Set` of `"x,z"` column keys; it
returns the fraction of the ring's bbox-rectangle perimeter actually occupied (a watertight rect = 1, a
colonnade < 1). **Caveat for the guard:** additive proud relief GROWS the footprint bbox (quoins extend the
corners by `headerDepth`), so `closureOf` of the *whole relieved* ring can move for benign reasons. The
honest before/after comparison must be over the **original wall-band footprint** (no original column may be
lost) — recess-by-exclusion never removes a cell, so this holds by construction; an air-op recess would drop
columns and trip it. That distinction is the guard's whole point.

## The render path (the glance — the judge)

`src/view/render-beside.mjs` — `renderBesideConcept(artifact, conceptPath, outPath, {label})` renders the 4
gate azimuths textured + headless, concept panel prepended. `assertGlAvailable()` is LOUD on a GL-less host
(**GL is available this session**; authoritative probe is `render/src/render.mjs` `GL_AVAILABLE`).
`rebuildArtifact(occ, rawArtifact)` (`src/view/shell-integrity.mjs`) turns an edited occupancy back into a
renderable artifact (palette/metadata preserved). `artifactOccupancy(raw)` / `occupancyFromCells(cells)` /
`bareBlock` (`src/view/occupancy.mjs`) are the load/fold primitives.

## The base build (post-E-42, material-faithful)

`builds/gatehouse/faithful/artifact.json` — bounds min `[0,0,-1]` max `[14,28,15]`, **2287 cells**;
`stone_bricks` 1064 (wall field, y 0–19), `dark_oak_planks` 1215 (roof prism, y 20–28), `dark_oak_log` 4 +
`cobblestone` 4 (token frame). ⇒ **floor=0, eaveY=19**, wall band y 0–19. Quoins essentially absent
(cobblestone:4) — the "token articulation / plain grey box" the epic names. Concept:
`benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-…/concept.png` (bold rubble corner quoins, timber
arched gate, lighter eave band on a dark roof). Roles (rustic): quoins `cobblestone` (rubble), field
`stone_bricks` (dressed), arch frame `dark_oak_log` (timber), light `lantern`, door `spruce_door`.

## The proven runner pattern

`experiments/eval-alignment/articulation-spike.mjs` (T-174-01), `skin-beside.mjs`, `roof-climb.mjs`: load
artifact → `artifactOccupancy` → apply ops (fold placements into `occupancyFromCells`) → `rebuildArtifact`
→ `renderBesideConcept` into `docs/active/work/<ticket>/`. Runners live under `experiments/` (UNSWEPT by the
brush-door tripwire), so they may import `opening-dressing` and inject the dressing seam.

## Constraints / assumptions

- **The render is the judge** (glance over score). Deliverable = a tested module + a beside-concept render +
  an honest busy-vs-rich call. NO judge, NO chain, NO pin write, frozen instrument (`measurements/`,
  pin-guard) untouched.
- **`npm test` must stay green and GROW** — the new module + tests run under the `src/**/*.test.mjs` glob
  (baseline ~2249 passing per T-174-01 review). The brush-door tripwire forbids the new `src/view` module
  from importing `opening-dressing` (inject it).
- **Recess by exclusion** ([[facade-recess-by-exclusion]]): the field reads recessed because the EDGES are
  proud, not because anything is carved/buried. No air op. `closureOf`/`reliefNoRegress` prove it.
- Keep the treatment spec **serializable** (JSON, functions only at compose time) so S-176's
  recognition/pattern-book can emit it.
