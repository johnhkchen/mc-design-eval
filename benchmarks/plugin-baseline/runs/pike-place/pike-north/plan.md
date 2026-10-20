# Pike Place north end: Soames-Dunn (plot 0) + Butterworth (plot 1)

## SITE

The template's default ("the front faces north") does NOT apply here. Both buildings run along z, in their site orientation, with no turning:
- **Soames-Dunn**: the street front faces WEST (-x) onto Pike Place. The shops read left to right from the street, north (low z) to south (high z).
- **Butterworth**: the main front faces EAST (+x) onto 1st Avenue. Its back faces WEST onto Pike Place / Post Alley.

Coordinates are plot-local: x and z as given in the brief, y 0 = the lowest ground of each plot.
- Footprint map: char column c = x 4c..4c+3 (plot 1: x 64+4c..), row r = z 4r..4r+3.
- Ground value g in a cell = the y of its top ground block. Walls and footings run down to y = g in their cell, so nothing floats. Ground higher than a floor is interior cut into the slope; only exterior faces matter.
- The ground climbs about 10 blocks west→east (across x) and barely changes along z.
- Build only on # cells. Nothing projects past the footprint: awnings and cornices sit on the outer footprint cells, and the walls step back to make room for them.

### Plot 0: Soames-Dunn masses (x0..59, z0..158)

| mass | cells (x / z) | stands on | floors | roof deck / parapet top |
|---|---|---|---|---|
| A north street range | x0..27 z4..99; x0..11 z0..3 (x12..27 z0..3 is empty) | g 1-2 | shop y2, upper y10 | deck y17, parapet to y20 (piers y21) |
| C south street range | x4..27 z100..158 | g 2-3 | shop y3, upper y10 | deck y17, parapet to y20 |
| B north upper range (behind A, on the bluff) | x28..55 z4..99, minus empty x52..55 z4..7, x52..55 z20..27, x44..55 z80..99; plus x28..47 z0..3 | g 7-11 | y11, y18 | deck y25, parapet to y28 |
| D1 link (one storey) | x28..43 z100..103 + x28..35 z104..107 | g 2-3 | y3 | deck y10, parapet to y12 |
| D2 link (one storey) | x28..35 z128..131 | g 3 | y3 | deck y10, parapet to y12 |
| E south-east range | x44..59 z108..139; x48..55 z104..107; x32..59 z140..143; x28..59 z144..155; x28..47 z156..158 | g 4-12 | lower storey from ground (west/court side) up to y10, then y11, y18 | deck y25, parapet to y28 |

Other parts of plot 0:
- **Service court**: the non-# hole at x28..43 z108..139 is left unbuilt. E's west face and D1/D2 face onto it.
- **Pike Place sidewalk strip**: x0..1 z0..99 (A) and x4..5 z100..158 (C), paved under the awning.
  - Paving is `stone_bricks` at y = g (y1 for z0..91, y2 for z92..99 and for C).
  - Where the shop floor is one block above the paving, put a bottom `stone_brick_slab` 1 above the paving in front of each door: in x1 for A, x5 for C, 2 wide or more. That gives half steps, accessible.

