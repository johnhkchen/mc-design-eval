# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Washington Monument and grounds: plan of form

Exterior only, no rooms. Coordinates are module coordinates (place box origin = x 0, z 0; module y 0 = world y 5).
North = low z, east = high x. Monument centre = (x 50, z 50). "r" = horizontal distance from (50.0, 50.0).

## SITE

| Item | Value |
|---|---|
| Lot | x 0..99, z 0..99, y 0..81 (hard ceiling y 81; apex is y 76) |
| Ground | every column: stone y 1..(h-4), dirt (h-3)..(h-1), surface block at y = h (h = the height map digit). Outer 2 rows/columns on every edge stay exactly at the mapped h. |
| Knoll | mapped levels 2 (box edges), 3, 4, 5 (summit plateau, about x 27..73, z 25..75). Keep the map; the summit plateau is y 5 and the whole plaza sits on it. |
| Lawn | grass_block surface everywhere not paved. 1-block terrace edges in lawn stay as mapped (gentle grassy steps); on walks they are softened (see Walks). |
| Mall axis | east-west (along x), through z 49..51 |

### Masses

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| Obelisk, lower shaft (pale) | 47..53 | 6..24 | 47..53 | solid 7x7, 19 courses |
| Obelisk, upper shaft 7-wide (cream) | 47..53 | 25..37 | 47..53 | solid 7x7 |
| Taper wash | perimeter ring of 7x7 | 38 | 47..53 | 24 stairs facing inward (corners as outer-corner stairs): a sloped half-step, not a ledge |
| Obelisk, upper shaft 5-wide (cream) | 48..52 | 38..68 | 48..52 | solid 5x5 |
| Pyramidion course 1 | ring of 5x5 = stairs facing inward; core 49..51 full | 69 | 48..52 | |
| Pyramidion course 2 | 49..51 full | 70 | 49..51 | |
| Pyramidion course 3 | ring of 3x3 = stairs facing inward; centre (50,50) full | 71 | 49..51 | |
| Pyramidion point | (50,50) full | 72 | 50 | |
| Pyramidion needle | (50,50) wall post | 73..74 | 50 | tapering post |
| Aluminium tip | (50,50) chain, axis y | 75..76 | 50 | dark tip; apex y 76 = 71 above plaza |
| Round plaza | all cells r < 10.5 (x 40..60, z 40..60) | surface y 5 | | paved, flush with the summit |
| Seating walls | ring cells 9.5 <= r < 10.5 | 6 | | 8 arcs; gaps 5 wide on the N, S, E, W axes and 3 wide on the 4 diagonals |
| Screening pavilion (S) | 54..58 | 6..8 | 49..52 | one-storey stone box against the obelisk's east face; walls y 6..7, flat roof y 8 |
| Flag ring walk | ring cells 15.5 <= r < 17.5 | surface y 5 | | paved band carrying the poles |
| Flagpoles (50) | at angle k*7.2 deg, k = 0..49: x = round(50 + 16 cos), z = round(50 + 16 sin) | pole 6..10, cap 11 | | flag hangs on the cap's outward face |
| Great ring walk | ring cells 31 <= r < 33 | follows h (mostly y 4) | | the curve around the knoll seen in the photo |
| Mall walks E and W | x 0..39 and x 61..99 | follow h | 49..51 | 3 wide, to the box edge (continue the Mall) |
| N and S walks | 49..51 | follow h | z 17..39 and 61..83 | 3 wide, plaza to great ring |
| Diagonal walks (4) | 2 wide, on the diagonals from r 17.5 out to 3 cells short of each corner | follow h | | NW, NE, SW, SE |
| Survey Lodge (L) | 83..85 | 3..5 | 98..99 | the in-plot part of the lodge (rest is beyond z 99); ground there is h 2 |
| Trees (12) | trunks at (8,10) (14,6) (6,18) (88,8) (92,16) (84,5) (7,84) (12,92) (6,76) (90,86) (86,93) (93,78) | trunk h+1..h+5, crown h+4..h+7 | | edges only; crowns radius 2, stay inside the box |

## ROOFS

| Roof | Form | Notes |
|---|---|---|
| Obelisk pyramidion | hand-built pyramid of stairs (courses above): 5 -> 3 -> 1 -> post -> tip over 8 courses | no roof preset; must be by hand, stairs all facing inward so each face reads as one slope |
| Screening pavilion | flat: y 8 smooth_stone_slab (bottom) field, perimeter polished_andesite full blocks as a thin parapet-coping at y 8 | by hand |
| Survey Lodge | low hip: y 5 stone_brick_stairs facing outward on its perimeter cells, ridge cell slab | by hand (partial lodge) |

## FACADES

**Obelisk (all four faces identical): dead plain, no trim, no plinth, no ornament.**

| Zone | y | Treatment |
|---|---|---|
| Lower third | 6..24 | smooth_quartz, every cell, flush |
| Colour line | between 24 and 25 | crisp: no overlap, no transition course |
| Upper shaft | 25..68 | horizontal courses alternating calcite (y odd) and smooth_sandstone (y even): averages to a warmer cream at distance, still a smooth flush face |
| Taper wash | 38 | smooth_sandstone_stairs on the 7x7 perimeter, facing in |
| Observation windows | 66 | two per face, tinted_glass flush in the face (positions in OPENINGS) |
| Aircraft warning lights | 67 | red_stained_glass in the centre cell of each face; glowstone in the core cell (50,67,50) behind |
| Pyramidion | 69..74 | smooth_sandstone_stairs / smooth_sandstone, sandstone_wall needle; chain tip 75..76 |

