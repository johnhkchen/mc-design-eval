# T-179-01 — Design: close the verge + arch-head leaks with a *profile* edge primitive

## The decision, up front

The wall classifier vocabulary is **{corner column, top row, bottom row}** — all *flat* (constant-y rows,
constant-(x,z) columns). T-176-01 proved this cannot name a **sloped line** (verge) or a **curve** (arch
head). The falsifiable claim warned: *fails if the sloped-line / arc derivation needs element-local geometry
the footprint model can't supply — then the **edge classifier**, not the brush, is the sub-problem.*

**That is exactly what we found, and it is closable.** The missing classifier is a **surface profile**: *the
extreme cell along one axis, per coordinate of a perpendicular axis*. One primitive expresses both leaks:

- **Raking verge** = the **top cell per across-coordinate** of a gable-end slice (occupancy profile). As the
  across-coordinate moves, the top-y rises then falls → a *sloped line* — the rake.
- **Arch head** = the **top air cell per opening column**, toward the lintel (aperture profile). As the
  column moves, the crown-y varies for an arch (constant for a flat lintel) → a *curve* — the voussoir arc.

A row is the degenerate profile (all extremes equal). So the profile primitive **subsumes** the flat head and
generalizes the leak away — the honest answer the AC asks for is: **the edge classifier was the sub-problem,
and adding one profile primitive resolves both; it generalizes.**

We emit through the **same compositor and the same brushes** — no new registry door, no new air op.

## Approach chosen

### A. Raking verge — `deriveRakingVerge` + rewired verge layer

`deriveRakingVerge(occ, {ridgeAxis, eaveY, ridgeY})` → pure. Band `[eaveY+1, ridgeY]`. The gable ends are the
ridge-axis extrema (`x∈{xMin,xMax}` for ridge=x). For each end slice, group band cells by the **across**
coordinate (z for ridge=x) and take **max y** → the rake cell at that across-coordinate. Output:
`{ rakeCells: ["x,y,z"...] (sorted), byEnd: {[end]: [...]}, faces: [...end faces], curve: boolean,
band:{yLo,yHi} }`. `curve` is true when the per-across top-y is not constant (a real rake; a flat shed would
be false — the honest degenerate).

The verge layer in `composeRoofTreatment` switches from keying `surface.relief` to the **2-D column set** (the
heavy triangular face) to keying it to the **3-D rake-cell set** with `zoneOf(pos) = rakeSet.has("x,y,z") ?
"verge" : null`, faces = the gable-end faces (`±x` for ridge=x). Result: proud cells ONLY on the sloped top
edge → a crisp verge board, not a heavy band. Additive ⇒ closure holds; the guard is still asserted.

The verge report changes from `leak:"..."` to `profile:"raking", placed:N, resolves:"the sloped-line leak —
top-cell-per-across profile, not a flat band"`. (TG16 updates from *asserts-leak* to *asserts-rake-is-crisp*:
verge cell count == rake-cell count and **strictly less** than the old full-band count.)

### B. Voussoir arch head — `deriveArchHead` + an optional head recolor in the opening layer

`deriveArchHead(aperture)` → pure over the aperture record (au/av world space). Head side = toward the lintel
(min `av`, since `lintel` sits at `v0-1`). Per opening column `au` that contains air, the **crown air cell** =
the air cell with the extreme `av` toward the lintel; the **voussoir** = the bordering solid one step further
(`av∓1`, present in `perim` for an arch). Output: `{ crown: [{au,av}...], voussoirs: [{au,av}...],
curve: boolean, side:"top" }`, where `curve` = the crown `av` varies across columns. A flat lintel → all crown
`av` equal → `curve:false` (degenerate row, correctly NOT a leak).

Composition: `composeTreatment`'s opening layer gains an optional `spec.edges.opening.voussoir` material. When
set **and** the dressing seam is injected, after `extractApertures` we derive the arch head per arched
aperture and recolor the **voussoir stones** with the voussoir material. Depth comes from the same injected
seam (the aperture's solid perim depth — the wall plane), so `treatment-grammar` stays pure and decoupled
(the brush-door / wall-skin precedent: the world-space op is injected, not imported). Recolor = last-writer-
wins replace (in the dressing contract) → closure unaffected. The flat-lintel path is unchanged (`curve:false`
⇒ a row, the existing behavior).

## Options considered & rejected

1. **Analytic pitch from `roof-fit` (`gableSurfaceHeight`) for the rake.** Rejected: couples
   `treatment-grammar` to `roof-fit`, and the occupancy already carries the realized profile (the generator
   fills gable ends solid). The occupancy profile is the *built truth*; the analytic plane can diverge from
   it (the gatehouse hip lesson). Profile-from-occupancy is simpler and self-checking.

2. **A brand-new `rake` / `arch` brush in the idiom registry.** Rejected: violates restraint and widens the
   brush door. `surface.relief` already emits proud-at-a-chosen-cell-set via `zoneOf`; a 3-D-keyed `zoneOf`
   *is* the rake brush. No registry change, the door tripwire stays green.

3. **Emit the arch head as proud relief (like the rake).** Rejected: a voussoir arch reads as a *recolored
   ring of stones in-plane* (the wedge stones are the wall surface, dressed a different material), not a
   protrusion. Recolor matches the concept ("dark-timber-surrounded arched passage") and the dressing
   contract. The rake IS proud (a board standing off the gable wall) — different element, different op,
   correctly.

4. **Put the arch head entirely inside `opening-dressing.mjs`.** Rejected for blast radius: `opening-dressing`
   is on the styled chain. Keeping the *derivation* in `treatment-grammar` (pure, unit-tested on synthetic
   geometry) and the *world-space recolor* behind the existing injected seam keeps the change additive and
   the frozen instrument untouched. (If a future ticket promotes the head into the chain, the derivation is
   ready.)

## How this fails (kept honest)

- If the gable-end slice is **not** solid-to-ridge (a hollow/sheet end), the top-cell profile could pick a
  sheet course, not the rake. Mitigation: derive over the band occupancy and record `curve`; on the gatehouse
  the ends fill to ridge (`generateRoof`), so the rake is clean — verified on the render, not assumed.
- If the gatehouse gate is **not** marked `isArch` by `extractApertures` (the faithful build's gate may be a
  square hole), the voussoir recolor no-ops and we say so. The synthetic unit test proves the *derivation* on
  a true arch regardless; the render shows whatever the build actually carries (honest).
- If either reads **busy** or regresses `closureOf` — that is the falsifiable failure; reported on the render.

## Acceptance mapping

- AC1 (both derivations, same compositor) → A + B, `surface.relief` via the door + the injected seam.
- AC2 (render the gatehouse, verge + head read) → new witness runner → PNG in the work dir.
- AC3 (unit tests on synthetic gable + arched opening) → TG21–TG2x + TG16 rewrite.
- AC4 (`closureOf` not regressed; honest record) → guard asserted; FINDINGS records "edge classifier was the
  sub-problem; the profile primitive resolves it; it generalizes."
- AC5 (`npm test` green; instrument untouched) → only `src/view/treatment-grammar*` + an `experiments/`
  runner change; no chain/pin/instrument files.
