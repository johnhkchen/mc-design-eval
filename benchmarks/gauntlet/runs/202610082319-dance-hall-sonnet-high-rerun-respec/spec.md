# BUILD SPEC: Art Deco Dance Hall

## 1. Identity
A symmetrical, stepped Art Deco dance hall. It has a tall central fin-and-spire tower, a gold-stepped marquee over the entrance, and lower wings with stained-glass slots and zig-zag crests.

## 2. Footprint and height
- **The sheet and the stated size disagree.** I measured about 13 px per block, which gives roughly **42 W × 49 H** on the front elevation, a ratio of about 1.15 tall to wide. The stated 22 W × 16 H would be 0.73. **The sheet wins.**
- **Preferred build ("S1"):** 42 wide × ~38 deep × 49 tall at the spire.
- **If 22 wide is mandatory ("S2"):** scale every number below by 0.52 on all three axes. That gives 22 × 20 × ~26, with fins 1 block wide and spire detail simplified. Do **not** cut the tower to 16.
- Coordinates below are S1, with x from the left and y up from the ground.

## 3. Zones and bays
**Vertical zones (S1):**
- y0–3: black and blue plinth.
- y3–7: ground floor with dark glazing.
- y7–13: marquee band.
- y13–22: wing walls and tall glass slots.
- y22–29: zig-zag crest.
- y29–36: central pier with sunburst.
- y36–45: open arched spire frame.
- y45–49: stepped crown.

**Bays left to right:**
- x0–3: carved pilaster.
- x3–12: left wing.
- x12–15: blue and cream fin cluster.
- x15–27: central pier.
- x27–30: fin cluster, mirrored.
- x30–39: right wing.
- x39–42: pilaster.

**Fins:** inner blue fins at x14 and x27 rise to y38. Outer blue fins at x12 and x29 rise to y35. Cream fins sit between and beside them, 1 block wide.

**Roof:** it steps down in terraces from the front. The tower is the highest mass, wing roofs sit at y22, and rear terraces drop 2 blocks per step. Corners are stepped, not sloped.

## 4. MATERIAL MAP
| Region | Block |
|---|---|
| Cream trim, pilasters, fins, spire frame | `cut_sandstone` (accent `smooth_sandstone`) |
| Carved pilaster texture | `chiseled_sandstone` |
| Pale wall field | `white_concrete` |
| Blue fins, crest bands, base band | `blue_concrete` |
| Black plinth and crest steps | `black_concrete` |
| Gold crown, marquee steps, sunbursts | `gold_block` |
| Marquee lit panels | `sea_lantern` |
| Marquee bulb border | `glowstone` |
| Marquee teal diamonds | `prismarine_bricks` |
| Marquee patterned inlay | `orange_glazed_terracotta` |
| Stained slots (blue, yellow, orange, gray mix) | `blue_`, `yellow_`, `orange_`, `light_gray_stained_glass` |
| Dark ground windows | `black_stained_glass` |
| Doors | `dark_oak_door` |
| Soffit | `smooth_sandstone` |
| Chandelier glimpses | `lantern` behind glass |

## 5. Features
- **Doors:** double dark oak, x17–24, y0–5, flanked by cream columns at x12–16 and x25–29, y0–7.
- **Marquee:** x12–30, y7–13.
  - Lit white panel at its center.
  - A teal and orange diamond motif above the panel.
  - A bulb border around the edge.
  - A gold stepped crown on top, y13–17, narrowing to 5 wide.
- **Central stained glass:** x18–23, y16–28, as a grid of muted multicolor panes.
- **Central sunburst:** gold fan at x18–23, y30–34, with the rays fanning up.
- **Spire:**
  - Open arch x17–25, y36–45.
  - Two-wide glass slit at x20–21, y37–44.
  - Gold block at y43–44.
  - Crown steps narrowing from 6 to 4 to 2 wide.
- **Wing slots:**
  - Glass x7–8 and x33–34, y10–20.
  - Small arch with gold sunburst above each, y23–26, at x5–9 and x33–37.
- **Ground windows:** dark glass x5–10 and x32–37, y2–7, with a gold bar and a glimpse of a lantern chandelier.
- **Crest:** black and blue zig-zag steps along each wing top, y22–29, stepping up toward the center.

## 6. Depth plan
- **Facade wall:** the base plane at z=0.
- **Fins:** project 1–2 blocks. Blue fins sit in front of the cream ones.
- **Marquee:** projects about 5 blocks. The top is a gold ramp that steps back to the wall, as the 3/4 view shows. Underneath, the soffit has columns at the corners.
- **Wing pilasters:** project 1 block, with the corner pilasters 2 blocks.
- **Central pier:** projects 1 block from the wings.
- **Recesses:**
  - Glass slots recess 1 block.
  - The spire arch is open through its depth (2 blocks).
  - Entrance doors recess 2 blocks under the canopy.
- **Side walls:** pale field with cream pilaster ribs every ~8 blocks (3 wide, 2 projecting). Between the ribs are small 1×2 windows, with a band of dark windows low on the wall.
- **Rear:** three stepped sandstone terraces, each about 2 blocks lower than the one before. The back wall is plain.
