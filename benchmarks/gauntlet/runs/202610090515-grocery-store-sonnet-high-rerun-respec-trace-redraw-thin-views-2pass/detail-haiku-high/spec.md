# BUILD SPEC: Corner Grocery (brick shopfront, 2 storeys + parapet)

## 1. Identity
Red-brick two-storey grocery on a town street. It has a striped-awning shop level, a recessed centre entrance, an apartment floor with flower boxes, a white cornice with a dark frieze, and a rear brick chimney stack.

## 2. Footprint and height
- The sheet counts 15 wide × 18 tall on the front, and 15 deep × 19 tall on the side. The sheet wins over the stated 14×14×12, so build **15 W × 15 D × 18 H**, not 12 tall.
- Wall body is 13 wide (x=1..13), with the cornice overhanging 1 block each side (x=0..14).
- Front cornice is at z=1, the wall plane at z=2, and the side wall runs to z≈11. The chimney stack sits at z=12–13 and the rear cornice at z=14.
- The chimney tops out at y=18. Add a 1-block stone sidewalk rim around the base.
- Coordinates: x runs left→right, y is up from ground, z runs back from the front.

## 3. Zones, bays, roof
**Vertical (y):**
- 0–3: shop windows and entrance.
- 4–5: awning band.
- 6: sign and lantern band.
- 7: cream string course.
- 8–13: apartment floor. Flower boxes are at y=8–9, windows at y=10–11, lintels at y=12, plain brick at y=13.
- 14: dark frieze with quartz pilasters.
- 15: cornice slab.
- 16: coping.
- 17: centre tab.

**Bays, front:**
- Shop level: left bay x=1–5, entrance x=6–8, right bay x=9–13.
- Apartment floor: three window bays centred at x=3, 7 and 11.

**Roof and top:**
- Flat roof behind the parapet.
- The cornice slab at y=15 projects 1 block on the front and both sides.
- Quartz pilasters at x=1, 5, 9 and 13 rise through y=14–16. Dark frieze panels sit between them at x=2–4, 6–8 and 10–12 (y=14).
- Centre parapet x=6–8 is raised: brick at y=16 and a quartz cap at y=17.

## 4. Material map
| Region | Block |
|---|---|
| Brick wall field | `bricks` |
| Cornice, coping, pilasters, string course (y=7) | `smooth_quartz`, with `quartz_slab` on the cornice underside |
| Lintel caps, pediment steps | `quartz_stairs` |
| Frieze panels, shop piers/frame, entrance lintel | `dark_oak_planks`, `stripped_dark_oak_log` |
| Window shutters | `dark_oak_trapdoor` (open) |
| Glass | `light_blue_stained_glass_pane` |
| Awning stripes | `red_wool` / `white_wool` alternating, with matching stairs for the slope |
| Sign field | `moss_block`, with lime letters |
| Sign backing, y=5 | `dark_oak_planks` |
| Flower boxes | `jungle_planks` with a `jungle_trapdoor` face |
| Flowers | `red_tulip`, `orange_tulip`, `pink_tulip`, `allium`, `cornflower`, `azure_bluet`, `poppy`, `dandelion` |
| Entrance interior | `black_concrete` (dark), `spruce_planks` floor |
| Produce | `melon`, `pumpkin`, `hay_block`, `barrel`, `composter` (crates) |
| Chimney | `bricks`, with a `cobblestone` band and cap, `stone` top |
| Sidewalk rim | `smooth_stone` / `polished_andesite_slab` |
| Lanterns | `lantern` |

## 5. Features (front, x/y)
- **Apartment windows:**
  - Glass is 1 wide × 2 tall at x=3, 7 and 11, y=10–11.
  - Open dark-oak shutters flank each one at x=2/4, 6/8 and 10/12.
  - A `quartz_stairs` lintel pair sits at y=12 on each bay (x=2 and 4, 6 and 8, 10 and 12).
- **Flower boxes:** 3 wide (x=2–4, 6–8, 10–12), box at y=8, flowers at y=9.
- **Centre pediment:** stepped `quartz_stairs`, x=5–9, y=7–8, rising to the middle.
- **Sign:** "GROCERY", x=5–9, y=5–6.
- **Lanterns:** at x=4 and x=10, y=6.
- **Awnings:**
  - Left x=1–5, right x=9–13, at y=4–5.
  - Stripes alternate red at odd x and white at even x, starting with red at x=1 on the left (the right awning is red at x=9, 11 and 13).
  - They slope out 2 blocks.
- **Entrance:**
  - Opening x=6–8, y=0–3, with a dark_oak_planks lintel at y=4.
  - An open door leaf sits at x=6.
  - Interior shelves and a counter are visible inside.
- **Shop windows:**
  - 3 wide × 2 tall at x=2–4 and x=10–12, y=1–2.
  - The sill is y=0.
  - Add 1-block mullions.
- **Produce on the sidewalk (y=0–2):**
  - Left: `barrel`/`composter` crates at x=1–5, with a `melon` stack at x=2 (y=1–2).
  - Right: `composter` at x=9, `pumpkin` at x=10 and x=12 (y=1–2), `hay_block` at x=12 (y=0), `barrel` at x=13.
- **Side walls:**
  - Two 1×3 dark-oak slit windows on the ground floor at z=5 and z=9 (y=1–3).
  - One 1×1 dark window above at z≈9, y=10.
  - The cobblestone patch on the chimney runs y≈8–12.
  - Add one white-framed 1×1 window beside the stack.
  - Mirror the pattern on the other side.

## 6. Depth plan
- **Wall plane:** z=2.
- **Sidewalk goods:** z=0–1, 1 deep, in front of the piers.
- **Awnings:** reach out to z=0 (2 proud).
- **Entrance:** recessed 2 (door plane z=4).
- **Shop windows:** recessed 1, with dark-oak jambs.
- **Apartment windows:** recessed 1.
- **Shutters:** flush.
- **Lintels and string course:** proud 1.
- **Flower boxes:** proud 1.
- **Pilasters:** proud 1.
- **Cornice:** proud 1 on the front and sides.
- **Frieze panels:** recessed 1 behind the pilasters.
- **Chimney stack:** proud 1–2 from the side wall at z=12–13.
