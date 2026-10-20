# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
1. P1 soames-shell: parts/soames-shell.mjs. Masses A,B,C,D1,D2,E with footings to the GROUND map, floors, walls, every OPENINGS cell left air, glow cells air, plinth, alley/east/north/south faces.
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
```

### elements.md

```markdown
# REQUIRED ELEMENTS (checklist; coordinates from plan.md, plot-local; y0 = lowest ground)

Parts: P1 soames-shell, P2 butter-shell, P3 roofs, P4 soames-front, P5 butter-front, P6 glazing-signs-light.
Vocab names refer to plan.md VOCABULARY.

## Named in the brief
- [ ] **Starbucks, first store (bays 4-5, z36..53, x0..2)**: brown wooden storefront. Posts `stripped_spruce_log` axis y at z36, 44, 53 (x2, y3..8); bulkhead `spruce_planks` x2 y3; display glass_pane x2 y4..7 z38..41; door pair `spruce_door` (lower+upper, facing west, hinge left/right mirrored) z51..52 y3..4 with brown_stained_glass_pane transom y5..7; head beam `spruce_planks` y8. Part P4 (frame), P6 (glass, door). Vocab: shopfront_bay(spruce), door_pair.
- [ ] **Starbucks old brown round logo**: 5x5 disc at x1 y12..16 z39..43 (corners stucco `smooth_sandstone`): `brown_concrete` ring, `birch_planks` inner 3x3 field, `brown_terracotta` 1x3 siren at z41 y13..15; bay 4 upper windows omitted. P4. Vocab: round_logo.
- [ ] **Starbucks name board**: `brown_concrete` x1 y10..11 z38..53, "STARBUCKS" cream (`white`) banner letters facing west, centred z45.5, via `plaque`/`bannerWord`. P6. Vocab: shop_board.
- [ ] **Starbucks wooden door**: the `spruce_door` pair above, with hanging lantern beside. P6.
- [ ] **Bavarian Meats (bays 6-7, z54..71)**: dark oak front (shopfront_bay dark_oak x2); board `blue_concrete` x1 y10..11 z56..71 "BAVARIAN MEATS" white banner letters centred z63.5; `light_blue` banner with `white` rhombus at x0 y8 z62 under canopy. Product: `red_concrete`/`hay_block` none; shown by a `barrel` row inside window. P4/P6. Vocab: shop_board, lozenge_banner.
- [ ] **Long awning**: `dark_oak_slab` top, x0..1, y9, z0..99 (A) and x4..5 z100..158 (C); `dark_oak_stairs` top brackets at every pier y8 x0 (facing east). P4. Vocab: awning_run.
- [ ] **Big wooden-framed display windows**: per bay glass_pane y4..7 in `stripped_dark_oak_log` mullions + `dark_oak_planks` head y8, bulkhead y3 (A; C +1). P4 frame / P6 glass. Vocab: shopfront_bay.
- [ ] **Upper floor of paired windows**: glass x3 (C x7) y12..14, lintel `cut_sandstone` y15, sill slab; stucco `smooth_sandstone` between brick piers. P1 openings, P4 trim, P6 glass. Vocab: paired_window.
- [ ] **Flower boxes**: `spruce_slab` top at x1 (C x5) y11 under every upper window, potted poppy/dandelion/azure_bluet at y12. P6. Vocab: window_box.
- [ ] **Soames: brick + stucco, two storeys facing west, B/E range stepping up the bluff**: P1 (masses A,B,C,D1,D2,E; walls run down to GROUND map).
- [ ] **Butterworth: four storeys red brick, arched windows upper floors, heavy cornice, main front on 1st Ave (x114/115), back on Pike Place**: P2 shell, P5 facade. Vocab: arch_window, cornice_run.
- [ ] **Butterworth entrance pavilion + BUTTERWORTH tablet**: x116..117 z140..151 y37..42, doorway z144..147, tablet `smooth_sandstone` y38..39 with black banner letters facing east. P5/P6. Vocab: pavilion_door, shop_board.
- [ ] **Kells pub front (back, x64 z90..101 LL)**: dark_oak frame glass y4..7, `green_concrete` fascia y8 z89..102 "KELLS", door pair `spruce_door` z95..96 y3..4. P5/P6.
- [ ] **Bluff lower storeys**: Butterworth west wall LL + ground storeys, Soames E west face lower windows y7..9, always built down to the GROUND map value (plinth `stone_bricks`). P1/P2.

