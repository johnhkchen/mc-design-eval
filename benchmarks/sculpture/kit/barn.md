# Kit — barn (kit/v1)

Recognized ingredient kit extracted from the concept (E-26 Rule 1: recognize, don't match).
Check each line against the picture: `runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png`.

| block | form | whereUsed | conf | value check | role |
|---|---|---|---|---|---|
| `stone_bricks` | cube | band0, corners-edges, trim, openings | high | **flagged-mismatch** (ΔEw 19.71, raw 19.71) ⚑ | wall pillars, corner posts, and panel framing trim |
| `cobblestone` | cube | band0 | high | **no-swatch** ⚑ | infill panels between the stone-brick pillars and the gable field |
| `spruce_planks` | cube | roof | high | **flagged-mismatch** (ΔEw 33.487, raw 33.487) ⚑ | pitched roof skin |
| `smooth_stone` | cube | base | medium | **no-swatch** ⚑ | foundation plinth / base course under the walls |
| `oak_door` | fixture | openings | high | — (non-cube) | double entry doors in the long wall |

- `stone_bricks`: Crisp rectangular mortar grid with clean straight seams and flat regular faces on the vertical posts and the borders around each panel — the unmistakable regular brick courses of stone_bricks, not the random lumps of cobble.
- `cobblestone`: Mottled, rounded multi-pebble texture with irregular dark speckles and no straight mortar lines — the random cobblestone face, clearly distinct from the regular bricks framing it.
- `spruce_planks`: Dark chocolate-brown boards with tight horizontal plank seams and faint vertical board breaks — the dark, low-contrast grain of spruce_planks rather than the streaky reddish dark_oak.
- `smooth_stone`: The bottom band reads lighter and flatter than the stone bricks above it, with a smooth uniform grey face and only faint slab seams — the clean unbroken surface of smooth_stone forming the raised footing.
- `oak_door`: Tall two-tone orange-brown leaves with the recessed upper/lower panel split and a visible round handle — the standard oak_door, paired as a double doorway.

## Unidentified surfaces (recorded color-snap fallback)
- thin vertical slit near the gable apex — A narrow dark vertical opening sits high in the gable; it could be a ladder rung, iron_bars, or a slit window, but the texture is too small and shadowed to name the block honestly.

## Corrections vs the E-21 color-role map
- roof: `dark_oak_planks` → `spruce_planks` (was "roof shingle planes")

## Recovered ingredients (absent from the old map)
- `smooth_stone` (cube) — foundation plinth / base course under the walls
- `oak_door` (fixture) — double entry doors in the long wall
