---
style: "rustic"
type: parametrization-notes
status: notes
provenance:
  function: "DecomposeBrushBacklog"
  model: "claude-opus-4-8"
  prompt_sha256: "54bf3d50ed7c4b0ffb4e0f596afb506fb446c1c2e0f648d16dbce2d88f0b8436"
  generated: "2026-06-12T00:26:24.816Z"
---

# Parametrization notes — style rustic

Needs the registry already covers (an owned brush, parametrized — never a duplicate work
item). 19 note(s); 0 demoted by the code gate; 0 warning(s).

## Notes

### `roof.gable`

- **need:** The cottage and barn main roof slopes (pitch class [1]).
- **how:** pitch: 1; blocks: { field: spruce_planks, trim: dark_oak_planks }. Pair with the new roof.fascia for the dark edge band and surface.roof-courses / course.stairs for the stepped plank realization.

### `roof.hip`

- **need:** Hipped roof ends on the barn or cottage.
- **how:** pitch: 1; blocks: { field: spruce_planks, trim: dark_oak_planks }. No verge to band; roof.fascia trims the four eaves only.

### `roof.pyramid`

- **need:** Any pyramidal cap (porch / small tower).
- **how:** pitch: 1; blocks: { field: spruce_planks, trim: dark_oak_planks }.

### `course.stairs`

- **need:** The stepped stair member of the roof family (roof.course role).
- **how:** block: spruce_stairs; winding: walk for the open slope, soffit for the under-eave return.

### `course.slab`

- **need:** The half-step member — shallow-pitch landings and ridge half-caps (roof.step role).
- **how:** block: spruce_slab; kind: bottom for landings, top for the ridge half-cap.

### `dormer`

- **need:** Cottage roof dormers (the dormer idiom).
- **how:** width/depth small (2–3); wallHeight 1–2; wallBlock: white_terracotta; roofBlock: spruce_planks; faceBlock: white_terracotta; ridgeBlock: dark_oak_planks; aperture sized for a single light, then closed by window.lattice.

### `chimney`

- **need:** The cottage chimney stack with a brick crown.
- **how:** footprint sized to the hearth; height to clear the ridge; block: cobblestone (cool fieldstone shaft); cap: crown; capBlock: bricks (the one warm-on-cool brick element).

### `jetty`

- **need:** The cottage upper-storey jetty overhang.
- **how:** overhang: 1; joistEvery: 2; beamBlock: dark_oak_log; joistBlock: dark_oak_log. Runs at the first/second-storey division.

### `plinth`

- **need:** The dressed-stone plinth / base course.
- **how:** courses: 1–2; inset: 0–1; block: stone_bricks. dressing.pier quoins/buttresses seat on this course.

### `arch`

- **need:** Arched dressed openings.
- **how:** block: stone_bricks (the dressing kit), kept distinct from the rubble field.

### `head.flat`

- **need:** Flat-headed dressed openings.
- **how:** block: stone_bricks.

### `timber-frame`

- **need:** The half-timber frame and cream lime-plaster panels of the upper storey.
- **how:** No params: emits dark_oak_log corner posts/studs/eaves beams with white_terracotta infill, restricted to upper-storey zones (white_terracotta is never used at ground level — rain-splash).

### `opening-dressing`

- **need:** Stone jambs and heads framing every opening.
- **how:** No params: dresses jambs/heads from the kit (stone_bricks). Pair with window.lattice and opening.door for the closures it does not place.

### `hollow`

- **need:** Hollow shells for the cottage and barn interiors.
- **how:** No params: must run before window.lattice / opening.door so apertures are genuinely void.

### `floorplan`

- **need:** Interior floors and storey divisions.
- **how:** No params.

### `surface.fill`

- **need:** The ground-storey rubble fieldstone wall field.
- **how:** skin: exposure; minRun: ~3 so cobblestone reads as bonded rubble, not speckle. (A concept may override the ground field with dressed stone, as the cottage's ashlar storey does — paint resolves that.)

### `surface.paint`

- **need:** Final role-priority reconciliation across the kit.
- **how:** priority orders dressing/trim above field so dressed stone, fascia and frame members win over the rubble/plank fields where they overlap.

### `surface.roof-courses`

- **need:** Laying the spruce_planks roof field as courses.
- **how:** No params: produces the field that roof.fascia then edges.

### `surface.strip-salt`

- **need:** De-speckling the rubble field and roof.
- **how:** minKeep / minExtent tuned to keep bonded runs while removing stray single blocks; run after dressing.pier and roof.fascia so their thin intentional runs are preserved.

## Demoted by the registry gate (factory quality signal)

- none — the model honored the registry digest.

## Warnings

- none