## Expected by a viewer
- [ ] **Cornice (Soames y17 frieze + nose; Butterworth y35..37 corona + bed mould)**: P4/P5. Vocab: cornice_run.
- [ ] **Parapets with coping and pier heads**. P3 (decks), P4/P5 (fronts).
- [ ] **Chimney stacks (brick 2x2, deepslate band, slab cap) on decks, solid and decorative, no fire**: listed coordinates in ROOFS. P3. Vocab: brick_stack.
- [ ] **Vent hutches**: `stone_brick_slab` on `stone_bricks` 2x1. P3. Vocab: vent_hutch.
- [ ] **Sidewalk strip with slab half steps at doors**: `stone_bricks` paving, bottom `stone_brick_slab` x1 (C x5) in front of each door, 2+ wide. P6. Vocab: door_step.
- [ ] **Dusk light**: hanging lanterns (`lantern` + `chain`) under awning, `ochre_froglight` / `glowstone` glow 2 behind shop glass, `shroomlight` behind 2 of 3 upper windows. P6. Vocab: dusk_glow, awning_lantern.
- [ ] **Neon**: no neon on these real fronts; instead warm lit window boxes; Kells fascia lit by hanging lanterns. P6.
- [ ] **Alley between buildings (x60..63)**: plain brick east face of Soames, west of Butterworth; left empty. P1.
```

### rooms.json

```json
{"entrance":[1,2,51],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{"roles":{"brick":["bricks","brick_stairs","brick_slab","brick_wall","red_nether_bricks"],"stone":["stone_bricks","stone_brick_slab","stone_brick_stairs","stone_brick_wall","deepslate_bricks"],"pale_trim":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab","cut_sandstone","cut_sandstone_slab"],"deck":["gray_concrete"],"timber":["stripped_dark_oak_log","dark_oak_planks","dark_oak_slab","dark_oak_stairs","dark_oak_door","dark_oak_trapdoor","dark_oak_fence"],"timber_starbucks":["stripped_spruce_log","spruce_planks","spruce_door","spruce_slab","spruce_trapdoor"],"glass":["glass_pane","brown_stained_glass_pane"],"signs":["brown_concrete","brown_terracotta","birch_planks","blue_concrete","green_concrete"],"banners":["white_banner","black_banner","light_blue_banner","white_wall_banner","black_wall_banner","light_blue_wall_banner"],"Brick walls, arches, parapets and chimneys":["bricks","brick_stairs","brick_slab","brick_wall","terracotta"],"Pale facade panels, sills, keystones and cornices":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab","cut_sandstone"],"Flat roofs":["gray_concrete","stone_brick_slab"],"Foundations, steps, paving and roof coping":["stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall"],"Shopfront timber, awnings and doors":["dark_oak_planks","dark_oak_stairs","dark_oak_slab","dark_oak_fence","dark_oak_door","dark_oak_trapdoor"],"Window glazing":["glass_pane","brown_stained_glass_pane"],"Brown logo and cream lettering":["brown_concrete","birch_planks","birch_slab","birch_stairs"],"Planters and vegetation":["spruce_trapdoor","oak_leaves","vine","flower_pot","poppy","dandelion","oxeye_daisy"],"Warm lighting and lamp supports":["lantern","glowstone","dark_oak_fence"]},"objects":["potted_poppy","potted_dandelion","potted_azure_bluet","flower_pot","lantern","chain","ochre_froglight","glowstone","shroomlight","barrel","hay_block","dark_oak_door","glass_pane","brown_stained_glass_pane","dark_oak_fence","dark_oak_trapdoor","spruce_trapdoor","poppy","dandelion","oxeye_daisy","oak_leaves","vine"]}
```

### make.sh

```sh
#!/usr/bin/env bash
# The one command that makes build.nbt from scratch: node build.mjs writes every part in plan order to a temp file,
# the temp file must read back as a structure, then it moves into place. Stub parts yield the bare ground.
set -euo pipefail
cd "$(dirname "$0")"

MCD_JS=/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs
TMP=build.tmp.nbt
trap 'rm -f "$TMP"' EXIT

node build.mjs "$TMP"
node "$MCD_JS" info "$TMP" > /dev/null
mv "$TMP" build.nbt
echo "build.nbt written"
```

### build.mjs

```js
// Builds the Pike Place north end (Soames-Dunn plot 0, Butterworth plot 1) from its parts, in plan.md's order: the ground,
// then every part. runParts lets each part only ADD into what earlier parts built (writes into an earlier part's cells are
// refused and reported) and reports off-palette blocks per part. A part whose file is not there yet builds as nothing.
// Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE, groundAt } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

