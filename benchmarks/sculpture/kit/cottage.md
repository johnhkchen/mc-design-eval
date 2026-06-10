# Kit — cottage (kit/v1)

Recognized ingredient kit extracted from the concept (E-26 Rule 1: recognize, don't match).
Check each line against the picture: `runs/014-vConcept-a-cottage/concept.png`.

| block | form | whereUsed | conf | value check | role |
|---|---|---|---|---|---|
| `stone_bricks` | cube | band0, base | high | verified (ΔEw 6.702, raw 17.067) | ground-floor / plinth walls |
| `cobblestone` | cube | corners-edges, base, roof | medium | **flagged-mismatch** (ΔEw 42.884, raw 38.278) ⚑ | base corner quoins and chimney stack |
| `spruce_planks` | cube | roof, band1, trim | high | verified (ΔEw 15.381, raw 21.13) | roof field, timber framing beams and floor band |
| `smooth_sandstone` | cube | band1 | medium | verified (ΔEw 8.511, raw 16.228) | plaster infill panels between timbers |
| `spruce_trapdoor` | fixture | openings | medium | — (non-cube) | window shutters / lattice infill |
| `spruce_door` | fixture | openings, base | medium | — (non-cube) | front entrance door |
| `lantern` | fixture | openings, base | high | — (non-cube) | exterior light beside the door |

- `stone_bricks`: The lower storey shows regular rectangular coursing with straight horizontal mortar lines and uniform cool-grey blocks — the tidy ashlar grid of stone_bricks, not the random lumps of cobblestone.
- `cobblestone`: At the building corners and on the chimney rising through the roof the stone changes to a mottled, rounded, irregular-pebble texture distinct from the brick coursing beside it — the lumpy cobblestone face.
- `spruce_planks`: Both the stepped roof slopes and the vertical/horizontal framing members show evenly spaced dark-brown plank striations with the flat, low-contrast grain of spruce_planks rather than the reddish chocolate streaks of dark_oak.
- `smooth_sandstone`: The cream panels framed by the dark beams are flat and near-featureless with only a faint horizontal seam — the smooth, uniform pale face of smooth_sandstone reading as render/plaster, not the visible grain of birch planks.
- `spruce_trapdoor`: The brown elements flanking and filling the windows show vertical boards with a cross-brace and a thin recessed profile sitting proud of the wall — the board-and-batten silhouette of spruce trapdoors used as shutters.
- `spruce_door`: The ground-floor entry is a single tall two-panel leaf with a dark vertical-plank face and a visible handle, matching the spruce_door texture set into the stone-brick surround.
- `lantern`: A small cube-on-bracket fixture emitting a warm orange glow with a metal cage and bright center pixels next to the doorway — the lit lantern.

## Unidentified surfaces (recorded color-snap fallback)
- inner window grille behind the shutters — A dark criss-cross lattice is visible inside the window opening, but the resolution does not let me distinguish whether it is iron_bars, a wooden fence/trapdoor grid, or simply shadow, so I will not name a block.

## Corrections vs the E-21 color-role map
- band1: `white_terracotta` → `smooth_sandstone` (was "upper-storey plaster infill between the timbers")
- roof: `dark_oak_planks` → `spruce_planks` (was "roof eaves, verge & rake fascia (darker plank edge)")

## Recovered ingredients (absent from the old map)
- `spruce_trapdoor` (fixture) — window shutters / lattice infill
- `spruce_door` (fixture) — front entrance door
- `lantern` (fixture) — exterior light beside the door