**Plaza:** field smooth_stone; banding rings of polished_andesite at 6.5 <= r < 7.5 and 9.5 <= r < 10.5 under the seating walls; the cells touching the obelisk (one ring around the 7x7) polished_andesite.
Seating walls: polished_andesite_slab (bottom) on y 6 in the 8 arcs; a lantern standing on the full block at each arc end (use a polished_andesite full block for each arc's two end cells, lantern on y 7).

**Screening pavilion:** walls polished_diorite y 6..7, flush, one material; east face is the entrance; parapet coping polished_andesite at y 8. Glass band on N and S faces.

**Flagpoles:** end_rod (facing up) y 6..10; cap white_concrete at y 11; on the cap's outward face (radial direction rounded to N/E/S/W) a white_wall_banner with patterns: red stripe_small, then blue square_top_left (stars-and-stripes read). At 2-cell spacing the ring reads as a crisp white fence of poles crowned by a red-white-blue band.

**Lodge:** stone_bricks walls y 3..4 throughout, hip of stone_brick_stairs at y 5.

## MATERIALS

| Role | Block |
|---|---|
| Obelisk lower third | smooth_quartz |
| Obelisk upper courses | calcite + smooth_sandstone (alternating courses) |
| Wash and pyramidion slopes | smooth_sandstone_stairs, smooth_sandstone (core), sandstone_wall (needle) |
| Tip | chain (axis y) |
| Observation windows | tinted_glass |
| Warning lights | red_stained_glass + glowstone behind |
| Plaza field | smooth_stone |
| Plaza bands, wall coping, obelisk surround | polished_andesite |
| Seating walls | polished_andesite_slab |
| Pavilion walls | polished_diorite; roof smooth_stone_slab; glass glass_pane |
| Walks | white_concrete_powder (on solid ground); steps smooth_stone_slab |
| Flagpoles | end_rod; cap white_concrete; flag white_wall_banner (red stripe_small, blue square_top_left) |
| Lamps | polished_andesite_wall post + lantern |
| Floodlights / in-ground lights | ochre_froglight flush in paving and lawn |
| Lawn | grass_block over dirt over stone |
| Trees | oak_log (axis y), oak_leaves persistent (dark green crowns) |
| Lodge | stone_bricks, stone_brick_stairs, stone_brick_slab |

All checked with `$MCD blocks --check` (none unknown, all in 1.21.1; no pale oak; chain not iron_chain).

## OPENINGS

| Opening | Cells |
|---|---|
| Obelisk N windows | (49,66,48), (51,66,48) tinted_glass |
| Obelisk S windows | (49,66,52), (51,66,52) |
| Obelisk W windows | (48,66,49), (48,66,51) |
| Obelisk E windows | (52,66,49), (52,66,51) |
| Warning lights | (50,67,48), (50,67,52), (48,67,50), (52,67,50) red_stained_glass |
| Obelisk door | none visible (the pavilion covers the east entrance) |
| Pavilion entrance | east face x 58, z 50..51, y 6..7: open 2 wide, 2 high |
| Pavilion glass bands | north face z 49 and south face z 52, x 55..57, y 7: glass_pane |
| Pavilion interior | air x 55..57, z 50..51, y 6..7; hanging lantern under the roof at (56,7,50) |
| Lodge window | (83,4,99) glass_pane slit on its west face |

## RESERVED (shell leaves these as air / surface for later parts)

| Cells | For |
|---|---|
| Flagpole cells (50 positions above) y 6..11 and the banner cell outward of each cap at y 11 | flag ring |
| Floodlights: (49..51, 5, 45), (49..51, 5, 55), (45, 5, 49..51), (54, 5, 47), (54, 5, 53) | ochre_froglight set in place of the plaza paving |
| Lawn lights: every cell with x mod 12 = 6 and z mod 12 = 6, unless paved, under a tree, or within 2 of an edge | ochre_froglight flush as the surface block |
| Lamp posts: along every walk, one cell beside the walk every 9 cells (both sides alternate), and at each walk's ends; y h+1 post, h+2 lantern | low lamps |
| Seating-wall arc ends, y 7 | standing lanterns |
| Tree trunk and crown cells | trees |

## FLOORS

| Level | y |
|---|---|
| Plaza, flag ring walk, obelisk base | 5 (obelisk starts y 6) |
| Pavilion floor | 5 (smooth_stone), clear height y 6..7, roof y 8 |
| Great ring walk | follows h (mostly 4) |
| Lodge floor | 2, walls y 3..4, roof y 5 |
| Walk steps | where a walk drops from h to h-1, the upper cell's edge stays and the first lower cell is a smooth_stone_slab (bottom) on top of it at y h: a half step, never a full block |

Obelisk is solid masonry (no interior). Nothing exceeds y 76; nothing leaves x 0..99, z 0..99.

---
# DESIGNER SECTIONS

## PALETTE (block ids exact; checked with `mcd blocks --check`)
- Obelisk: smooth_quartz (lower), calcite + smooth_sandstone (upper), smooth_sandstone_stairs, sandstone_wall (needle), tinted_glass, red_stained_glass, glowstone.
- Plaza: smooth_stone, polished_andesite, polished_andesite_slab, polished_andesite_stairs; pavilion polished_diorite, smooth_stone_slab, glass_pane.
- Walks: white_concrete_powder, smooth_stone_slab (bottom) half steps.
- Flags: end_rod (facing up), white_concrete, white_wall_banner (patterns: red stripe_small, blue square_top_left).
- Lamps: **andesite_wall** (polished_andesite_wall does NOT exist; use andesite_wall) + lantern hanging=false. Lights: ochre_froglight, lantern.
- Trees: oak_log axis y, oak_leaves persistent=true. Lodge: stone_bricks, stone_brick_stairs, stone_brick_slab.
- Ground: grass_block, dirt, stone.
- **chain**: the tool (v26.3) knows only iron_chain, but the server is 1.21.1 where the block is `chain`. Place `chain` in the final nbt; if the checker rejects it, place iron_chain and swap at delivery (never ship iron_chain).

## VOCABULARY
- groundColumn(g,x,z,h): stone 1..h-4, dirt h-3..h-1, grass_block h.
- shaftCourse(g,y,x0,z0,x1,z1,mat): fill solid rect; mat = smooth_quartz y<=24; calcite if y odd else smooth_sandstone for y>=25.
- taperRing(g,y=38): 24 smooth_sandstone_stairs on the 7x7 perimeter, facing inward (N side facing south, etc.), corners outer-corner shape; interior 5x5 solid smooth_sandstone.
- obsWindows(g): tinted_glass at the 8 window cells y66, red_stained_glass at 4 face centres y67, glowstone (50,67,50).
- pyramidCourse(g): per plan Masses rows y69-76; ring stairs half bottom, facing = toward centre.
- plazaDisc(g,r0,r1,block): set y5 cells with r in [r0,r1) (r = hypot(x-50,z-50)).
- seatingArc(g): y6 slab on ring cells in arc, except the gap cells (angle within gap half-widths 2.5/1.5 cells of axis/diagonal); end cells full polished_andesite with lantern y7.
- pavilionBox(g): as elements #12; entrance cells air.
- flagPole(g,k): x=round(50+16cos(7.2k°)), z=round(50+16sin); end_rod y6..10, cap y11, banner at cap's outward neighbour, wall facing outward, y11, patterns [stripe_small red, square_top_left blue]. Skip any cell colliding with a path decor; poles on ring walk.
- floodlight(g,x,z): replace the surface block with ochre_froglight.
- walkCell(g,x,z): surface = white_concrete_powder, y=h, only where solid below; at h-1 neighbour drops use smooth_stone_slab bottom on upper cell.
- lampPost(g,x,z): andesite_wall y h+1, lantern y h+2.
- oakTree(g,x,z,h): trunk h+1..h+5, irregular leaf crown radius 2 y h+4..h+7 persistent.
- lodgeHip(g): walls, stair hip, ridge slab.

## ROOMS
None. The build is exterior only (obelisk solid, pavilion is a 3x2 glazed kiosk with no designed interior beyond its lantern). Rooms: [].

## PARTS
1. Ground and knoll (parts/ground.mjs): all columns from the height map; outer 2 rings exact.
2. Obelisk (parts/obelisk.mjs): elements 2-9. The dead-straight, plain shaft; check colour line at y24/25.
3. Plaza and pavilion (parts/plaza.mjs): elements 10-12.
4. Flag ring and lighting (parts/flags.mjs): elements 13-15, 21 at the base.
5. Walks, lamps, lawn lights, trees (parts/walks-trees.mjs): 16-19.
6. Survey Lodge (parts/lodge.mjs): element 20, and a final no-spawn check.

## Checklist
- [ ] ground  - [ ] obelisk  - [ ] plaza+pavilion  - [ ] flags  - [ ] walks/trees  - [ ] lodge

## Notes for workers
- The obelisk must be smooth: no buttresses, no ornament. Staying within y<=76, x/z 0..99. Never write where another part owns (flags on ring walk need walks part to leave pole cells free: walks skip cells of poles).
- Build order matters: ground first, then everything on top; walks only on solid ground.
- Light: froglights flush; no dark spawnable lawn (lawn lights every 12 + lamps).
- No signs, no villagers.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (module coords; y 0 = world 5; plaza surface y 5)

Tick each when built. "Part" = PARTS in plan.md. Vocab = helper in VOCABULARY.

| # | Element | Construction (block by block) | Coordinates | Part | Vocab |
|---|---|---|---|---|---|
| 1 | Ground / knoll | per column: stone y1..h-4, dirt h-3..h-1, grass_block at h (map digit); outer 2 edge rings exactly h | whole box | 1 | groundColumn |
| 2 | Lower shaft, pale | smooth_quartz solid 7x7, flush, no trim | x47..53 z47..53 y6..24 | 2 | shaftCourse |
| 3 | Colour line | crisp: y24 quartz, y25 first cream course; no transition | y24/25 | 2 | shaftCourse |
| 4 | Upper shaft 7-wide | alternating courses: calcite (y odd), smooth_sandstone (y even), solid | y25..37 | 2 | shaftCourse |
| 5 | Taper wash | ring of the 7x7 at y38: smooth_sandstone_stairs facing inward, corners as outer-corner stairs (shape outer_left/right); centre 5x5 solid cream | y38 | 2 | taperRing |
| 6 | Upper shaft 5-wide | calcite/sandstone courses solid 5x5 | x48..52 z48..52 y38..68 | 2 | shaftCourse |
| 7 | Observation windows | tinted_glass flush, 2 per face | y66 per OPENINGS | 2 | obsWindows |
| 8 | Aircraft warning lights | red_stained_glass centre of each face y67, glowstone core (50,67,50) | y67 | 2 | obsWindows |
| 9 | Pyramidion | stairs facing inward y69 ring, core full; y70 3x3 full; y71 ring stairs, centre full; y72 full; sandstone_wall y73..74; chain axis y y75..76 (dark tip) | x48..52 | 2 | pyramidCourse |
| 10 | Round plaza | smooth_stone r<10.5 at y5, polished_andesite bands r 6.5-7.5, 9.5-10.5, ring touching obelisk | x40..60 z40..60 | 3 | plazaDisc |
| 11 | Seating walls | polished_andesite_slab bottom y6, ring 9.5<=r<10.5, 8 arcs, gaps 5 wide N/S/E/W, 3 wide diagonals; arc end cells polished_andesite full, lantern on y7 | r~10 | 3 | seatingArc |
| 12 | Screening pavilion | polished_diorite walls y6..7, flat roof y8 smooth_stone_slab field + polished_andesite coping, glass_pane bands N/S x55..57 y7, east door 2x2 at x58 z50..51, hanging lantern (56,7,50), floor smooth_stone | x54..58 z49..52 | 3 | pavilionBox |
| 13 | Flag ring (50) | end_rod up y6..10, white_concrete cap y11, white_wall_banner outward of cap with red stripe_small + blue square_top_left; paved ring walk 15.5<=r<17.5 white_concrete_powder at y5 | r=16 | 4 | flagPole |
| 14 | Flag lighting | ochre_froglight flush in the ring walk under each pole's base | beside poles | 4 | floodlight |
| 15 | Base floodlights | ochre_froglight replacing paving | per RESERVED | 4 | floodlight |
| 16 | Walks | white_concrete_powder on solid ground (never over air); Mall E/W 3 wide z49..51, N/S 3 wide, 4 diagonals 2 wide, great ring r31..33; half steps smooth_stone_slab bottom | per plan | 5 | walkCell |
| 17 | Lamps | andesite_wall post + lantern (standing), one every 9 cells beside walks | walks | 5 | lampPost |
| 18 | Lawn lights | ochre_froglight surface cell at x%12=6,z%12=6 on lawn | lawn | 5 | floodlight |
| 19 | Trees (12) | oak_log axis y h+1..h+5, oak_leaves persistent crown r2 h+4..h+7, not a perfect sphere | RESERVED list | 5 | oakTree |
| 20 | Survey Lodge | stone_bricks walls y3..4, stone_brick_stairs hip y5 facing outward, ridge slab, glass_pane (83,4,99) | x83..85 z98..99 | 6 | lodgeHip |
| 21 | No-spawn lighting | every dark surface has a light source within ~7 (froglights, lanterns) | whole | 4-5 | floodlight |
```

### rooms.json

```json
{"entrance":[59,5,50],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "obelisk_lower": ["smooth_quartz"],
    "obelisk_upper": ["calcite", "smooth_sandstone"],
    "pyramidion": ["smooth_sandstone_stairs", "smooth_sandstone", "sandstone_wall"],
    "tip": ["chain"],
    "window": ["tinted_glass"],
    "warning": ["red_stained_glass", "glowstone"],
    "plaza": ["smooth_stone", "polished_andesite", "polished_andesite_slab", "polished_andesite_stairs"],
    "pavilion": ["polished_diorite", "smooth_stone_slab", "glass_pane"],
    "walk": ["white_concrete_powder", "smooth_stone_slab"],
    "flag": ["end_rod", "white_concrete", "white_wall_banner"],
    "lamp": ["andesite_wall", "lantern"],
    "light": ["ochre_froglight"],
    "ground": ["grass_block", "dirt", "stone"],
    "tree": ["oak_log", "oak_leaves"],
    "lodge": ["stone_bricks", "stone_brick_stairs", "stone_brick_slab"]
  },
  "objects": ["chain", "tinted_glass", "red_stained_glass", "glowstone", "end_rod", "white_wall_banner", "andesite_wall", "lantern", "ochre_froglight", "glass_pane"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build to a temp file in this directory, then move it into place.
set -e
cd "$(dirname "$0")"
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// The Washington Monument grounds (plan.md): the ground, then the six parts in order, saved to argv[2].
// The ground is laid before runParts so later parts may replace its surface (walks, plaza, floodlights); runParts locks
// each part's blocks from the parts after it, reports off-palette ids, and lays roof.json after the first part once it exists.
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SIZE } from "./vocab/base.mjs";

// A part whose file is not written yet (its worker is still on it) is a no-op, so make.sh never fails on a missing part.
async function partBuild(module) {
  const url = new URL(module, import.meta.url);
  if (!existsSync(url)) return () => {};
  return (await import(url.href)).build ?? (() => {});
}

const out = process.argv[2] ?? "build.nbt";
const g = new Grid(SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });

(await partBuild("./parts/ground.mjs"))(g);

const parts = [
  ["obelisk", "./parts/obelisk.mjs"],
  ["plaza and pavilion", "./parts/plaza.mjs"],
  ["flag ring and floodlights", "./parts/flags.mjs"],
  ["walks, lamps, lawn lights and trees", "./parts/walks-trees.mjs"],
  ["survey lodge", "./parts/lodge.mjs"],
];
const list = await Promise.all(parts.map(async ([name, module]) => [name, await partBuild(module)]));
runParts(g, list, { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Site constants, palette names and a seeded rng for the Washington Monument grounds (plan.md). Every block id here is in
// palette.json; every coordinate is module coordinates (x 0..99, z 0..99, module y 0 = world y 5).

// ---- site ----------------------------------------------------------------------------------------------------------

// ---- site ----------------------------------------------------------------------------------------------------------
export const SIZE = [100, 82, 100];                   // the full lot: x 0..99, y 0..81 (hard ceiling), z 0..99

export const CENTRE = { x: 50, z: 50 };               // the monument's centre column (r = 0)

export const PLAZA_Y = 5;                             // summit plateau: plaza, flag ring walk, obelisk base

export const EDGE_RINGS = 2;                          // the outer rings of the lot stay exactly at the mapped height

export const OBELISK = { x0: 47, x1: 53, z0: 47, z1: 53, apexY: 76 };   // 7x7 footprint, apex y 76 (71 above the plaza)

export const OBELISK_LOWER_TOP = 24;                  // smooth quartz to y 24, colour line between 24 and 25

export const OBELISK_WASH_Y = 38;                     // taper ring: 7x7 perimeter stairs step in to the 5x5 shaft

export const OBELISK_NARROW_TOP = 68;                 // 5x5 shaft top; pyramidion starts at y 69

export const OBELISK_WINDOW_Y = 66;                   // observation windows (tinted glass)

export const OBELISK_LIGHT_Y = 67;                    // aircraft warning lights (red glass, glowstone core)

export const PLAZA_R = 10.5;                          // plaza disc: all cells with r < 10.5

export const PLAZA_BANDS = [[6.5, 7.5], [9.5, 10.5]]; // polished andesite rings under the seating walls

export const SEATING = { r0: 9.5, r1: 10.5, y: 6, gapAxis: 2.5, gapDiagonal: 1.5 }; // 8 arcs; gap half-widths in cells

export const PAVILION = { x0: 54, x1: 58, z0: 49, z1: 52, floorY: 5, wallTop: 7, roofY: 8, entranceX: 58, entranceZ: [50, 51] };

export const FLAG_RING = { r0: 15.5, r1: 17.5 };      // flag ring walk, surface y 5

export const FLAG_R = 16;                             // flagpole ring radius

export const FLAG_POLES = 50;                         // poles at angle k * 7.2 degrees, k = 0..49

export const POLE_TOP_Y = 10;                         // end rod y 6..10, cap y 11

export const FLAG_PATTERNS = [["stripe_small", "red"], ["square_top_left", "blue"]];

export const FLOODLIGHTS = [[49, 5, 45], [50, 5, 45], [51, 5, 45], [49, 5, 55], [50, 5, 55], [51, 5, 55],

export const MALL_WALK_Z = [49, 51];                  // E and W Mall walks (x 0..39 and 61..99), 3 wide

export const N_S_WALK_X = [49, 51];                   // N and S walks (z 17..39 and 61..83), 3 wide

export const GREAT_RING = { r0: 31, r1: 33 };         // great ring walk, follows h (mostly 4)

export const LAMP_EVERY = 9;                          // lamp post every 9 cells along each walk, alternating sides

export const LAWN_LIGHT_EVERY = 12;                   // lawn froglight at x mod 12 = 6 and z mod 12 = 6

export const TREES = [[8, 10], [14, 6], [6, 18], [88, 8], [92, 16], [84, 5], [7, 84], [12, 92], [6, 76], [90, 86],

export const LODGE = { x0: 83, x1: 85, z0: 98, z1: 99, floorY: 2, wallTop: 4, roofY: 5, slit: [83, 4, 99] };

// Ground surface y, one base-36 digit per cell from the brief's height map (rows z 0..99, columns x 0..99).
export const HEIGHT_ROWS = [

/** Ground surface y at (x, z): the height map digit. */
export const heightAt = (x, z) => ...

/** Horizontal distance from the monument's centre column, in cells: r = hypot(x - 50, z - 50). */
export const radiusAt = (x, z) => ...

// ---- palette (palette.json ids; chain is the 1.21.1 id, which the toolkit's blocks check does not know) ------------
export const SMOOTH_QUARTZ = "smooth_quartz";                   // obelisk lower third

export const CALCITE = "calcite";                               // obelisk upper courses, odd y

export const SMOOTH_SANDSTONE = "smooth_sandstone";             // obelisk upper courses, even y; pyramidion core

export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs"; // taper wash and pyramidion slopes

export const SANDSTONE_WALL = "sandstone_wall";                 // pyramidion needle

export const CHAIN = "chain";                                   // aluminium tip, axis y

export const TINTED_GLASS = "tinted_glass";                     // observation windows

export const RED_STAINED_GLASS = "red_stained_glass";           // aircraft warning lights

export const GLOWSTONE = "glowstone";                           // warning light core behind the glass

export const SMOOTH_STONE = "smooth_stone";                     // plaza field and pavilion floor

export const POLISHED_ANDESITE = "polished_andesite";           // plaza bands, seating ends, obelisk surround

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab"; // seating walls

export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs"; // plaza stair courses

export const POLISHED_DIORITE = "polished_diorite";             // pavilion walls

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";           // pavilion roof field; walk half steps

export const GLASS_PANE = "glass_pane";                         // pavilion glass bands

export const WHITE_CONCRETE_POWDER = "white_concrete_powder";   // walks

export const END_ROD = "end_rod";                               // flagpoles

export const WHITE_CONCRETE = "white_concrete";                 // flagpole caps

export const WHITE_WALL_BANNER = "white_wall_banner";           // flags

export const ANDESITE_WALL = "andesite_wall";                   // lamp posts (polished_andesite_wall does not exist)

export const LANTERN = "lantern";                               // lamp tops, seating lanterns, pavilion lantern

export const OCHRE_FROGLIGHT = "ochre_froglight";               // floodlights and lawn lights

export const OAK_LOG = "oak_log";                               // tree trunks, axis y

export const OAK_LEAVES = "oak_leaves";                         // tree crowns, persistent

export const STONE_BRICKS = "stone_bricks";                     // lodge walls

export const STONE_BRICK_STAIRS = "stone_brick_stairs";         // lodge hip

export const STONE_BRICK_SLAB = "stone_brick_slab";             // lodge ridge

export const GRASS_BLOCK = "grass_block";                       // lawn surface

export const DIRT = "dirt";                                     // ground under the surface

export const STONE = "stone";                                   // ground core

// ---- seeded rng ---------------------------------------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed)() gives a float in [0, 1); the same seed gives the same sequence. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Vocabulary helpers h1 (plan.md VOCABULARY): ground, obelisk, plaza, pavilion, flags, walks, lamps, trees, lodge.
// Every helper takes its position as arguments and returns the number of blocks it placed.
// Writes go into air only; pass { over: true } for the few that replace a surface or a flush wall block
// (plazaDisc, obsWindows, floodlight, walkCell). Nothing is written outside the helper's own footprint.

/** Ground column at x,z up to surface h: stone 1..h-4, dirt h-3..h-1, grass_block h. */
export function groundColumn(g, x, z, h, { over = false } = {})

/** Taper wash at height y on the rectangle x0..x1, z0..z1: stairs on the perimeter facing in, solid core. */
export function taperRing(g, y, x0, z0, x1, z1, { over = false } = {})

/**
 * One pyramidion from base height y (plan: y 69): 5x5 stair ring over a 3x3 core, 3x3 core, 3x3 stair ring over a
 * point, the point, a sandstone_wall needle (y+4..y+5) and the chain tip (y+6..y+7). Centre column at cx, cz.
 */
export function pyramidCourse(g, cx, y, cz, { over = false } = {})

/** One course of the shaft over x0..x1, z0..z1 at y. mat defaults by height: quartz to y24, then calcite (odd) / sandstone (even). */
export function shaftCourse(g, y, x0, z0, x1, z1, mat, { over = false } = {})

/** Observation windows (y66) and aircraft warning lights (y67) on the 5x5 shaft centred at cx, cz; needs over (the shaft is solid there). */
export function obsWindows(g, cx, cz, { over = false } = {})

/** Paving disc on the single layer y: cells with r0 <= distance from cx,cz < r1 set to block. Replaces the surface, so needs over. */
export function plazaDisc(g, cx, cz, y, r0, r1, block, { over = false } = {})

/**
 * Seating wall at y (plan: 6) on the ring 9.5 <= r < 10.5 round cx,cz: polished_andesite_slab, gaps 5 wide on the
 * N/S/E/W axes and 3 wide on the diagonals, the two cells at each arc end a full polished_andesite with a lantern on y+1.
 */
export function seatingArc(g, cx, cz, y, { over = false } = {})

/**
 * Screening pavilion, 5 long and 4 wide, base y (plan: 6), roof y+2. facing is the entrance side: the 2-wide
 * opening sits in the middle of that end. Walls are polished_diorite, glass_pane bands on the two long faces,
 * a hanging lantern under the roof, flat smooth_stone_slab roof with a polished_andesite coping.
 */
export function pavilionBox(g, x0, y, z0, facing = "east", { over = false } = {})

/**
 * Flagpole k of a ring of count poles (default 50) round cx,cz at radius r, base surface y (plan: 5): end_rod
 * y+1..y+5, white_concrete cap y+6, and a white_wall_banner on the cap's outward face (red stripe_small, blue square_top_left).
 */
export function flagPole(g, k, cx, cz, r, y, { over = false, count = 50 } = {})

/** Flush ochre_froglight at x,y,z (replaces the surface block there, so needs over). */
export function floodlight(g, x, y, z, { over = false } = {})

/**
 * Walk surface at y (the ground's top block): white_concrete_powder, only over solid ground. A cell with a
 * neighbour one block higher is the first step down, so it takes a smooth_stone_slab (bottom) on top at y+1.
 */
export function walkCell(g, x, y, z, { over = false } = {})

/** Lamp post on the ground at y: andesite_wall post at y+1, standing lantern at y+2. */
export function lampPost(g, x, y, z, { over = false } = {})

/**
 * Oak tree rooted on the ground at y: trunk y+1..y+5, leaves y+4..y+7 in a ragged radius-2 crown (outer cells
 * dropped on a fixed pattern, so it is not a sphere). Leaves are persistent.
 */
export function oakTree(g, x, y, z, { over = false } = {})

/**
 * Survey Lodge, the part inside the plot: a 3x2 footprint at x0..x0+2, z0..z0+1, walls stone_bricks at y0..y0+1
 * with a glass_pane slit on the west face, roof at y0+2: stair hip on the north row (outer corners at the ends),
 * stone_brick_slab ridge on the south row (the lodge continues past z0+1).
 */
export function lodgeHip(g, x0, y0, z0, { over = false } = {})
```

### vocab/h2.mjs

```js
// Vocabulary helpers, part 2 (plan.md VOCABULARY): shaftCourse, obsWindows, plazaDisc, pavilionBox, floodlight, lampPost,
// lodgeHip. Every helper takes its position as arguments and writes only its own footprint: into air, unless opts.replace
// is set, which overwrites cells of that footprint and nothing else. Nothing here writes ground, sand or floor under its
// footprint. Blocks are plan.md's PALETTE ids; states are the 1.21.1 names the toolkit validates.

/**
 * One solid course of the obelisk shaft over x0..x1 by z0..z1 at height y. mat: the block; omitted, the plan's rule
 * (smooth quartz to y 24, then calcite on odd courses and smooth sandstone on even ones from y 25).
 */
export function shaftCourse(g, y, x0, z0, x1, z1, mat, opts = {})

/**
 * The observation face of the obelisk around its centre column (cx, cz), inside the 5-wide shaft: two tinted-glass
 * windows per face at yWin (flush, in the face), a red warning light at the centre of each face at yLight, and a
 * glowstone core behind the lights. The windows and core replace the shaft's own cells: call it after the courses
 * with { replace: true }.
 */
export function obsWindows(g, cx, cz, yWin, yLight, opts = {})

/**
 * A round disc of one block at height y: every cell with r0 <= r < r1, r measured from the centre (cx, cz). The plaza
 * paves over the ground's grass surface at y 5, so call it with { replace: true }.
 */
export function plazaDisc(g, y, cx, cz, r0, r1, block, opts = {})

/**
 * The one-storey screening pavilion on the footprint x0..x1 by z0..z1 (4 deep in z), standing on the plaza at floor y0.
 * Walls of polished diorite at y0+1..y0+2, with glass panes across the top course of the north and south faces; a door
 * 2 wide and 2 high in the x face named by facing ("east" or "west"); a flat roof at y0+3 (smooth stone slab field,
 * polished andesite coping); a lantern hanging under the roof at the room's centre. The floor at y0 is the plaza's and
 * is not written.
 */
export function pavilionBox(g, x0, z0, x1, z1, y0, facing = "east", opts = {})

/** One flush ochre froglight at (x, y, z): the paving or lawn cell it replaces (opts.replace), or an air cell. */
export function floodlight(g, x, y, z, opts = {})

/**
 * A low lamp beside a walk: an andesite wall post at h+1 with a standing lantern on it at h+2, where h is the ground's
 * surface at (x, z). Writes nothing unless there is solid ground at h, so a lamp never floats.
 */
export function lampPost(g, x, z, h, opts = {})

/**
 * A small survey lodge on x0..x1 by z0..z1, standing on floor yFloor: stone brick walls round the perimeter at
 * yFloor+1..yFloor+2; a low hip of stone brick stairs at yFloor+3 on the perimeter, facing outward (a corner takes its
 * north or south row's facing); a ridge slab on any interior roof cell. opts.slit: [x, y, z], one wall cell made a
 * glass pane (a slit on the east or west face runs north-south, on the north or south face east-west).
 */
export function lodgeHip(g, x0, z0, x1, z1, yFloor, opts = {})
```

## The build library (/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs): outline

### build.mjs (library)

```js
// Authoring builds as CODE: design one bay, tile it; mirror for symmetry; protect function with a guard.
// Coordinate bookkeeping is where design time and errors go — write a short generator script with these helpers
// instead of typing hundreds of coordinates.
//
//   import { load, Grid, guard, tile, mirrorX, B, face } from "<plugin>/tools/src/build.mjs"
//   const g = guard(load("in.nbt"))                 // refuses writes into functional cells (see check.mjs)
//   runParts(g, [["shell", shellPart], ["porch", porchPart]], { palette: "palette.json" })  // later parts only add
//   tile(g, { from: 1, step: 4, count: 5, axis: "z" }, (z) => bay(g, z))
//   g.save("out.nbt")

// ---- directions -------------------------------------------------------------------------------------------------
export const DIRS = { north: [0, 0, -1], south: [0, 0, 1], west: [-1, 0, 0], east: [1, 0, 0] };

export const OPPOSITE = { north: "south", south: "north", east: "west", west: "east", up: "down", down: "up" };

export const face = {
  opposite: (f) => ...
  cw: (f) => ...
  ccw: (f) => ...
  mirrorX: (f) => ...
  mirrorZ: (f) => ...
};

// ---- block helpers: return [block, state] pairs for g.set(x, y, z, ...B.stairs(...)) ----------------------------
// Stairs `facing` = the side of the full-height back; a cornice/bracket lip toward the street uses
// facing = the INWARD direction with half: "top".
export const B = {
  stairs: (mat, facing, half = "bottom", shape = "straight") => ...
  slab: (mat, type = "bottom") => ...
  log: (mat, axis = "y") => ...
  wood: (mat, axis = "y") => ...
  pillar: (block, axis = "y") => ...
  trapdoor: (mat, facing, half = "bottom", open = false) => ...
  door: (mat, facing, half = "lower", hinge = "left") => ...
  fence: (mat) => ...
  wall: (mat) => ...
  pane: (block = "glass_pane") => ...
  lantern: (hanging = false) => ...
  chain: (axis = "y", version26 = true) => ...
  wallTorch: (facing) => ...
  block: (name) => ...
  banner: (color, patterns = [], { wall = true, facing = "north", rotation = 0, legacy = false } = {}) => ...
  sign: (wood = "oak", lines = [], { wall = true, facing = "north", rotation = 0, hanging = false, color = "black", glow = false, back = [], dataVersion = 4189 } = {}) => ...
};

// ---- placement helpers ------------------------------------------------------------------------------------------
/** Call fn(pos, i) for count positions from `from`, `step` apart (the bay rhythm). */
export function tile(_g, { from = 0, step, count, to }, fn)

/** Run `paint(set)` twice: as written, and mirrored across x = cx (x' = 2cx - x), flipping east/west facings. */
export function mirrorX(g, cx, paint)

export function mirrorZ(g, cz, paint)

/** Hollow box: walls (and optional floor/ceiling) of a cuboid. */
export function shell(g, a, b, block, { floor = true, ceiling = true, state } = {})

/** Set a box to air (carving). Air is stored, so it clears the cell when the structure is placed. */
export const carve = (g, a, b) => ...

/** Replace only where the current block matches `from` (a name or a predicate). */
export function replace(g, a, b, from, block, state)

/**
 * Wrap a grid so writes into protected cells are refused (counted, never thrown), so a decor script cannot
 * break function. protect: Set of "x,y,z" — default: the grid's own functional cells and the cells that must stay
 * clear around them (check.mjs functionalCells). `g.refused` lists what was blocked; report it.
 */
export function guard(g, protect)

/**
 * Draw blocks from text, the way Litematica stores a schematic (a palette, then one index per cell): one character per
 * block, a legend for the characters. Far fewer tokens than a set() per block, and the layout is visible as written.
 *   layers(g, [x, y, z], { "#": "oak_planks", "b": ["red_bed", { facing: "south", part: "head" }], "c": "chest" }, [
 *     ["#####", "#b c#", "#b  #"],      // y: rows run along +x, successive rows along +z
 *     ["#####", "#   #", "#   #"],      // y + 1 ...
 *   ])
 * A single layer may be passed as one array of rows. Characters not in the legend (space, ".") are left as they are.
 * Writes go through g.set, so runParts' lock and palette report apply. Returns the number of blocks placed.
 */
export function layers(g, [x0, y0, z0], legend, rowsOrLayers)

/**
 * Run a build's parts in order so each part can only ADD to what earlier parts built: a write into a cell an earlier
 * part placed (air included, so no carving) is refused, counted, never thrown, so a later part can't knock holes in
 * a wall. Cells set before runParts (the ground) stay writable: farmland and paths may replace grass. With a palette
 * (palette.json, or its object: { roles: { role: [blocks] }, objects: [blocks] }), every block placed outside it is
 * reported. Prints one line per part, writes the reports to `report` (default parts-report.json; null for none) and
 * returns them.
 * roof: a roof spec (roof.json, as for `mcd roof --spec`) laid right after the FIRST part (the shell), so every later
 * part builds around the finished roof instead of the roof tool clearing the attic, gables and lofts after them. No
 * file yet (the roof part writes it, maybe in another copy at the same time): skipped with a note, never an error.
 * sockets.json in the working directory (or reserve: a layout or path; null for none) reserves the redstone shops'
 * envelopes: every write into one is refused. A part given { carve: true } (the stair joiner) may cut through earlier parts' floors and ceilings for its
 * stairwells: cells with air straight above or below. Walls stay refused.
 *   runParts(g, [["shell", shell.build], ["stairs", stairs.build, { carve: true }], ["garden", garden.build]],
 *     { palette: "palette.json", roof: "roof.json" })
 */
export function runParts(g, list, { palette, roof, reserve, log = console.log, report = "parts-report.json" } = {})

/** Lettering in a band: plaque(g, "LEAGUE HALL", { at, face, width, height, letter?, material?, frame?, style?, relief? }) */
export const plaque = (g, text, o) => ...

/** A bed, both halves: foot at [x,y,z], the head one step toward facing (the pillow end), same colour and facing.
 *  Both cells must be air (a bed never replaces a wall block); the head goes against a solid wall, never a window or
 *  a door. Returns true when placed, false (placing nothing) when a cell is taken. */
export const bed = (g, [x, y, z], facing, color = "red") => ...

/** A straight flight of stairs a player walks up without jumping: from = the first step's cell (standing on the lower
 *  floor), facing = the way you walk up, to = the y of the UPPER FLOOR's own block layer. The last step is set in that
 *  layer, flush with the floor you step out onto, so a storey of h (floor to floor) takes h steps. Clears 2 blocks of
 *  headroom over every step (cutting the floor above where the flight passes) and hangs an upside-down stair under each
 *  step as a stringer. width runs to the right of facing. Returns { steps, landing: [x,y,z] (feet on the upper floor), notes }. */
export const flight = (g, { from: [x, y, z], facing, to, material = "oak", width = 1, stringer = true }) => ...

/** A hearth and its chimney: the fire at the BOTTOM, smoke up a flue, the stack set INTO the wall so the room loses no
 *  space. Give wall = [x, floor level, z], a cell of the outside wall at the hearth's floor level, and into = the side the
 *  room is on: the campfire goes one cell OUTSIDE the wall (an exterior chimney), the wall cell becomes the hearth's
 *  mouth with a lintel over it, and the flue rises outside the wall with the house wall as its room side. (Or give
 *  at = the campfire's cell and open = the side its mouth faces, for an interior chimney set into a partition.)
 *  top = the flue's last course (1-2 over the roof where it leaves it; the mouth is open above). The flue is a 1 x 1
 *  column of air walled on all four sides at every level: the house wall below the roof, and from the roof up the
 *  chimney's own masonry (never the roof's tiles), or with thin: "iron" | "copper" | a wood, an open trapdoor lying
 *  flat against the flue where there is only air beside it (a slim pipe above the roof). Build it after the roof.
 *  It lays its own footing down to the ground and overwrites what is in its cells: call it directly, never through a
 *  helper that writes only into air (that helper refuses the whole stack over one filled cell). */
export const chimney = (g, { wall, into, at, open = "south", top, material = "bricks", thin = null, lintel = true, roofY }) => ...

/** A window shutter: an open trapdoor in the cell in front of the wall (on the face side), lying flat against it.
 *  face: the way the wall looks (north for a north front); the trapdoor's facing is the face, so it lies on the wall. */
export const shutter = (g, [x, y, z], face, wood = "spruce", { height = 1 } = {}) => ...

/** A word in banner letters hung on a board, in reading order for its face: bannerWord(g, "BUTCHER", { center: [14, 10, 4], face: "north" }). */
export const bannerWord = (g, word, o) => ...

/** The sockets' fit-out (glass wall lines and back walls, spawn-proof pit floor, counters): fitSockets(g, layout, { counter, glass }) */
export const fitSockets = (g, layout, o) => ...

/** A clock face on a tower: clock(g, { center, face, radius?: 2-4, dial?, bezel?, hands?, time?: "10:10", out?: 0|1 }) */
export const clock = (g, o) => ...

/** A shop sign: signboard(g, "BAKERY", { at, face, mode: "wall"|"hanging", width?, height?, wood? }) */
export const signboard = (g, text, o) => ...

/** Banners along a row: bunting(g, { from, to, face, colors?, every?, pattern? }) */
export const bunting = (g, o) => ...

/** A profiled pilaster: pilaster(g, { at, face, height, width?, out?, material?, profile?, shoulder? }) */
export const pilaster = (g, o) => ...

/** An opening surround: surround(g, { at, face, width, height, preset?, trim?, keystone?, reveal?, door?, arch? }) */
export const surround = (g, o) => ...

/** Glazing: glazing(g, { at, face, width, height, preset: grid|shopfront|transom|sidelights, frame?, door? }) */
export const glazing = (g, o) => ...

/** A light fitting: fixture(g, { at, face, mount: bracket|arm|top|hang, lamp? }) */
export const fixture = (g, o) => ...

/** A planter: planter(g, { at, face, width, kind: box|ground, depth?, plants? }) */
export const planter = (g, o) => ...
```

## The toolkit reference (references/toolkit.md)

# Toolkit reference

`MCD="node ${CLAUDE_PLUGIN_ROOT}/tools/bin/mcd.mjs"` — pure Node 20+, no install. First use downloads the
Minecraft client jar for the needed version from Mojang (sha1-verified) into `~/.cache/minecraft-design/`, or
uses `$MC_CLIENT_JAR`, the official launcher's or Prism Launcher's local jars. Nothing copyrighted ships here.

## Coordinates and facing (read this once)

- Files: every command reads a structure `.nbt` or a Litematica `.litematic` (all regions, in one box); `g.save()`
  and `mcd convert` write either, by extension. Block-entity data and entities survive both ways.
- Structure-local: `x` east, `y` up, `z` south. `0 ≤ x < size[0]` etc.
- Conventional front for new builds: **north (−z)**, the street at `z < 0`. `mcd render` auto-detects the front
  from exposed windows/doors; override with `--front n|s|e|w`.
- Walking into a building that faces north, you face **south (+z)**; east (+x) is on your **left**.
- `facing` on blocks:
  - **stairs**: the side of the full-height back. A cornice/bracket whose lip points at the street:
    `half: "top"`, `facing` = the direction *into* the wall. A roof slope rising to the north: `facing: "north"`.
  - **trapdoor**: the side it hinges from when open; closed `half: "top"` sits in the top of the cell.
  - **wall torch / wall sign / wall banner**: the direction it *points out* (away from the wall).
  - **repeater / comparator**: `facing` points toward the *input* (signal flows the opposite way).
  - **logs**: `axis: x|y|z`.
- `mcd states <block>` lists every valid property and value for a block in the target version; `mcd blocks
  --grep <re>` lists valid ids (ids change: 26.x renamed `chain` → `iron_chain`); `mcd blocks --check a,b,c` says
  which ids are real and suggests near names for the rest. Use them instead of guessing.
- `mcd walk build.nbt --rooms rooms.json` floods the cells a player can stand in (jump one up with headroom, drop up
  to three, through doors and gates, up ladders, vines, scaffolding and water columns such as a soul-sand water
  elevator) from the entrance and says, per room box, whether it's reached, unreachable, or
  partly blocked by furniture. rooms.json: `{"entrance": [x,y,z], "rooms": [{"name", "box": [x0,y0,z0,x1,y1,z1]}]}`.
- `mcd rooms build.nbt --rooms rooms.json [--only name,...] [--out rooms.png]` shows every room: a dollhouse view
  (everything above the room cut away, from a front corner) and, for rooms 5+ wide both ways, an eye view inside.
- `layers(g, [x, y, z], legend, rows)` (build library) draws blocks from text the way Litematica stores them: a
  legend of characters, one character per block, rows along +x, successive rows along +z, layer by layer. Use it for any
  layout of many different blocks (a furnished room, a facade panel); it costs a fraction of a set() per block.
  `mcd plan build.nbt --rooms rooms.json [--only name]` prints each room's floor as that grid ('#' wall, 'D' doorway,
  'W' window, 'o' already there, '.' free floor) with the origin to pass to layers().
- `mcd room build.nbt --rooms rooms.json --only "<room>"` is a room designer's one check after each rebuild: the walk
  verdict with the floor cells a player can't reach (marked `x` on the floor grid, which shows the furniture as `o`),
  the light levels at the feet, and lantern spots (hanging under the ceiling where there's headroom, else against a
  wall) that would lift the dark and dim cells to 8+. Exits 1 until the room is walkable with no dark cell.
- `mcd light build.nbt --rooms rooms.json [--only name]` (or `--y <feet y>` for a whole floor level) maps block light
  the way the game spreads it (each source at its vanilla level, one less per block, stopped by full blocks): each
  floor cell's level as 0-9/A-F, with min, mean and the DARK (0, mobs spawn) and dim (1-7) counts. Design lighting
  with it: the renderer has no night.

## Commands

| Command | Does |
|---|---|
| `render <f.nbt> [--out s.png] [--front d] [--ground y] [--cut y] [--eye x,y,z --look x,y,z [--label t]]... [--view "name:x,y,z->x,y,z"]... [--tiles dir]` | The look sheet: 3 street views at eye height, 4 elevations, 2 front-corner isos, optional cutaway and interior eye views. `--view` adds a named exterior camera with sun shadows (e.g. `"downstream:28,14.5,40->31,18,22"`, the iconic view of a house over a waterfall). `--tiles` also writes each view as its own PNG (zoom into one with Read). |
| `compare <before> <after> [--out c.png]` | Before \| after sheets side by side, same cameras. |
| `convert <in> <out>` | Structure `.nbt` ↔ Litematica `.litematic`, by extension (schematic version 7 for 1.20.5+, 6 before). Use `.litematic` for builds over 48 blocks a side, which a structure block can't place in one go. |
| `roof <in.nbt> <out.nbt> --style <s> [--pitch p] [--eave e] [--material m] [--ridge r] [--dormers 2:e] [--pediment n] [--tower x,z,w,h,top] [--chimney x,z] [--keep box] [--spec roof.json]` / `roof <in.nbt> --detect` | Re-roof a build by style name: detects the eave and footprint, strips the old roof, builds the new one (see roofs.md). `--detect` only reports what it found. |
| `check <f.nbt> [after.nbt] [--contract c.json] [--site site.json] [--json]` | (A contract file adds to the automatic redstone protection.) Census, walkability, largest blank surfaces (interior and exterior separately); with two files the FUNCTION report: protected cells unchanged, keep-clear cells clear, warnings for new conductive/triggering/feeding neighbours. `--site` adds the landscape checks (see landscaping.md). Exit 1 on any violation. |
| `info <f.nbt>` | Size, DataVersion → version, census, block entities, functional cell count, unknown block ids. |
| `blocks [--grep re]` / `states <block>` | Valid ids / states for the version. |
| `new <build.mjs> [--from in.nbt] [--size x,y,z] [--out out.nbt]` | Scaffold a generator script wired to the build library (with `--from`, writes are guarded). |
| `concept "<subject>" --out c.png [--size s] [--palette p] [--provider codex\|gemini] [--ref img]... [--model m] [--raw]` | A builder's reference sheet (front elevation + 3/4, one scale, no scene). Codex CLI image tool when installed (ChatGPT plan, no key, ~1 min; `--ref` redraws from a given image), else Gemini (`GEMINI_API_KEY`, Nano Banana 2.1 by default). Measured: this prompt shape matters more than the model; 2–3 candidates across providers, picked against the brief, add useful variety. |
| `assets [--version v]` | Pre-fetch the client jar. |

Version: `--version` › `$MCD_VERSION` › the file's DataVersion › latest release.

Render notes: no light engine (light sources show as blocks, not glow); interior eye views skip sun shadows;
block-entity blocks (chests, signs, beds, banners, heads) render as simple textured boxes; entities (item
frames, armour stands) are not drawn. Keep `--look` inside the build for interior views.

## Build library (`tools/src/build.mjs`)

```js
import { load, Grid, guard, tile, mirrorX, mirrorZ, shell, carve, replace, B, face, DIRS } from ".../tools/src/build.mjs";
const g = guard(load("in.nbt"));          // or: new Grid([w, h, d], { dataVersion })
g.set(x, y, z, ...B.stairs("dark_oak", "south", "top"));   // [block, state] helpers: stairs slab log wood trapdoor door fence wall lantern chain wallTorch pane block
g.fill([x0, y0, z0], [x1, y1, z1], "stone_bricks");
tile(g, { from: 1, step: 4, to: 19 }, (z, i) => bay(z, i));  // the bay rhythm
mirrorX(g, cx, (set) => set(x, y, z, block, state));          // symmetric pair, facings mirrored
shell(g, a, b, "spruce_planks", { floor: true, ceiling: false });
carve(g, a, b);                            // stores air (clears the cell on placement)
replace(g, a, b, "spruce_planks", "stone_bricks");
g.save("out.nbt");                          // never overwrite the input
console.log(g.refused);                     // guarded writes that were refused (report them)
```

Shape brushes (also exported from `build.mjs`): curved forms — `dome`, `cylinder`, `minaret`, `arch` (+ `circleCells`,
`ring`, `disc`, `revolve`) — see `shapes-curved.md`; massing — `setbacks`, `gableRoof`, `hipRoof`, `fins`, `parapet`,
`cornice`, `falseFront`, `stepGable` — see `shapes-massing.md`. Each is `fn(g, opts)`, writes through `g.set` (so
`guard()` still protects function), and returns `{cells, refused, bounds}`.

`guard(grid)` refuses writes into the grid's functional cells and their keep-clear cells (or a set you pass);
it never throws — check `g.refused`. `runParts(g, [["shell", shell.build], ["garden", garden.build]], { palette:
"palette.json" })` runs a build's parts in order so each can only add into air: writes into an earlier part's cells
(air included) are refused and reported, the ground laid before it stays writable, and blocks outside the palette
are reported per part. With `roof: "roof.json"` (a `mcd roof --spec` file) it lays the roof right after the first
part, so later parts build around it instead of the roof tool clearing attics and gables after them; no file yet means
the roof is skipped with a note. A part given `{ carve: true }` as a third element (the stair joiner) may cut through
earlier floors and ceilings (cells with air straight above or below), never walls. `mcd reskin in.nbt out.nbt --swap
spruce=dark_oak,red=blue[,bricks=mud_bricks] [--box ...]` swaps materials on a finished build, form for form, states
kept (a wood or dye word swaps every block named with it; a full block id swaps itself and its stairs, slab and wall);
`mcd variant <run> --name n [--swap ...] [--roof '{json}']` does it into `<run>/variants/n/` with a card, re-running
the build's code when the roof changes. `mcd overworld palette.json [--write]` lists (drops) nether and end blocks. The Grid keeps block-entity NBT (sign text, chest contents) and entities and
writes them back unchanged; cells you don't touch round-trip byte-for-byte.

Grow the box with `g.resize([w, h, d], [dx, dy, dz])` (a shift grows toward −); a shift moves every coordinate,
so re-derive any contract coordinates after shifting.

## Banners, signs and other block entities

Banners, signs, chests, beds, bells, mob heads, decorated pots and shulker boxes are entity-rendered in vanilla, and
`mcd render` draws them with their entity models and textures:
- **Banners:** the cloth in its base colour plus every dyed pattern from the block entity.
- **Signs:** their text, glowing text drawn brighter.
- **Other entity-rendered blocks:** a neutral box, listed under `unknownBlocks` as "entity-rendered, approximated".

Author banners and signs with the build helpers. Each returns `[block, state, nbt]` with valid block-entity NBT
that round-trips through save and load:

```js
g.set(x, y, z, ...B.banner("cyan", [["stripe_center", "white"], ["border", "black"]], { facing: "north" }));   // wall banner
g.set(x, y, z, ...B.banner("red", [["cross", "yellow"]], { wall: false, rotation: 8 }));                       // standing, faces north
g.set(x, y, z, ...B.sign("spruce", ["PERMIT", "OFFICE"], { facing: "north", color: "black", glow: false }));
```
- **Banner patterns:** `stripe_center`, `stripe_top`, `stripe_bottom`, `stripe_left`, `stripe_right`,
  `stripe_middle`, `border`, `curly_border`, `cross`, `straight_cross`, `rhombus`, `circle`, `flower`, `globe`,
  `gradient`, `gradient_up`, `half_horizontal`, `half_vertical`, `triangle_top`, `triangle_bottom`, `bricks`,
  `small_stripes`, `diagonal_left`, `diagonal_right` (the full list is under `textures/entity/banner/`).
- **Colours:** the 16 dye names.
- **NBT format:** banners use the 1.20.5+ `patterns` list (`legacy: true` writes the older `Patterns` /
  `Pattern` / `Color` form). Sign text is written as JSON components below data version 4325 (1.21.5) and as plain
  string components from 1.21.5 on (`dataVersion` option; the grid's default is 1.21.4).
- **Standing `rotation`:** 0 faces south, 4 west, 8 north, 12 east. Wall banners and signs hang on the block behind
  them and face `facing`.

## How things sit: `mcd fit`

`$MCD fit build.nbt --rooms rooms.json` (and the FIT lines of `$MCD room`) lists what a player sees wrong from inside,
each with its cell: anything **on a bottom slab** (half a block of air under it), floor decor **floating** over air,
a **broken bed** (one half, or halves that don't match), a **bed in the wall** (set into the wall line), a **bed
against an opening** (its head at a window, a pane or a door, or at nothing), a **bed backwards** (foot against the
wall, head out in the room), **stairs end short** (a walked flight whose top step is a full block under the floor it
leads to: a jump), a **chimney fire** fault (a campfire on top of a stack, shut in a stack with no
firebox mouth, its smoke blocked before the sky, a flue open at the side, or roof tiles walling the flue), a
**chimney in the room** (a hearth or flue in a room's floor space instead of set into the wall), a **floating shutter** (an open trapdoor with air behind it), **bookshelf overuse** (more
than 3 outside a library, study or office) and a **hallway to nowhere** (a hall with one way in, or a long stretch no
walk between its openings passes). With `street` in rooms.json it also walks the **way in**, street to main door (with `entrances`, each building's or
module's, from the street straight in front of it),
and lists a **steep approach** (a stair or a full-block step on it, more than 3 half-steps without a 2-long landing,
1 wide, or no level cell before the door): the approach standard, `$MCD approach` alone. The shop sockets' boxes are skipped.
Helpers that get it right: `bed(g, [x, y, z], facing, color)` (both halves; refuses a cell that isn't air and returns
false), `flight(g, { from, facing, to, material, width })` (a flight whose last step is in the upper floor's own layer,
headroom cut, stringer under it), `chimney(g, { wall: [x, floorY, z], into, top, material, thin })` (an exterior chimney: the fire
just outside the wall, its mouth cut through it, hay in the floor, a 1 x 1 air flue to the sky, masonry through the
roof, thin trapdoors above it, its own footing; call it directly, never through an air-only helper), `shutter(g, [x, y, z], face, wood, { height })`
(flat on the wall), `bannerWord(g, word, { center, face })` (letters in reading order).

## Review card

One image of a build for a glance or a reviewer (prints one JSON object; non-zero exit and a stderr message on error):

- `mcd card <f.nbt> --out card.png [--tiles dir] [--front n] [--reuse]` — render (close-ups, `MCD_TILE_SCALE=2`) and compose the card (street | front-left, front-right | back, plus the roof close-up row; tiles fit 700x700, white). `--reuse` skips the render when `dir/street.png` exists. `{"card","tiles","views":[...]}`
- `mcd card <f.nbt> --out eye.png --tiles dir --layout eye` — the eye-level card: only what a player sees from the ground (street | down-the-street left, right | back), sky trimmed, so a roof weighs what it weighs in the game.

## Inspection

Cheap, deterministic checks to run after every pass, before judging a render by eye. Each has `--json`.

- **Glance and close-ups** — `$MCD render house.nbt --closeups --tiles tiles/` adds a row of tiles to the sheet: a
  *glance* tile (the street view at 320 px: what reads at a glance) and close-ups at ≥ 12 px per block of the
  entrance (door cells), the eave band, each facade's busiest region, and every small feature visible from outside
  (signs, banners, lanterns, pots, finials). Each tile is labelled with what it frames and its px/block; the JSON lists
  the box and side of each. For any other spot:
  `$MCD zoom house.nbt --at 12,3,0 [--radius 3] [--from n|s|e|w] [--out zoom.png]` (default side: the one with a clear
  line of sight, front first; cells far in front of the spot are left out so they cannot hide it).
- **Change report** — `$MCD diff before.nbt after.nbt --png diff.png [--json] [--fail-empty]`: changed cells by kind
  (added / removed / replaced / state) and block, their groups and boxes, the faces they show on, how many are enclosed
  (never show) or interior-only; with `--png`, changed pixels per standard view and a BEFORE | AFTER pair cropped to
  the change for the two views that changed most. `--fail-empty` exits 1 when nothing changed, when no view shows a
  pixel of the change, or when every changed cell is enclosed — a pass that wrote nothing is a failure, not a no-op.
- **Palette** — `$MCD palette house.nbt`: visible blocks classed into roles by where they sit (walls field, trim and
  edges, roof, base, openings, accents, plants), each with its main materials and measured tone (texture average
  from the client jar). Flags, each with a concrete suggestion: roof in the walls' tone; trim invisible on its wall
  (`trim: stone_bricks on stone_bricks walls -> tuff_bricks or smooth_stone`); an outlier block used a handful of
  times that clashes with everything around it; more than 3 accent colour families; dark detail on a dark ground
  (or light on light).
- **Structure** — `$MCD check house.nbt` now always reports STRUCTURE: floating groups (not connected to the
  lowest layer through face or edge contact), unsupported hanging/mounted blocks (a hanging lantern with nothing
  above, a standing banner or lantern on air, a wall sign with nothing behind), orphans (one block sticking out
  sideways or dangling, touching the build on one face), and enclosed cells (a change there never shows; with two
  files, how many changed cells are enclosed). Report only; the exit code is unchanged.