What you see from Pike Place:
- the two-storey shop row (A + C);
- the taller B/E range stepping up behind it, 11 blocks back (its west face x28 rises above A's roof, y18..28);
- Butterworth over everything behind them.

### Plot 1: Butterworth masses (x64..117, z0..157)

| mass | cells | stands on | floors | roof |
|---|---|---|---|---|
| main block | x64..115 z4..51; x84..115 z0..3; x68..115 z52..83; x64..115 z84..107; x68..115 z108..155 | g 1 (west) to 11 (east) | lower level LL y3; ground (1st Ave) storey by segment: y11 z0..35, y10 z36..83, y9 z84..139, y8 z140..155; F2 y18, F3 y24, F4 y30 | deck y36; east cornice y35..37; parapet to y40, pilaster heads y41 |
| entrance pavilion (1st Ave) | x116..117 z140..151 (projects 2 past the main wall line) | g 8-9 | same as main | its own raised parapet with a name tablet, to y42 |
| rear stub | x88..91 z156..157 | g 4-5 | none | left unbuilt (ground only) |

Further details:
- **Rear projections** (x64..67 at z4..51 and z84..107) are full height: plain rear bays.
- **North-west notch** (x64..83 z0..3) is unbuilt.
- **World spacing**: Butterworth's west wall (x64) is a 1-block alley away from Soames-Dunn's east face. That east face is plain.

## ROOFS

All roofs are flat, utilitarian commercial decks (Pike Place type). There are no pitched roofs and no roof gardens.

| roof | form | deck / material | parapet + coping | built by |
|---|---|---|---|---|
| A, C | flat | y17 `gray_concrete` | street front: see FACADES (brick parapet y18..19, coping y20). Other sides: `bricks` y18, coping `stone_brick_slab` y19 | `$MCD roof` style `flat-parapet`, footprint = the A and C rects, `y` 17, `parapet` 1, `overhang` 0, `grow` false. `keep` = the street-front cornice/parapet cells x0..2 (A) and x4..6 (C), y17..21, which the facade part builds |
| B, E | flat | y25 `gray_concrete` | `bricks` y26..27, coping `stone_brick_slab` y28 | `$MCD roof` flat-parapet, `y` 25, `parapet` 2, `overhang` 0, `grow` false |
| D1, D2 | flat | y10 `gray_concrete` | `bricks` y11, coping `stone_brick_slab` y12 | same tool, `parapet` 1 |
| Butterworth | flat | y36 `gray_concrete` | `bricks` y37..39, coping `smooth_sandstone_slab` y40. East front: the hand-built cornice (FACADES) | `$MCD roof` flat-parapet, `y` 36, `parapet` 3, `overhang` 0, `grow` false. `keep` = x114..117 y34..42 (the east cornice and pavilion) |

How the roofs meet:
- **A meets B**: A's deck (y17) runs up to B's west wall at x28, which rises to y28 as a clean brick face with windows.
- **Same at C/D1** (deck y17 to the D1 parapet at y12): C's south-east deck simply laps against E.

Never let the roof tool grow the grid: an eave at -1 shifts every cell.

Roof furniture (the only things on the decks):
- **Chimney stacks**: `bricks`, 2x2, one band of `deepslate_bricks` 2 below the top, cap `stone_brick_slab`, each standing on its own footing from the deck.
  - Butterworth, y37..43 (cap y44): x70..71 z20..21, x70..71 z74..75, x70..71 z124..125, x100..101 z44..45, x100..101 z104..105.
  - Soames B/E, y26..31: x40..41 z30..31, x40..41 z64..65, x52..53 z120..121.
- **Vent hutches**: `stone_brick_slab` on a `stone_bricks` block, 2x1.
  - Soames A deck: at z20, 47, 74, x14.
  - Butterworth deck: at x90, z30, 90, 130.

## FACADES

### Soames-Dunn west front (Pike Place)

Planes:
- **A** (z0..99): wall face x2, piers proud at x1, awning and cornice nose at x0.
- **C** (z100..158): wall face x6, piers proud at x5, awning and cornice nose at x4.

Bay rhythm: 9 blocks. Bay k has its brick pier at z 9k..9k+1 and its panel at z 9k+2..9k+8.
- A has bays k=0..10, plus a 1-wide end pier at z99.
- C has its own grid: piers at z100+9j..101+9j for j=0..6, a 3-wide brick end at z156..158.

| level (A; C is the same y except shop floor y3) | element | position / depth | material |
|---|---|---|---|
| y = g..1 (A) / g..2 (C) | plinth | x1..2 under piers and bulkheads | `stone_bricks` |
| y3 | shop bulkhead (kick plate) under display windows | x2 | `dark_oak_planks` (Starbucks: `spruce_planks`) |
| y3..9 | brick pier | x1 (1 proud), z9k..9k+1 | `bricks` |
| y3..8 | shopfront per bay, in x2. Display window z9k+2..9k+5 (glass y4..7); door pair z9k+6..9k+7 (y3..4) with a glass transom y5..7; timber mullion post z9k+8 (y3..8); timber head beam y8 over the whole panel | glass recessed: pane at x2 inside a timber frame | frames `stripped_dark_oak_log` (posts, axis y) / `dark_oak_planks` (head); `glass_pane`; transoms `brown_stained_glass_pane`; doors `dark_oak_door` (Starbucks: `spruce_door`) |
| y9 | continuous awning (canopy) | x0..1, all of A (x4..5 for C), running over the piers | `dark_oak_slab` type top |
| y8 | awning brackets at every pier | x0, at z9k and z9k+1 | `dark_oak_stairs` half top, facing east (against the pier) |
| y8 | hanging lantern, 1 per bay at the panel centre z9k+5 | x0, under the canopy | `lantern` hanging |
| y10 | fascia / sign band | x1, between piers | `dark_oak_planks` (shop name boards per shop below) |
| y10..16 | upper storey: piers continue | x1, z9k..9k+1 | `bricks` |
| y10..16 | stucco panels | x2 | `smooth_sandstone` |
| y11 | window box under each window: top slab as sill, potted flowers standing on it at y12 | x1 | `spruce_slab` top; `potted_poppy` / `potted_dandelion` / `potted_azure_bluet` |
| y12..14 | paired windows per bay: z9k+3..9k+4 and z9k+6..9k+7 | x2 left open (recess), glass at x3 | `glass_pane` |
| y15 | lintel over each window | x2 | `cut_sandstone` |
| y17 | cornice: frieze at x1 (continuous), nose at x0 | x0 is 2 proud of the panels | frieze `smooth_sandstone`; nose `smooth_sandstone_stairs` half top facing east |
| y18..19 | parapet | x1 | `bricks` |
| y20 | coping | x1 | `stone_brick_slab` bottom |
| y20..21 | pier heads over every pier: bricks y20, cap slab y21 | x1, z9k..9k+1 | `bricks`, `stone_brick_slab` |

Shops on the A/C front. The second designer may name the generic ones; it keeps the two named ones.

| shop | bays / z | front |
|---|---|---|
| **STARBUCKS** (the first store) | bays 4-5, z36..53 | Brown wooden storefront: frames `stripped_spruce_log` / `spruce_planks`, doors `spruce_door`. Name board `brown_concrete` x1 y10..11 z38..53 (over the z45..46 pier), "STARBUCKS" in cream banner letters (`white`) facing west, centred z45.5. The **round brown logo** goes in bay 4's upper panel instead of its windows: a 5x5 disc at x1 y12..16 z39..43. Corners left as stucco (a round reading); `brown_concrete` ring, `birch_planks` inner field, and a `brown_terracotta` 1x3 siren figure at the centre (z41, y13..15). |
| **BAVARIAN MEATS** | bays 6-7, z54..71 | Dark oak front. Name board `blue_concrete` x1 y10..11 z56..71, "BAVARIAN MEATS" in white banner letters, centred z63.5. One blue/white lozenge banner (`light_blue` with `white` rhombus) under the canopy at x0 y8 z62. |
| generic market shops | bays 0-3, 8-10; C bays j=0..5 | Dark oak fronts, fascia y10 `dark_oak_planks`. Each shop gets one accent colour (banner/plaque) from the decorator. |

Other faces of Soames-Dunn:
- **North end of A** (z0 x0..11, z4 x12..27): plain brick.
  - plinth `stone_bricks` y g..1;
  - one shop return window at z0 y4..7 x5..8;
  - upper windows at y12..14, x4..5 and x8..9;
  - parapet and coping continued at the same heights as the front.
- **B west face (x28), above A's deck y18..27**:
  - `bricks`, with a string course of `smooth_sandstone` at y24 (flush);
  - windows 2 wide at y20..22, on the same 9-bay grid as the front (z9k+3..9k+4, z9k+6..9k+7);
  - sills `stone_brick_slab` top at x27 y19 (on A's parapet line);
  - B's parapet y26..27 + coping y28.
- **B north face (z0 for x28..47; z4 for x48..51; z8/z28 returns)**: plain brick from g up, plinth `stone_bricks` 2 courses, windows y12..14 and y20..22 every 6 along x (x30..31, 36..37, 42..43).
- **B and E east faces (x55, x59) on the alley**: brick, windows y20..22 every 9 along z, a single `dark_oak_door` service door at y12..13 at z40 and z130.
- **E west face to the service court** (x44 z108..139, x32 z140..143, x28 z144..158):
  - built down to the ground;
  - lower windows y7..9 wherever g ≤ 5, upper windows y13..15 and y20..22;
  - 2 wide, every 6 along z;
  - brick, `stone_bricks` plinth.
- **D1/D2**: brick, one storey; a `dark_oak_door` into the court at D1 x36..37 z103 (facing south) and at D2 z131 x30..31.

### Butterworth east front (1st Avenue): the main facade

Planes: main wall face x114; pilasters, sills, belt courses and cornice proud at x115. Upper bay grid: bay k (k=0..25) has its window at z6k+1..6k+3 (3 wide) and brick at z6k+4..6k+6.

| level | element | position / depth | material |
|---|---|---|---|
| y g..floor | plinth course | x114..115 | `stone_bricks` |
| ground storey (floor..y16) | sandstone piers 2 wide at z0..1, z12m-1..12m (m=1..11, i.e. z11..12, 23..24 … 131..132) and z138..139 | x114, with a proud base block x115 at floor+1 | `smooth_sandstone`, base `cut_sandstone` |
| ground storey | shopfronts between the piers: bulkhead floor+1; glass floor+2..15; head beam y16 | x113 (recessed 1); x114 open | `dark_oak_planks` bulkhead/head, `stripped_dark_oak_log` mullions every 3-4, `glass_pane`, a `dark_oak_door` pair at the centre of each shop |
| y17 | belt course | x114 band; x115 drip | `cut_sandstone` band; `smooth_sandstone_slab` top |
| y18..34 | brick body | x114 | `bricks` |
| y18..34 | pilasters at z11..12, 23..24, …, 131..132 and the corners z0 (1 wide, clear of bay 0's window at z1..3) and z154..155 | x115 (1 proud) | `bricks`, with `cut_sandstone` quoin pairs every 3 courses at the corner pilasters only |
| F2 y20..22 | rectangular windows, sill at y19, lintel at y23 | x114 open, glass x113; sill x115; lintel x114 | `glass_pane`; sill `smooth_sandstone_slab` top; lintel `cut_sandstone` |
| y23..24 | belt course | x115 at y24 | `smooth_sandstone_slab` bottom |
| F3 y26..28 + head y29 | arched windows | glass x113 y26..29 (centre cell to y29); arch at x114 y29 = `brick_stairs` half top in the two outer cells (each facing away from the window's centre) + keystone `cut_sandstone` in the centre at y30 | sill `smooth_sandstone_slab` top x115 y25 |
| F4 y31..33 + head y34 | arched windows like F3 | glass x113 y31..34 centre cell; `brick_stairs` half top outer cells y34; keystone `cut_sandstone` x115 y34 centre | sill `smooth_sandstone_slab` top x115 y30 |
| y35 | frieze band | x114 | `cut_sandstone` |
| y35 | bed mould | x115 | `smooth_sandstone_stairs` half top facing west |
| y36 | corona | x114..115 | `smooth_sandstone` |
| y37 | cornice cap | x115 | `smooth_sandstone_slab` bottom |
| y37..39 | parapet | x114 | `bricks` |
| y40 | coping | x114 | `smooth_sandstone_slab` |
| y40..41 | pilaster heads at each pilaster | x114..115 | `bricks` + `stone_brick_slab` cap |

Notes on the east front:
- **F4 sits right under the cornice**: the frieze at y35 is directly above its arches.
- **Pavilion (main entrance)**: face x116, z140..151; pilasters x117 at z140..141 and z150..151.
  - Ground: a central arched doorway z144..147, `dark_oak_door` pair at y9..10 under a 2-cell glass transom y11..12. Arch head y13..14: `smooth_sandstone_stairs` half top at z144 and z147, `cut_sandstone` keystone z145..146.
  - Above the door: windows F2/F3/F4 at z143..145 and z146..148, the same forms as the main front, glass at x115.
  - Raised parapet x116 y37..41, with a `smooth_sandstone` tablet at y38..39 z140..151 lettered "BUTTERWORTH" (11 black banner letters, facing east, centred z145.5).
  - Pavilion cornice: same profile at x116..117.
- **Main-wall windows** of bays 23 and 25 (z139..141, z151..153) are left as brick: the pavilion's flanks.
- **North end** (z0 for x84..115; z4 for x64..83): plainer. Brick body, the cornice returned 6 cells along x (x110..115) at z0, windows on a 6-grid along x (x88..90, 94..96, 100..102, 106..108) at F2/F3/F4 heights, flat `cut_sandstone` lintels (no arches).
- **South end** (z155): the same as the north end.

### Butterworth west back (Pike Place / Post Alley)

Wall face x64 (z4..51, z84..107) or x68 (elsewhere). It is plainer and taller: six readable levels.
- **Plinth**: `stone_bricks` y g..2.
- **LL storey** (floor y3): windows y5..7, 2 wide, every 6 along z (z6k+2..6k+3), `glass_pane`. Segmental heads: `bricks` flush, with a `brick_slab` sill in the window cell below. Glass recessed 1 (wall 2 thick).
- **KELLS pub front** (the old mortuary's basement pub, real) on the x64 projection, z90..101 at the LL storey:
  - `dark_oak` frame shopfront, glass y4..7;
  - `green_concrete` fascia x64 y8 z89..102, "KELLS" in white banner letters;
  - door pair z95..96 y3..4, `spruce_door`.
- **Ground storey** (1st Ave level): windows y12..15. **F2/F3/F4**: windows y20..22, y26..28, y32..34. All 2 wide on the same z grid, flat heads.
- **No string courses** on the back. The back has NO projecting cornice: a brick band of `red_nether_bricks` at y35 marks it, then the parapet y37..39 and coping y40.

## MATERIALS (all checked: they exist in 1.21.1)

| role | block id |
|---|---|
| brick body, piers, parapets, chimneys (both buildings) | `bricks`, `brick_stairs`, `brick_slab` |
| Soames upper-storey stucco panels | `smooth_sandstone` |
| pale trim: lintels, keystones, belt courses, tablets | `cut_sandstone` |
| cornice profiles, sills, coping (Butterworth) | `smooth_sandstone`, `smooth_sandstone_stairs`, `smooth_sandstone_slab` |
| Butterworth ground-storey base piers | `smooth_sandstone` on a `cut_sandstone` base |
| plinths, foundations, sidewalk paving, Soames copings | `stone_bricks`, `stone_brick_slab`, `stone_brick_wall` |
| chimney band | `deepslate_bricks` |
| back string band | `red_nether_bricks` |
| flat roof decks | `gray_concrete` |
| shopfront timber, awning, brackets | `stripped_dark_oak_log`, `dark_oak_planks`, `dark_oak_slab`, `dark_oak_stairs`, `dark_oak_door`, `dark_oak_trapdoor` |
| Starbucks front only | `stripped_spruce_log`, `spruce_planks`, `spruce_door` |
| glass | `glass_pane` (windows), `brown_stained_glass_pane` (shop transoms) |
| Starbucks board + logo | `brown_concrete`, `brown_terracotta`, `birch_planks`, banner letters `white` |
| Bavarian Meats board | `blue_concrete`, white banner letters, `light_blue` lozenge banner |
| Kells fascia | `green_concrete` |
| window boxes | `spruce_slab` top + `potted_poppy`, `potted_dandelion`, `potted_azure_bluet` |
| outdoor light | `lantern` (hanging under awnings and soffits), `chain` (NOT iron_chain: 1.21.1) |
| dusk glow behind glass | `ochre_froglight` (warm). `glowstone` in shop ceilings; `shroomlight` in upper rooms |

Dusk lighting rule:
- **Shops**: every shopfront is lit. A glow block at the shop ceiling, 2 cells behind the glass. Soames: x4, y9 (C: x8, y9). Butterworth: x111, y = the head beam, every 3 along z.
- **Upper windows**: about 2 in 3 are lit with a glow block 2 behind the glass, at the window head height. Leave a random third dark so it reads as lived-in.

## OPENINGS

Every opening is left as AIR by the wall part; the glazier fills it. Glass sits 1 behind the face (recessed).

| building / face | openings |
|---|---|
| Soames A front (x2 plane) | per bay k=0..10: display window z9k+2..9k+5 y4..7; door z9k+6..9k+7 y3..4 + transom y5..7; upper windows z9k+3..9k+4 and z9k+6..9k+7 y12..14 (glass x3). Exception: bay 4's upper windows are replaced by the logo disc |
| Soames C front (x6 plane) | the same per bay j=0..5, panel z(100+9j)+2..+8; shop floor y3, so display y5..7, door y4..5, transom y6..8, upper windows y12..14 (glass x7) |
| Soames A north (z0) | x5..8 y4..7 (shop return); x4..5 and x8..9 y12..14 |
| Soames B west (x28) | z9k+3..9k+4 and z9k+6..9k+7, y20..22, k=0..10 (glass x29) |
| Soames B north (z0) | x30..31, 36..37, 42..43 at y12..14 and y20..22 |
| Soames B/E east (x55, x59) | y20..22, 2 wide, every 9 along z; doors z40 (x55) and z130 (x59) at y12..13 |
| Soames E west (court) | 2 wide every 6 along z, y7..9 (where g≤5), y13..15, y20..22 |
| Soames D1/D2 | doors: D1 x36..37 z103 y4..5; D2 x30..31 z131 y4..5 |
| Butterworth east (x114, glass x113) | shopfronts at floor+1..y16 between the piers (z2..10, 13..22, 25..34, … 133..137); F2 3-wide windows z6k+1..6k+3 y20..22; F3 y26..29 (arched); F4 y31..34 (arched), for k=0..25 except k=23 and 25 |
| Butterworth pavilion (x116, glass x115) | doorway z144..147 y9..12 (doors y9..10, transom y11..12); windows z143..145 and z146..148 at y20..22, y26..29, y31..34 |
| Butterworth north / south ends | x88..90, 94..96, 100..102, 106..108 at y20..22, y26..28, y32..34 |
| Butterworth west (x64/x68) | z6k+2..6k+3: y5..7, y12..15, y20..22, y26..28, y32..34. Kells front z90..101 y3..7 (doors z95..96 y3..4) |

## RESERVED

Cells the shell must leave empty for later parts:
- **Soames sidewalk strips**: x0..1 z0..99 and x4..5 z100..158, from y = g+1 to y8.
  - It stays clear for the walkway, the door slab ramps, brackets and lanterns.
  - Only the brick piers' plinth stands in x1/x5 below y3.
- **Soames name boards**: x1 y10..11 z38..53 (Starbucks), z56..71 (Bavarian Meats).
- **Starbucks logo disc**: x1 y12..16 z39..43.
- **Window-box cells**: x1 y11..12 (C: x5) under every upper window.
- **Butterworth pavilion**: the name tablet, x116..117 y37..42 z140..151.
- **Butterworth east cornice zone**: x115 y34..41, all z. It is built by the facade part, not the shell.
- **Butterworth shopfront recess**: x114 at floor+1..y16 between the piers. The shopfront part stands there.
- **Chimney footprints**: the cells listed under ROOFS, from the deck up. The roof part keeps them.
- **Glow cells**: 2 behind each window, at the window head. The shell's interior stays air there.

## FLOORS

Exterior only: interiors are just a lit shallow zone behind the glass.

| mass | floor y (block you stand on) | interior volume |
|---|---|---|
| Soames A | shop y2 (clear y3..9); upper y10 (clear y11..16) | x3..27 z1..98 |
| Soames C | shop y3 (clear y4..9); upper y10 | x7..27 z101..157 |
| Soames B | y11 (clear y12..17), y18 (clear y19..24) | x29..54 z1..98 |
| Soames E | lower storey (west side only) from ground to y10; y11, y18 | x45..58 z105..154, x29..58 z141..157 |
| Soames D1, D2 | y3 (clear y4..9) | inside their rects |
| Butterworth | LL y3; ground storey y11 / y10 / y9 / y8 by segment (z0..35 / 36..83 / 84..139 / 140..155); F2 y18; F3 y24; F4 y30; deck y36 | x65..113 (x69.. where the back is x68) z1..154 |

---
# DESIGNER SECTIONS (below the architect's)

## PALETTE

Keep the MATERIALS table ids exactly. By role, with shape variants:
- Brick: `bricks`, `brick_stairs`, `brick_slab`, `brick_wall`. Back band `red_nether_bricks`.
- Stone: `stone_bricks`, `stone_brick_slab`, `stone_brick_stairs`, `stone_brick_wall`, `deepslate_bricks`.
- Pale trim: `smooth_sandstone`, `smooth_sandstone_stairs`, `smooth_sandstone_slab`, `cut_sandstone`, `cut_sandstone_slab`.
- Deck: `gray_concrete`.
- Timber: `stripped_dark_oak_log`, `dark_oak_planks`, `dark_oak_slab`, `dark_oak_stairs`, `dark_oak_door`, `dark_oak_trapdoor`, `dark_oak_fence`. Starbucks: `stripped_spruce_log`, `spruce_planks`, `spruce_door`, `spruce_slab`, `spruce_trapdoor`.
- Glass: `glass_pane`, `brown_stained_glass_pane`.
- Signs/logos: `brown_concrete`, `brown_terracotta`, `birch_planks`, `blue_concrete`, `green_concrete`, banners `white_banner`, `black_banner`, `light_blue_banner` (patterned via banner helper).
- Planting: `potted_poppy`, `potted_dandelion`, `potted_azure_bluet`, `flower_pot`.
- Light: `lantern` (hanging true/false), `chain` (1.21.1 name; the toolkit's `blocks --check` only knows `iron_chain`: place `chain` by id anyway, never `iron_chain`), `ochre_froglight`, `glowstone`, `shroomlight`.
- Dusk-only fill-in: `barrel` (butcher's stock in window), `hay_block`.
All ids were checked with `$MCD blocks --check`: all known except `chain` (above, 1.21.1-correct).

## VOCABULARY

All helpers take plot-local coords; `face` = the way the wall looks (Soames front west; Butterworth front east).
- `shopfront_bay(g, {x, z0, floorY, face, post, bulk, head, doorMat})` : one 9-wide bay panel z0..z0+8: bulkhead x=wall plane y=floor+1 (planks); posts at z0+8 (log axis y) y floor+1..8; display glass_pane z0..z0+3 y floor+2..floor+5 (glass in the recessed plane); door pair z0+4..z0+5 (`*_door` lower+upper, facing out, hinges mirrored) y floor+1..floor+2; transom pane above door to y7; head beam planks y8 across all.
- `awning_run(g, {x0,x1,y:9,z0,z1,piers})`: top `dark_oak_slab` rows x0..x1, plus `dark_oak_stairs` half top facing east at x0,y8 on each pier's two z.
- `paired_window(g, {x,z,y0:12,y1:14})`: 2 wide x 3 tall air, glass_pane recessed 1, `cut_sandstone` lintel above, `stone_brick_slab` top sill below.
- `window_box(g, {x,z,y:11,flower})`: `spruce_slab` top at y11, `potted_*` at y12 on it.
- `round_logo(g, {x:1,zc:41,yc:14})`: 5x5 disc: ring cells (distance ~2) `brown_concrete`, inner 3x3 `birch_planks`, 1x3 vertical `brown_terracotta` centre; corners untouched stucco.
- `shop_board(g, {x,y0,y1,z0,z1,mat,text,letter,face})`: fill board with mat then `plaque`/`bannerWord` text (never hand-spelled).
- `lozenge_banner(g,{x,y,z})`: `light_blue_banner` with white rhombus pattern, hanging under the awning.
- `awning_lantern(g,{x:0,y:8,z})`: `lantern hanging=true` under a `dark_oak_slab` (or on a `chain` from it).
- `cornice_run(g, {x, y, z0, z1, stairs, frieze, face})`: frieze row, `smooth_sandstone_stairs` half top facing the building (bed mould), corona `smooth_sandstone`, cap slab bottom, per architect's tables.
- `arch_window(g,{x,z,y0,y1})`: 3-wide opening, `brick_stairs` half top in outer cells at head, `cut_sandstone` keystone in centre, sill `smooth_sandstone_slab` top.
- `pilaster(g,{x,z,y0,y1,quoin})`: `bricks`, optional cut_sandstone quoin pair every 3 courses; head `bricks`+`stone_brick_slab`.
- `brick_stack(g,{x,z,y0})`: 2x2 `bricks` 6 high, `deepslate_bricks` ring 2 below top, `stone_brick_slab` cap, footing down to deck, solid (no fire).
- `vent_hutch(g,{x,z,y})`: `stone_bricks` 2x1, `stone_brick_slab` on top.
- `door_step(g,{x,z,y})`: 2-wide bottom `stone_brick_slab` at x1 (C x5) in front of the door pair.
- `dusk_glow(g,{x,y,z})`: `ochre_froglight` (shops) / `glowstone` (shop ceiling y9) / `shroomlight` (upper rooms) 2 cells behind the glass; upper windows lit every 3rd skipped (z-hash).
- `pavilion_door(g,{...})`: dark_oak_door pair y9..10 z144..147, transom y11..12, `smooth_sandstone_stairs` top at z144,z147 y13..14, keystone `cut_sandstone` z145..146.
- `kells_front(g,{...})`: dark_oak frame, glass y4..7 z90..101, `green_concrete` fascia, spruce door pair, hanging lanterns.

## ROOMS

Exterior only: four shallow lit zones behind the glass (floors are the architect's FLOORS). Designers only dress what shows through the glass: counter, shelves, lit glow, no more than 6 deep.

## PARTS (see list in the reply; order = build order)
1. [x] P1 soames-shell: parts/soames-shell.mjs. Masses A,B,C,D1,D2,E with footings to the GROUND map, floors, walls, every OPENINGS cell left air, glow cells air, plinth, alley/east/north/south faces.
2. P2 butter-shell: parts/butter-shell.mjs. Main block, pavilion, rear projections, LL storey, floors per segment, back band `red_nether_bricks` y35, openings air.
3. P3 roofs: parts/roofs.mjs. `$MCD roof` flat-parapet per ROOFS (keep lists), brick_stack and vent_hutch.
4. P4 soames-front: parts/soames-front.mjs. Bays, piers, shopfront timber, awning, cornice, stucco, pier heads, window boxes, B west face string course, Starbucks + Bavarian structure, logo disc.
5. P5 butter-front: parts/butter-front.mjs. East front: plinth, piers, shopfronts, belt, pilasters, arches, cornice, pavilion, back sills, Kells frame/fascia.
6. P6 glass-signs-light: parts/finish.mjs. Panes, doors, transoms, all signs/banners, lanterns+chains, glow blocks, sidewalk paving/slab steps.

## Notes for workers
- Never write into reserved or non-# cells; check footprint rows (char c = x 4c.., row r = z 4r..). Use GROUND map: foot every wall to its cell's ground.
- No pale oak, no `iron_chain`; use `chain`.
- Letters via `plaque`/`bannerWord` only; Soames front faces west, Butterworth east: render both and read the words.
- Entrances: Starbucks door x2 z51..52 (floor y2); approach slab at x1 from sidewalk. Butterworth pavilion door x116 z144..147 (floor y8); cells beyond x117 are outside the plot: placement handles the street.
- Dusk: every shopfront lit; omit one in three upper glows.
- P1 note: Soames shell walls are 2 thick; openings carved 2 deep (plane + cell behind, glass goes in the cell behind). Shop band x2..3 y3..8 (C x6..7 y4..8) is AIR only over each panel; pier cells z9k..9k+1 stay brick. Upper front x2 is smooth_sandstone stucco with x2 y11 and y15 left air over window columns (sill/lintel). Walls top at deck-1 (A/C y16, B/E y24, D y9); deck/parapet by roofs. Floors: dark_oak_planks.
- v2 (comment round): the shells now glaze their own windows (runParts locks the shell's carved air, so later parts
  could not): tall windows (4 rows) on every face, glass 1 behind the face, a sash rail (green_concrete on Soames,
  white_concrete on Butterworth), cut_sandstone lintel + smooth_sandstone sill, a shroomlight hung behind about 2 in 3.
  Soames shopfronts are built in soames-shell.mjs (spruce for Starbucks bays 4-5); the logo moved over the door (bay 5,
  zc 51); awning is green_concrete. Storey bands + a pale cornice course at the deck row on the back and end faces;
  Butterworth east cornice deepened (dentils x115 y34, second corona y37 + slab y38).