// The build function of one part's module; a missing file (another copy still writing it) is a part that builds nothing.
async function partBuild(file) {
  if (!existsSync(new URL(file, import.meta.url))) {
    console.log(`part file missing: ${file} (built as nothing)`);
    return () => {};
  }
  return (await import(new URL(file, import.meta.url).href)).build;
}

const g = new Grid(SITE.size, { dataVersion: SITE.dataVersion });
// The ground: dirt up to each cell's GROUND height, grass_block on top, wherever the map gives a height. Footings, paving
// and walls are written over it, down to their own cell's ground.
for (let x = 0; x < SITE.size[0]; x++)
  for (let z = 0; z < SITE.size[2]; z++) {
    const gy = groundAt(x, z);
    if (gy == null) continue;
    for (let y = 0; y < gy; y++) g.set(x, y, z, "dirt");
    g.set(x, gy, z, "grass_block");
  }

runParts(
  g,
  [
    ["Soames-Dunn masonry shell", await partBuild("./parts/soames-shell.mjs")],
    ["Butterworth masonry shell", await partBuild("./parts/butter-shell.mjs")],
    ["Roofs and stacks", await partBuild("./parts/roofs.mjs")],
    ["Soames front and shopfronts", await partBuild("./parts/soames-front.mjs")],
    ["Butterworth east front, pavilion, back and Kells", await partBuild("./parts/butter-front.mjs")],
    ["Glazing, signs, lights, sidewalk", await partBuild("./parts/finish.mjs")],
  ],
  { palette: fileURLToPath(new URL("./palette.json", import.meta.url)), roof: fileURLToPath(new URL("./roof.json", import.meta.url)) },
);

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Pike Place north end: the site (plan.md coordinates and the brief's footprint and GROUND maps), the palette as named
// constants (palette.json's ids only), and a seeded rng. Generated from brief.txt and plan.md's PALETTE; edit by hand only
// in step with palette.json.

// The site grid: x 0..117 (Butterworth's pavilion ends at x117), y 0..69 (the Soames roofs and Butterworth stacks), z 0..158.
// Data version 3955 is Minecraft 1.21.1, the server's version.

// The site grid: x 0..117 (Butterworth's pavilion ends at x117), y 0..69 (the Soames roofs and Butterworth stacks), z 0..158.
// Data version 3955 is Minecraft 1.21.1, the server's version.
export const SITE = { size: [118, 70, 159], dataVersion: 3955 };

// Soames-Dunn (plot 0): its box in grid coordinates (= plan.md's plot-local coordinates, x 0..59, z 0..158), top y 69.
export const SOAMES = { x0: 0, x1: 59, z0: 0, z1: 158, top: 69, bay: 9, frontX: 2, frontXC: 6, bXwest: 28 };

// Butterworth (plot 1): its box x 64..117, z 0..157, top y 65; the bays are 6 along z; its east front is x114.
export const BUTTERWORTH = { x0: 64, x1: 117, z0: 0, z1: 157, top: 65, bay: 6, frontX: 114, pavilionX: 116 };

// The plot whose box holds cell (x, z), as { plot, key } with key "soames" or "butterworth", or null.
export function plotAt(x, z)

// The GROUND height of cell (x, z): the top ground block's y, or null where the map has no ground.
export function groundAt(x, z)

// True when cell (x, z) is on the footprint ('#' in the brief): build only there.
export function onFootprint(x, z)

// Seeded random numbers: rng(seed) returns a function giving floats in [0, 1), the same sequence for the same seed.
export function rng(seed)

// The palette: palette.json's ids as names (roles, then objects).
// brick
export const BRICKS = "bricks";

export const BRICK_STAIRS = "brick_stairs";

export const BRICK_SLAB = "brick_slab";

export const BRICK_WALL = "brick_wall";

export const RED_NETHER_BRICKS = "red_nether_bricks";

// stone
export const STONE_BRICKS = "stone_bricks";

export const STONE_BRICK_SLAB = "stone_brick_slab";

export const STONE_BRICK_STAIRS = "stone_brick_stairs";

export const STONE_BRICK_WALL = "stone_brick_wall";

export const DEEPSLATE_BRICKS = "deepslate_bricks";

// pale trim
export const SMOOTH_SANDSTONE = "smooth_sandstone";

export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";

export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";

export const CUT_SANDSTONE = "cut_sandstone";

export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";

// deck
export const GRAY_CONCRETE = "gray_concrete";

// timber
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";

export const DARK_OAK_PLANKS = "dark_oak_planks";

export const DARK_OAK_SLAB = "dark_oak_slab";

export const DARK_OAK_STAIRS = "dark_oak_stairs";

export const DARK_OAK_DOOR = "dark_oak_door";

export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";

export const DARK_OAK_FENCE = "dark_oak_fence";

// timber starbucks
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";

export const SPRUCE_PLANKS = "spruce_planks";

export const SPRUCE_DOOR = "spruce_door";

export const SPRUCE_SLAB = "spruce_slab";

export const SPRUCE_TRAPDOOR = "spruce_trapdoor";

// glass
export const GLASS_PANE = "glass_pane";

export const BROWN_STAINED_GLASS_PANE = "brown_stained_glass_pane";

// signs
export const BROWN_CONCRETE = "brown_concrete";

export const BROWN_TERRACOTTA = "brown_terracotta";

export const BIRCH_PLANKS = "birch_planks";

export const BLUE_CONCRETE = "blue_concrete";

export const GREEN_CONCRETE = "green_concrete";

// banners
export const WHITE_BANNER = "white_banner";

export const BLACK_BANNER = "black_banner";

export const LIGHT_BLUE_BANNER = "light_blue_banner";

export const WHITE_WALL_BANNER = "white_wall_banner";

export const BLACK_WALL_BANNER = "black_wall_banner";

export const LIGHT_BLUE_WALL_BANNER = "light_blue_wall_banner";

// objects: light, planting, stock
export const POTTED_POPPY = "potted_poppy";

export const POTTED_DANDELION = "potted_dandelion";

export const POTTED_AZURE_BLUET = "potted_azure_bluet";

export const FLOWER_POT = "flower_pot";

export const LANTERN = "lantern";

export const CHAIN = "chain";

export const OCHRE_FROGLIGHT = "ochre_froglight";

export const GLOWSTONE = "glowstone";

export const SHROOMLIGHT = "shroomlight";

export const BARREL = "barrel";

export const HAY_BLOCK = "hay_block";
```

### vocab/h1.mjs

```js
// Designer helpers from plan.md VOCABULARY (Pike Place north end). Coordinates are plot-local; `face` is the way the
// wall looks: Soames-Dunn's front is west (-x), Butterworth's is east (+x).
// Each helper writes only inside its own footprint and into air only: a solid cell is skipped and listed, unless
// opts.over is true, which lets it overwrite solid blocks inside its footprint (never outside it).
// Returns { placed, skipped: [[x, y, z, block]...], box } so the caller can see what was refused.

/** One 9-wide bay of a shopfront: head beam y8, mullion post at z0+8, bulkhead, display glass z0..z0+3, a door pair
 *  z0+4..z0+5 (both halves, hinges mirrored, facing out) with transom glass above it to y7. Wall plane x. */
export function shopfront_bay(g, { x, z0, floorY, face = "west", post, bulk, head, doorMat, over = false } = {})

/** A two-light window in the wall plane x (z..z+1): sill (top half-slab) at y0-1, glass recessed 1 into the building
 *  (+x, the Soames west front) over y0..y1, lintel at y1+1. */
export function paired_window(g, { x, z, y0 = 12, y1 = 14, over = false } = {})

/** A 5x5 disc on the wall plane x, centred (yc, zc): brown_concrete ring, birch_planks field, a 1x3 brown_terracotta
 *  siren down the middle. The four corners are not written (they stay as they are). */
export function round_logo(g, { x = 1, zc = 41, yc = 14, over = false } = {})

/** A light blue wall banner with a white rhombus, hung on the block behind it (it faces `face`, out of the wall). */
export function lozenge_banner(g, { x, y, z, face = "west", over = false } = {})

/** A cornice at height y on the wall plane x, over z0..z1: frieze row at x, bed mould (stairs, top half, facing in)
 *  at the street-side cell, corona one up over both cells, cap slab (bottom) two up at the street side. Pass a
 *  material for each part, or false to leave that part out. Soames: frieze smooth_sandstone, bed mould
 *  smooth_sandstone, no corona/cap. Butterworth: frieze cut_sandstone, the rest as defaults. */
export function cornice_run(g, { x, y, z0, z1, face = "west", stairs = "smooth_sandstone", frieze = "smooth_sandstone",

/** A pilaster on the wall plane x, 2 wide (z..z+1), over y0..y1, head (bricks) at headY with a bottom cap slab above it.
 *  quoin: every third course of the shaft is cut_sandstone (both cells). */
export function pilaster(g, { x, z, y0, y1, headY = y1 + 1, quoin = false, over = false } = {})

/** A vent hutch on a roof deck: stone_bricks 2 wide (x..x+1) at y, a stone_brick_slab on top of it. y = the cell above the deck. */
export function vent_hutch(g, { x, z, y, over = false } = {})

/** A glow block 2 cells behind the glass, at (x, y, z). kind: shop (ochre_froglight), ceiling (glowstone, shop ceiling),
 *  upper (shroomlight, upper rooms). About one upper window in three stays dark (a hash of z, same every run). */
export function dusk_glow(g, { x, y, z, kind = "shop", over = false } = {})

/** The Kells pub front on the x64 projection (its face is west): fascia green_concrete at floorY+5 over z0-1..z0+12,
 *  dark oak frame with glass floorY+1..floorY+4, a spruce door pair at z0+5..z0+6 (floorY..floorY+1) with transom glass
 *  above, and two hanging lanterns at z0+1 and z0+10 hung from the fascia. */
export function kells_front(g, { x = 64, z0 = 90, floorY = 3, face = "west", over = false } = {})
```

### vocab/h2.mjs

```js
// Vocabulary helpers from plan.md (VOCABULARY), second set. Every helper takes plot-local coordinates, writes only
// into air (over: true lets it replace what is there, still only inside its own footprint), and returns
// { placed, skipped: [[x,y,z]...] } so the caller sees what was refused. Nothing is written below its footprint.

/** Awning canopy over a shopfront run: dark_oak_slab (top) over x0..x1, z0..z1 at y; a bracket at x0, y-1 on each
 *  pier's two z (piers = the pier start z values, default every 9 from z0). The bracket's back faces the wall: into. */
export function awning_run(g, { x0, x1, y = 9, z0, z1, piers, into = "east", over = false })

/** Window box under an upper window: spruce_slab (top) at [x, y, z..z+width-1], one potted flower standing on each
 *  slab at y+1 (flower: an id or a list, cycled). A pot is placed only where the slab is there to stand on. */
export function window_box(g, { x, z, y = 11, width = 2, flower = "potted_poppy", over = false })

/** Name board on the wall plane x: mat fills y0..y1 x z0..z1, then `text` in banner letters hung in front of it,
 *  on the side face says (face: the way the board looks; the letters sit at x -/+ 1). Letter count in r.letters. */
export function shop_board(g, { x, y0, y1, z0, z1, mat = "dark_oak_planks", text, letter = "black", base = "white", face = "west", over = false })

/** Hanging lantern under an awning slab at [x, y, z]: it needs a block above (y+1), else nothing is written.
 *  chain: a chain (id `chain`, 1.21.1 name) hangs from the block above at y and the lantern hangs from the chain. */
export function awning_lantern(g, { x = 0, y = 8, z, chain = false, over = false })

/** Arched upper window on the wall plane x, 3 wide at z..z+2 (glass is the glazier's): sill slab top proud of the
 *  wall at y0-1; brick voussoirs (half top) at the head row y1 in the outer cells, facing away from the centre;
 *  cut_sandstone keystone over the centre at y1+1. The opening rows y0..y1 are left as they are. */
export function arch_window(g, { x, z, y0, y1, face = "east", over = false })

/** Solid 2x2 brick chimney, first row y0 (the row above the deck): bricks to y0+height-1, a deepslate_bricks band two
 *  rows below the top, a stone_brick_slab cap (bottom) on top. deck: the deck's y; when given, the stack is footed down
 *  to it (air cells only, nothing is written at the deck itself). */
export function brick_stack(g, { x, z, y0, height = 6, deck, over = false })

/** Half step at a door: bottom stone_brick_slab at [x, y, z..z+width-1], y = the paving row + 1 (the walk side is x).
 *  The two rows above it stay clear: nothing is written there. */
export function door_step(g, { x, z, y, width = 2, over = false })

/** Butterworth pavilion doorway on the wall plane x, 4 wide at z..z+3 (door row y): a double dark_oak door at z+1..z+2
 *  (y, y+1; hinges outside), a glass transom above it at y+2..y+3, and a smooth_sandstone_stairs voussoir pair at
 *  z and z+3 over the cut_sandstone keystone at z+1..z+2, rows y+4..y+5. Facing = the way the front looks (face). */
export function pavilion_door(g, { x, z, y = 9, face = "east", over = false })
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
