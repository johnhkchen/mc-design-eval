---
style: "saltcrag"
type: parametrization-notes
status: notes
provenance:
  function: "DecomposeBrushBacklog"
  model: "claude-opus-4-8"
  prompt_sha256: "db44b81821ec5e19914dfb2e2dd9766aa67c427ea463c95c7288df6942781ea6"
  generated: "2026-06-12T01:12:41.374Z"
---

# Parametrization notes — style saltcrag

Needs the registry already covers (an owned brush, parametrized — never a duplicate work
item). 15 note(s); 0 demoted by the code gate; 0 warning(s).

## Notes

### `surface.fill`

- **need:** Storm-grey rubble ground storey of cleared fieldstone (cobblestone), laid up rough.
- **how:** skin=exposure, minRun≈3 (opening spacing floor) over the ground zone; the cobblestone role is then locked by surface.paint. Exposure skin gives the undressed-rubble read without a flat projection.

### `plinth`

- **need:** Beach-cobble footings / damp packed plinth course (mossy_cobblestone).
- **how:** courses=1–2, inset=0–1, block=mossy_cobblestone — the strand's sea-worn stone bedded at the base, reading damper than the cleared field above.

### `surface.paint`

- **need:** Rough cobble infill role assignment across the lower wall (mossy_cobblestone vs cobblestone).
- **how:** priority array ordered [wall.dressing.quoin, wall.finish.limewash, wall.field.ground, wall.infill.cobble] so scarce/dressed roles win and the mossy infill fills the remainder.

### `opening-dressing`

- **need:** Squared dressed quoins and worked jambs at corners and openings (stone_bricks).
- **how:** Feed stone_bricks as the kit's quoin/jamb dressing block; the pass already dresses corners and aperture flanks. Keep it scarce — dress only corners and door/window jambs, never field.

### `roof.gable`

- **need:** The tarred shingle roof field (dark_oak_planks) on the better cottages.
- **how:** blocks.field=dark_oak_planks at a pitch from the [2,1,0.5] classes; surface.roof-courses then coordinates the field with the stair and slab courses so the whole pitch reads as one tarred skin.

### `course.stairs`

- **need:** Coursed-up pitched shingle runs (dark_oak_stairs).
- **how:** block=dark_oak_stairs, winding=walk for the slope run; the courses lap against the wind and share the field's tar.

### `course.slab`

- **need:** Flat shingle course at eave and shallow break (dark_oak_slab).
- **how:** block=dark_oak_slab, kind=bottom where the pitch eases at the eave; same riven tarred softwood laid level.

### `roof.gable`

- **need:** Prestige bought ridge cap on the most beaten seam (deepslate_tiles).
- **how:** Set blocks.ridge=deepslate_tiles so the apex line caps in slate against the black shingle field — a single bought course, dark grey at L23. (roof.thatch carries the same ridgeBlock override for thatched cottages.)

### `roof.gable`

- **need:** Green-grey turf roof on the poorest outbuildings (moss_block).
- **how:** blocks.field=moss_block at the lowest pitch class (0.5) — the bottom rung of the roofing economy on byre and net-store. roof.thatch can also render it at higher thickness if a sod-over-bark depth is wanted.

### `head.flat`

- **need:** Driftwood/salvaged-baulk heads over door and window (spruce_log).
- **how:** block=spruce_log — a flat salvaged-timber head carrying the rubble above each opening; the head.flat idiom is already in use.

### `opening-dressing`

- **need:** Window glazing and tarred deal shutters (glass_pane / spruce_trapdoor).
- **how:** Glaze a few apertures with glass_pane and hang spruce_trapdoor shutters on the rest from the kit; the pass already handles aperture glazing and shutter placement, keeping glass the rare indulgence.

### `floorplan`

- **need:** Plain milled-deal main door (spruce_door).
- **how:** floorplan places the door leaf (door.main=spruce_door) at the program's entrance feature; opening-dressing then jambs and lintels it.

### `chimney`

- **need:** Rubble chimney stack with a dressed weathering cap (cobblestone / stone_bricks).
- **how:** footprint from the hearth feature, block=cobblestone, cap=slab (or crown), capBlock=stone_bricks — gathered fieldstone carried up, the one worked-stone touch at the weather-beaten head.

### `surface.strip-salt`

- **need:** Salt-driven weathering streaks that hold the storm-grey of the place.
- **how:** minKeep / minExtent tuned so streaks survive as broad strips rather than speckle; runs last, after limewash, so it weathers both the rubble field and the fresh seaward coat.

### `hollow`

- **need:** Hollow shell and interior storey layout (generic, not style-specific).
- **how:** hollow carves true interior voids before any cladding pass; floorplan then sets storey floors at the 3–4-block storey height. Both run before surface.clinker so the upper storey clads a real shell.

## Demoted by the registry gate (factory quality signal)

- none — the model honored the registry digest.

## Warnings

- none
