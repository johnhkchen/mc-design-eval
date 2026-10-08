# The Corner Crumb — Café & Bakery

## 1. Identity
A sandstone market-house with an oak shopfront, anchored by a striped brick corner tower. It is the block's landmark and the meeting point of both streets.

## 2. Palette by role
| Role | Block | Reason |
|---|---|---|
| Dominant | `smooth_sandstone` / `cut_sandstone` | Local dressed stone, warm like the bread inside. Used for pilasters, quoins and the tower shaft. |
| Supporting | `oak_planks`, `stripped_oak_log` | A joiner's shopfront: window frames, the upper-storey cladding, the terrace deck. |
| Accent 1 | `bricks` | The corner tower's bands, from the baker's own oven brick. |
| Accent 2 | `cobblestone` / `stone_bricks` | Rough spandrel panels under the upper windows and the street paving. |
| Accent 3 | `orange_terracotta` | Shutters, so the lodging windows read from across the square. |

Relationship: the sandstone frame holds the oak infill, the brick marks the corner, and the terracotta adds colour.

## 3. Massing & roof
- **Main block:** 14 × 14 × 3 storeys (y 1–13), with a flat oak-plank parapet roof edged by an `oak_slab[type=top]` cornice that projects 1 block.
- **Corner tower:** a 3 × 3 tower at x0–2, z0–2, chamfered at the corner so it reads as rounded. It rises 3 blocks above the parapet (to y 16) and is capped by a stepped `brick_stairs` crown with one central `cut_sandstone` finial.
- The back (+z, +x) is a plain sandstone wall with a single ladder hatch on the roof.

## 4. Facade composition
- **Bays:** 3 bays on each street front, divided by 2-wide `cut_sandstone` pilasters that run the full height, so every vertical line carries from the ground to the cornice.
- **Base (y 1–5):** double-height shop windows in each bay, 3 wide × 4 tall, made of `glass_pane` in an `oak_fence` mullion grid. A `stone_bricks` plinth runs at y 1.
- **Middle (y 6–9):**
  - An `oak_planks` band at y 6 doubles as the balcony floor.
  - The lodging windows are 2 × 2 panes flanked by `orange_terracotta` shutters.
  - Below each window sits a `cobblestone` spandrel panel.
- **Top (y 10–13):** oak-plank cladding finished by the slab cornice.
- **Tower:** banded `bricks` at y 4–5, 8–9 and 12–13. The tower door sits on the 45° corner.

## 5. Depth plan
| Element | Depth | Detail |
|---|---|---|
| Pilasters | +1 | Proud of the infill. |
| Shop glass | −1 | Recessed, so every pane sits in an oak reveal. |
| Balconies | +1 | `oak_fence` rails over each mid-storey bay. |
| Upper windows | −1 | Shutters flush with the wall face. |
| Tower crown | +1 | Steps outward. |
| Cornice | +1 | Continuous along both fronts. |
| Entrance | −1 | Recessed beneath an `oak_fence` lattice canopy. |

## 6. Detail & life
- **Entrance and sign:** the corner entrance is an `oak_door` with a hanging sign reading "THE CORNER CRUMB / CAFÉ & BAKERY". Pink and brown banners hang either side on `cut_sandstone`.
- **Terrace (−z front, z = −3…−1):**
  - A raised `oak_slab[type=top]` deck with an `oak_fence` rail.
  - Two `oak_stairs` + `oak_slab` table sets.
  - Orange-and-white wool awnings on fence posts. Their stripes alternate on purpose, to repeat the shutter colour.
- **−x front:**
  - Barrels and stacked crates (`barrel`, `composter`) beside the shop window.
  - A blue-and-white awning stall selling produce.
  - A wall-mounted hanging sign on an `oak_fence` bracket.
- **Lights:** `lantern`s hang under the balconies and at the tower door.
- **Plants:** flower pots on the balcony rails.
- **Street:** cobblestone and stone-brick paving with a `stone_brick_slab` kerb, the only ground on both streets.
