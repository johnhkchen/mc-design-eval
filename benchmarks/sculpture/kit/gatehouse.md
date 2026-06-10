# Kit — gatehouse (kit/v1)

Recognized ingredient kit extracted from the concept (E-26 Rule 1: recognize, don't match).
Check each line against the picture: `runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png`.

| block | form | whereUsed | conf | value check | role |
|---|---|---|---|---|---|
| `stone_bricks` | cube | band0, openings | high | verified (ΔEw 2.171, raw 7.97) | main wall body / coursed masonry of the structure |
| `cobblestone` | cube | corners-edges, trim | high | **thin-sample** ⚑ | corner quoins and the eave/trim band capping the walls |
| `deepslate_bricks` | cube | roof | medium | verified (ΔEw 4.497, raw 2.085) | roof field (the sloped dark brick courses) |
| `stone_brick_stairs` | fixture | roof | medium | — (non-cube) | stepped roof eaves / verge and ridge edging |
| `dark_oak_planks` | cube | openings | medium | **flagged-mismatch** (ΔEw 16.524, raw 17.541) ⚑ | arched door surround / lintel framing the gateway opening |

- `stone_bricks`: Uniform light-grey blocks laid in a regular offset brick course with crisp straight mortar lines and the faint cracked-brick speckle characteristic of the stone_bricks texture; flat faces, no rounded cobble lumps.
- `cobblestone`: The vertical corner strips and the band under the roof have a mottled, lumpy, rounded-pebble surface with irregular dark pits — the cobblestone texture — clearly distinct from the flat ruled coursing of the stone_bricks walls beside them.
- `deepslate_bricks`: The roof slope shows very dark, near-black blocks laid in a tight horizontal brick course with visible offset mortar joints — a brick pattern (not plain stone), in the dark deepslate value range rather than a brown or red brick.
- `stone_brick_stairs`: The light-grey stepped edges framing the dark roof field read as a staircase profile (angled steps with a slab-thick nose) in the same light stone-brick value as the walls, used to make the sloped eave and verge.
- `dark_oak_planks`: The blocks framing the doorway arch are warm dark-brown with horizontal plank grain and the regular vertical seams of a plank texture, in the dark/cool brown range that distinguishes dark_oak from the redder spruce or lighter oak.

## Unidentified surfaces (recorded color-snap fallback)
- narrow vertical window slits on the side wall (openings) — They read as thin dark recessed slots; I cannot tell whether they are empty air recesses or hold a dark infill block (e.g. bars/pane), so I will not guess a block.

## Corrections vs the E-21 color-role map
- roof: `deepslate_tiles` → `deepslate_bricks` (was "roof mass")

## Recovered ingredients (absent from the old map)
- `stone_brick_stairs` (fixture) — stepped roof eaves / verge and ridge edging
