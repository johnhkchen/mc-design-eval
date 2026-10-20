# Pike Place — south & east markets: architect's plan

Exterior only. Minecraft 1.21.1 blocks only. Built for a dusk hero render: warm glass, lit stalls, lanterns.

## SITE

One module, four plots side by side along x, each with its own y 0 (its lowest ground). Coordinates are MODULE
coordinates (plot 0 starts at x 0, plot 1 at x 62, plot 2 at x 128, plot 3 at x 211). Every mass below is
checked against the footprint map: all cells are `#`. Footprint `#` cells not listed are left unbuilt (stray slivers).

**Orientation (site, not the usual north front).** Pike Place runs along z (NW end low z, Pike Street high z).
- Economy Market (plot 0) stands WEST of Pike Place: its street face is EAST (+x). Pike Street is its south (+z) side.
- Corner Market (plot 1) stands EAST of Pike Place: its street face is WEST (-x), its Pike Street face SOUTH (+z).
- Sanitary Market (plot 2) faces the Main Arcade across Pike Place: its street face is WEST (-x), ~64 blocks long.
- Garden Center (plot 3): shopfronts WEST (-x, downhill, toward Pike Place); Post Alley face NORTH (-z) with the fire escape.
- Ground climbs east (+x) on every plot: 0-3 at the west edge to 10-20 at the east edge. Every wall runs DOWN to the
  ground cell under it (a stone plinth fills from y 0 to the ground; the wall starts on it). Nothing floats, no glass
  below ground.

**The footprint-edge rule (all street faces).** Nothing may stand off the footprint, so on every street face:
- footprint edge cell = the projection band (awnings, banners, lamp brackets, cornice overhang, sign letters);
- edge + 1 = the upper wall plane and the piers (piers run down to the ground);
- ground-storey shopfronts / stall fronts recess to edge + 3 between the piers (the stalls sit under the awnings).

Floor numbers: "floor y" is the floor block course; people stand on y+1. Ground value = the street surface course.

### Plot 0 — Economy Market (x 0..57, z 0..101, max y 84)

| mass | x | z | y (base..top of parapet) | ground under it |
|---|---|---|---|---|
| E1 main hall | 9..53 | 12..38 | ground..37 | 2 (W) .. 15-17 (E) |
| E1b east strip of main hall | 54..56 | 12..29 | ground..37 | 16-19 |
| E2 NE corner pavilion (tallest) | 51..56 | 0..11 | ground..44 | 17-20 |
| E3 south range | 3..50 | 39..47 | ground..37 | 1 (W) .. 13 (E) |
| E4 lower west annex (downhill terrace) | 3..32 | 48..56 | ground..19 | 0-2 |
| E5 atrium entrance pavilion (off Pike Street) | 42..47 | 48..59 | ground..28 | 8 (W) .. 12 (E) |
| E6 skylight (glass gable, on E1 roof) | 23..41 | 19..31 | 36..42 | roof deck |

Street (east) face planes: footprint edge x 56 (z 0..29), x 53 (z 30..38), x 50 (z 39..47); upper wall planes x 55, 52, 49.
The three jogs follow Pike Place's slant; each gets its own pier at the jog.

### Plot 1 — Corner Market (x 62..123, z 0..101, max y 62)

| mass | x | z | y | ground |
|---|---|---|---|---|
| C1 north block | 77..112 | 30..53 | ground..34 | 6-7 (W) .. 13 (E) |
| C2 middle block | 71..109 | 54..77 | ground..34 | 4-5 (W) .. 12 (E) |
| C3 south block (Pike St corner) | 65..103 | 78..95 | ground..34 | 1-2 (W) .. 10 (E) |
| C4 south tail (Pike St face) | 86..103 | 96..101 | ground..34 | 6-9 |
| C5 roof chimney stacks (2) | 80..81 & 98..99 | 40..41 & 86..87 | 33..38 | roof |
| C6 rooftop stair house | 92..97 | 60..65 | 33..37 | roof |

West (Pike Place) edges step x 77 → 71 → 65 going south (6-block jogs); upper wall planes x 78, 72, 66.
South (Pike Street) edge z 95 (x 65..85) and z 101 (x 86..103); upper wall planes z 94 and z 100.
The NW sliver (x 62..76, z 0..14) is left unbuilt.

### Plot 2 — Sanitary Market (x 128..206, z 0..154, max y 53)

| mass | x | z | y | ground |
|---|---|---|---|---|
| S1 long south block (main facade) | 128..179 | 80..119 | ground..25 | 0-1 (W) .. 7 (E) |
| S1b | 128..171 | 120..143 | ground..25 | 1 (W) .. 4 (E) |
| S2 | 132..183 | 68..79 | ground..25 | 0-1 .. 8 |
| S3 | 136..187 | 60..67 | ground..25 | 1 .. 8 |
| S4 | 144..191 | 52..59 | ground..25 | 1 .. 9 |
| S5 | 152..195 | 40..51 | ground..25 | 2 .. 9 |
| S6 north block | 156..199 | 8..39 | ground..25 | 2-3 .. 10 |
| S7 entrance sign parapet | 129..130 | 104..119 | 23..30 | on S1 wall |

West face steps x 128 → 132 → 136 → 144 → 152 → 156 heading north (a stepped curve along Pike Place). Upper wall
plane = edge + 1. One flat roof over the whole stepped plan.

### Plot 3 — Garden Center Building (x 211..252, z 0..31, max y 33)

| mass | x | z | y | ground |
|---|---|---|---|---|
| G1 main block | 211..244 | 2..27 | ground..17 | 0 (W) .. 5 (E) |
| G2 east wing | 245..250 | 2..11 | ground..17 | 6 |
| G3 fire escape (north face, Post Alley) | 211..222 | 0..1 | 7..17 | 0-1 |

West face edge x 211, upper wall plane x 212, shopfronts recess to x 214. North face wall plane z 2 (fire escape stands in z 0..1).

## ROOFS

All four are flat roofs behind parapets (`flat-parapet` style; the `modern` preset's coping is right for the
1942 Sanitary). None gets a pitched roof except the hand-built skylight.

| building | roof | deck y | parapet | notes |
|---|---|---|---|---|
| Economy E1/E1b/E3 | flat-parapet, deck `stone_bricks` / `polished_andesite` mix | 35 | y 36..37, brick, coping `smooth_stone_slab` | cornice band under it at y 33..34 |
| Economy E2 pavilion | flat-parapet | 42 | y 43..44 | stands 7 above the main roof; flagpole-like lantern post on top |
| Economy E4 annex | flat-parapet, a roof TERRACE | 17 | y 18..19 brick, iron_bars rail on top | planters (oak_leaves, potted_fern) along it |
| Economy E5 atrium pavilion | flat-parapet | 26 | y 27..28 cream | parapet a stepped pediment over the arch (by hand) |
| Economy E6 skylight | BY HAND: glass gable, ridge along x at z 25, y 42; steps in 1 per course from z 19/31 at y 36 | 36..42 | — | `glass` slopes with `white_concrete` ribs every 4 x; gable ends (x 23, x 41) glazed fans; warm shroomlight under it at y 34 so it glows |
| Corner C1-C4 | flat-parapet | 32 | y 33..34 brick, coping `smooth_sandstone_slab` | cornice y 30..31 |
| Corner C5/C6 | chimneys `bricks` 2x2 with a `deepslate_bricks` band at y 36 and slab cap 37..38; stair house brick with `stone_brick_slab` lid | — | — | by hand |
| Sanitary S1-S6 | flat-parapet (`modern` preset coping) | 23 | y 24..25 `smooth_sandstone`, coping `smooth_quartz_slab` | rooftop vents (2x2 light_gray_concrete boxes) every ~20 z, by hand |
| Sanitary S7 | sign parapet raised over the entrance: a cream board to y 30, quartz cap | — | — | by hand |
| Garden Center | flat-parapet | 15 | y 16..17 brick, coping `stone_brick_slab` | potted plants and leaf clumps on the roof (the garden shop) |

Overhang: 0 (parapet roofs); the cornice gives the shadow line. The roof tool's deck must not cover E6's opening
(x 23..41, z 19..31 at y 35 stays air inside the skylight) — give it as `keep`.

## FACADES

### Economy Market — red-brown brick, cream terracotta trim, white frames
- **East face (Pike Place), 2 storeys above street:** plinth `stone_bricks` from ground to y 17; street storey y 18..25;
  string course y 26 (`smooth_sandstone`, flush) ; upper storey y 27..34; cornice y 33..34 (`brick_stairs` upside
  down, +1 proud into the edge band) then parapet y 36..37. Piers (`bricks`, 2 wide) every 6 blocks on the upper
  wall plane, quoins of `smooth_sandstone` at the corners and the jogs (alternating 2/1 long).
  Bays between piers: street storey a shop window (glass_pane) 3 wide y 19..23 with a red/white or green/white
  wool-stripe awning in the edge band at y 24 (two courses stepping out); upper storey windows 2 wide y 28..32,
  `smooth_quartz` frames (sill `quartz_slab`, head `smooth_quartz` with a `smooth_sandstone` keystone).
- **NE pavilion E2 east face (x 55):** the name block. "ECONOMY MARKET" in 2 lines of banner letters on a cream
  `smooth_sandstone` panel x 55, z 1..10, y 36..41: ECONOMY (7 wide) at y 39..40, MARKET (6 wide) at y 36..37, red on cream. Below it a tall arched window y 28..34 with a sandstone arch.
- **South face (Pike Street) of E3 and E5:** E5 is the atrium entrance: an ARCHED GLASS DOORWAY, cream terracotta frame.
  Frame `smooth_sandstone` x 44 and x 47 (piers), arch of `smooth_sandstone_stairs` (upside down) springing at y 18,
  crown y 21; glazed fan above the door (glass_pane y 16..20 in x 45..46); a `quartz` keystone y 22. Over it
  y 23..25 a cream band with banner letters "ECONOMY" (z 59 face, centered). Brick x 42..43. Stepped cream parapet
  to y 28. A lantern each side on the frame at y 16.
- **West face (downhill, toward the bay) shows 4 storeys:** grey stone base `stone_bricks` with `mossy_stone_bricks`
  1 in 10 near the ground, up to y 9; brick above. Window rows at y 4..7 (low storey, 2 wide, iron_bars over glass),
  y 11..15, y 19..24, y 28..32, every 6 blocks, white frames. E4 annex reads as a brick terrace with arched
  windows y 3..7 and y 10..14, its roof terrace planted.
- **North face** (low z, mostly hidden): brick, plain windows on the same rows.

### Corner Market — 3 storeys of red-brown brick, big arched stall openings
- **West face (Pike Place) and south face (Pike Street):** stone plinth `stone_bricks` to the floor level.
  Ground storey: brick piers 2 wide on the upper wall plane every 8 blocks; between them a BIG ROUND ARCH 6 wide
  springing at floor+5, crown at floor+8 (`brick_stairs` upside down + `smooth_sandstone` keystone and imposts).
  Inside each arch (recessed to edge+3) the open stall: crates of produce (barrels, melon, pumpkin, hay), a
  canvas awning in the arch mouth at floor+5 alternating red/white and green/white wool stripes, lanterns hung
  from the arch crown. North block floor y 7, middle y 5, south y 3: the arch crown is level (y 15) along the
  whole face, so the lower blocks have taller arches.
- String course y 16 (`smooth_sandstone`, +0) over the arches = 2nd floor line.
- 2nd storey y 17..23, 3rd storey y 25..31: tall windows 2 wide, 5 high (y 18..22 and y 26..30) in white
  `smooth_quartz` frames, two per pier bay (rhythm 4), brick flat arches (`brick_stairs` upside down) over them,
  `quartz_slab` sills. String course y 24.
- Cornice y 30..31: `smooth_sandstone_stairs` upside down +1 proud with `brick` dentils every other block under it;
  brick parapet y 33..34 with `smooth_sandstone_slab` coping; a raised brick panel with "CORNER MARKET" banner
  letters on the west face of C2 at y 33..36 (x 72 band), cream letters on red.
- Corners: `smooth_sandstone` quoins, alternating 2/1.
- East (uphill) and north faces: plain brick, same window rows from y 17 up.

### Sanitary Market — cream stucco, open stalls, striped awnings
- **West face (Pike Place):** ground storey floor y 1 (S5 y 2, S6 y 3) up to y 10: concrete piers
  `smooth_sandstone` 2 wide on the upper wall plane every 8 blocks with `cut_sandstone` caps at y 10; between them
  open-fronted shops recessed to edge+3, lit stall counters (barrels, produce blocks, lanterns), a STRIPED AWNING
  in the edge band at y 9 (2 courses stepping down-out: y 9 at edge+2, y 8 at edge), colours repeating red/white,
  green/white, red/white... Painted sign boards on the fascia y 11 per shop (spruce wall sign boards or banners).
- Frieze band y 11..13 `smooth_sandstone` with a `cut_sandstone` string course at y 13; the lettering
  "SANITARY PUBLIC MARKET" in green banner letters (one per char, 22 columns, spaces as gaps) centered over the
  entrance on S1, z 100..123, hung in the edge band x 128.
- Upper storey y 14..22: small windows 2 wide, 3 high (y 16..18), white `smooth_quartz` frames, 2 per bay.
- Top: cornice y 22 `smooth_sandstone_stairs` upside down +1; parapet y 24..25 with quartz coping.
- Entrance (S1, z 109..114): a 6-wide opening y 2..9 framed in `smooth_quartz`, a raised sign parapet S7 to y 30
  over it carrying a second "SANITARY" in green banner letters at y 26..27, z 108..115.
- East and north faces: cream stucco, a plinth course `stone_bricks`, a row of small windows, plain.

### Garden Center Building — small brick shop building
- **West face:** plinth `stone_bricks` to y 1; two shopfronts (z 4..13 and z 16..25) recessed to x 214: glass_pane
  y 2..5 over a `spruce_planks` base y 1, a door each, green/white striped awning in x 211..212 at y 6; fascia
  y 7 with a painted sign. Upper storey y 9..14: three 2-wide windows in white frames; cornice y 14 (`brick_stairs`
  upside down); parapet y 16..17 with a cream `smooth_sandstone` panel z 9..20 carrying "GARDEN CENTER" in green
  banner letters (GARDEN y 17, CENTER y 15 if the band is 2 rows each; or one line "GARDEN CTR" on y 16..17).
- **North face (Post Alley):** shop doors at street level and the FIRE ESCAPE: black landings at y 8 and y 14
  (`polished_blackstone_slab` top, x 211..222, z 0..1), `iron_bars` rails, a diagonal `polished_blackstone_stairs`
  flight between them, drop ladder to y 3. Windows behind each landing.
- Potted ferns and leaf clumps along the parapet and in window boxes (the garden shop).

## MATERIALS

| role | block |
|---|---|
| brick body (Economy, Corner, Garden Center) | `bricks` |
| brick accent (Economy only, lower storeys 1 in 12) | `granite` |
| cream terracotta trim, arches, quoins, string courses | `smooth_sandstone`, `smooth_sandstone_stairs`, `smooth_sandstone_slab`, `cut_sandstone` |
| white window frames, keystones | `smooth_quartz`, `quartz_slab`, `quartz_stairs` |
| Sanitary stucco body | `smooth_sandstone` (dominant) with `cut_sandstone` bands |
| plinth / retaining base / roof deck | `stone_bricks`, `stone_brick_stairs`, `stone_brick_slab`, `mossy_stone_bricks` & `cracked_stone_bricks` (≤1 in 10, low) |
| roof deck mix | `stone_bricks`, `polished_andesite` |
| coping | `smooth_stone_slab` (Economy), `smooth_sandstone_slab` (Corner), `smooth_quartz_slab` (Sanitary), `stone_brick_slab` (Garden) |
| glass | `glass_pane` (windows), `glass` (skylight), `white_stained_glass_pane` (skylight fans) |
| awnings | `red_wool` + `white_wool`, `green_wool` + `white_wool` stripes |
| lettering | banner letters: red on cream (Economy), cream on red (Corner), `green` on cream (Sanitary, Garden) |
| shop fittings | `spruce_planks`, `spruce_slab`, `spruce_stairs`, `spruce_fence`, `spruce_trapdoor`, `spruce_door` |
| fire escape, rails | `polished_blackstone_slab`, `polished_blackstone_stairs`, `iron_bars` |
| light | `lantern` (hung under arches/awnings, on brackets, lamp posts of `spruce_fence`), `shroomlight` behind glass and under the skylight, `glowstone` in stall ceilings |
| produce | `melon`, `pumpkin`, `hay_block`, `barrel`, `potted_fern`, `oak_leaves` (persistent) |
| skylight ribs, rooftop vents | `white_concrete`, `light_gray_concrete` |
| chimney band | `deepslate_bricks` |

All checked with `$MCD blocks --check` (all known, all in 1.21.1).

## OPENINGS

Walls leave these as AIR; glazing, doors and stall fittings are added later.

### Economy Market
| opening | face / plane | x / z span | y |
|---|---|---|---|
| street-storey shop windows | E face x 55 / 52 / 49 | z 3..5, 9..11, 15..17, 21..23, 27..29 (x 55); z 32..34 (x 52); z 41..43 (x 49) | 19..23 |
| street-storey door (Pike Place) | E face x 52 | z 36..37 | 18..21 |
| upper windows | same planes | same z spans, 2 wide (first 2 of each) | 28..32 |
| E2 tall arched window | x 55 | z 4..7 | 28..34 (arch top) |
| atrium doorway (Pike Street) | S face of E5, z 59 | x 45..46 (frame 44, 47) | 13..21 arched |
| E3 south windows | z 47 | x 9..10, 15..16, 21..22, 27..28, 33..34 | 11..15 and 28..32 |
| west face windows | x 9 (E1), x 3 (E3, E4) | every 6 z from the wall start, 2 wide | 4..7, 11..15, 19..24, 28..32 (only where the wall exists above ground) |
| E4 annex arched windows | x 3, z 50..51 and 54..55; z 56 face x 6..7, 12..13, 18..19, 24..25 | | 3..7, 10..14 |

### Corner Market (upper wall planes x 78 / 72 / 66, z 94 / 100)
| opening | span | y |
|---|---|---|
| ground-storey arches, west face | 6 wide between 2-wide piers: C1 z 32..37, 40..45, 48..53; C2 z 56..61, 64..69, 72..77; C3 z 80..85, 88..93 | floor+1 .. 15 |
| ground-storey arches, south face | z 94: x 68..73, 76..81; z 100: x 88..93, 96..101 | floor+1 .. 15 |
| 2nd storey windows | 2 wide, pairs every 4 over each arch bay, both street faces | 18..22 |
| 3rd storey windows | same columns | 26..30 |

### Sanitary Market (upper wall plane = edge+1)
| opening | span | y |
|---|---|---|
| open shop fronts | 6 wide between 2-wide piers every 8 along the whole west face (S1 z 82..87, 90..95, 98..103, [entrance 109..114], 120..125, 128..133, 136..141; S2..S6 same rhythm from each step) | floor+1 .. 9 |
| entrance | x 129, z 109..114 | 2..9 |
| upper windows | 2 wide, 2 per bay at bay offsets +1 and +5 | 16..18 |

### Garden Center
| opening | span | y |
|---|---|---|
| shopfronts west | x 214, z 4..13 and 16..25 (doors z 8..9 and 20..21) | 2..5 |
| upper windows west | x 212, z 6..7, 13..14, 20..21 | 9..12 |
| north face door + windows | z 2, door x 230..231 y 3..4 (ground ~3); windows x 214..215, 219..220 behind landings | door 3..4, windows 9..12 |

## RESERVED

The shell leaves these empty for later parts:
- every street face's edge band (Economy x 56/53/50; Corner x 77/71/65 and z 95/101; Sanitary edge x of each step;
  Garden x 211 and z 0..1) from ground+1 up: awnings, banners, lamp brackets, cornice nosing, fire escape only.
- the recess between edge+2 and edge+3 at ground storey on shop faces: stall counters, crates, produce.
- E6 skylight volume x 23..41, z 19..31, y 35..42 (no roof deck there); shroomlight cells at y 34 under it.
- E2 name panel x 55, z 1..10, y 36..41 (cream; the letters go in x 56 in front of it).
- S7 sign parapet x 129..130, z 104..119, y 23..30.
- Garden Center sign panel x 212, z 9..20, y 15..17; fire escape volume x 211..222, z 0..1, y 2..17.
- chimney stacks C5 and stair house C6 cells on the Corner Market roof.

## FLOORS

| building | floor y (block course) | interior volume |
|---|---|---|
| Economy E1/E3 | lower 1: y 2 (west half, x ≤ 30); lower 2: y 9; Pike Place street floor: y 17; upper: y 26; roof deck: y 35 | storeys 7, 8, 9, 9 high |
| Economy E2 | street y 19, upper y 26, top room y 35, roof y 42 | |
| Economy E4 | y 1, y 9, roof terrace y 17 | |
| Economy E5 | entrance floor y 12, ramping to the hall at y 17 inside; roof y 26 | |
| Corner | ground: C1 y 7, C2 y 5, C3/C4 y 3; 2nd y 16; 3rd y 24; roof y 32 | ground storey 8-12 high, then 8, 8 |
| Sanitary | ground: S1-S4 y 1, S5 y 2, S6 y 3; upper y 13 (frieze y 11..13 is the floor zone); roof y 23 | ground ~9-11 high, upper 9 |
| Garden Center | ground y 1 (west; east half sits in the slope); upper y 8; roof y 15 | 6 and 6 high |

Interiors only as visible through glass: lit stall depth 3 behind each open front, lights near windows.

---
# DESIGNER'S SECTIONS

## PALETTE

All ids checked with `$MCD blocks --check` (known, 1.21.1). Plot origin: every coordinate in this plan is a module coordinate.

| role | base | stairs | slab | other |
|---|---|---|---|---|
| brick body | `bricks` | `brick_stairs` | `brick_slab` | `brick_wall`, accent `granite` (1 in 12, lower storeys Economy only) |
| cream trim / Sanitary stucco | `smooth_sandstone` | `smooth_sandstone_stairs` | `smooth_sandstone_slab` | `cut_sandstone`, `cut_sandstone_slab`, `chiseled_sandstone` (keystones) |
| white frames, keystones | `smooth_quartz`, `quartz_block` | `quartz_stairs` | `quartz_slab`, `smooth_quartz_slab` | |
| plinth, deck | `stone_bricks` | `stone_brick_stairs` | `stone_brick_slab` | `mossy_stone_bricks`, `cracked_stone_bricks` (<=1 in 10, low), `stone_brick_wall`, `polished_andesite`, `smooth_stone_slab` |
| glass | `glass`, `white_stained_glass_pane` (skylight fans) | | | `glass_pane` (windows) |
| awnings | `red_wool`, `white_wool`, `green_wool` | | | `red_carpet`/`white_carpet`/`green_carpet` for awning valance if needed |
| shop fittings | `spruce_planks` | `spruce_stairs` | `spruce_slab` | `spruce_fence`, `spruce_trapdoor`, `spruce_door`, `spruce_wall_sign`, `spruce_hanging_sign`, `spruce_log` |
| fire escape | `polished_blackstone_slab`, `polished_blackstone_stairs` | | | `iron_bars`, `ladder` |
| light | `lantern`, `shroomlight`, `glowstone`, `iron_chain` (to hang lanterns), `candle` | | | |
| produce / stall | `melon`, `pumpkin`, `hay_block`, `barrel`, `composter`, `orange_wool`, `yellow_wool` | | | `potted_fern`, `potted_red_tulip`, `potted_azalea_bush`, `oak_leaves` (`persistent:"true"`), `flowering_azalea_leaves` |
| skylight, vents | `white_concrete`, `light_gray_concrete` | | | |
| banners | `red_banner`, `green_banner`, `white_banner` (via `bannerWord`) | | | |
| chimney band | `deepslate_bricks` | | | |
| frame detail | `white_terracotta` (stucco sign boards), `iron_trapdoor` (grilles) | | | |

Style rules: no `pale_oak*`, no `*_chain` newer variants; `iron_chain` is the 1.21.1 name.

## VOCABULARY

Each helper is `name(g, ...)`; all take `plot` origin offsets as already-absolute module coords. States listed are exact.
Face = the way the wall looks (west for Pike Place faces of plots 1-3, east for the Economy's street face).

1. `plinthTo(g, {x0,x1,z0,z1, groundAt(x,z), wallY})` — for each cell in the box that is a footprint `#`, fill `stone_bricks` from y 0 to groundAt(x,z); then `stone_bricks` continues (the plinth) up to `wallY`. Every ~10th cell below y 6 is `mossy_stone_bricks`/`cracked_stone_bricks`. Never write outside the footprint.
2. `brickWall(g, {x0,x1,z0,z1, y0,y1, face})` — `bricks` shell, 1-block thick (2 on bluff faces), with `granite` 1 in 12 below the string course (Economy only); windows and openings per plan OPENINGS stay AIR.
3. `quoins(g, [x,z], y0, y1)` — alternating pairs: at each course the corner column is `smooth_sandstone` 2 long on even courses, 1 long on odd courses along both wall directions.
4. `pier(g, {at, face, y0, y1, width:2})` — 2-wide `bricks` column on the upper wall plane, down to ground; capped by `smooth_sandstone` (cut_sandstone for Sanitary) at the head.
5. `archOpening(g, {center, face, span:6, spring, crown, keystone:"chiseled_sandstone"})` — carves AIR from the floor to `spring`, then builds the arch: `brick_stairs` `half:"top"`, `facing` pointing UP the curve on the left half toward the centre, mirrored on the right; the crown cell is `smooth_sandstone` keystone; imposts `smooth_sandstone` at spring level on each side. Round arch is 6 wide, 3 courses of curve. For the atrium doorway use `smooth_sandstone_stairs` and a `quartz_block` keystone.
6. `windowFrame(g, {at, face, w:2, h:5, sill:"quartz_slab", head:"brick_stairs"})` — opening stays air, frame ring `smooth_quartz` one cell around, sill `quartz_slab` `type:"top"`, flat arch of `brick_stairs` `half:"top"` over it.
7. `litWindow(g, {at, face, w, h, lit:true})` — `glass_pane` filling the opening (connection states set by neighbours), one cell inside: `shroomlight` on alternate bays, `glowstone` where the interior is a stall; a `lantern` `hanging:"true"` just below the lintel inside the room.
8. `stripedAwning(g, {from, to, face, y, colours:["red","white"]})` — two courses stepping out: back course at edge+1 and y, front course at edge, y-1; alternating `red_wool`/`white_wool` (or `green_wool`/`white_wool`) every column along the run (1-wide stripes); `spruce_trapdoor` `open:"true"` `half:"top"` as a valance on the front lower edge hanging toward the street; keep the front edge to the footprint-edge cell.
9. `cornice(g, {x0,x1,z0,z1, y, face, dentils:true})` — row of `smooth_sandstone_stairs` `half:"top"`, `facing` = the face direction pointing out (top side towards the street), +1 proud into the edge band (`brick_stairs` for Economy and Garden); `bricks` dentils every other block under it.
10. `parapetCap(g, {box, y0, y1, coping})` — brick (or `smooth_sandstone` for Sanitary) 2 high wall around the roof edge, `coping` slab `type:"bottom"` on top; ties into the roof deck (`stone_bricks`/`polished_andesite` checker).
11. `skylightGable(g, {x0:23,x1:41,z0:19,z1:31, y0:36, ridgeZ:25, ribEvery:4})` — course by course (y36..42) rings of `glass` stepping in one cell per course from z19/z31 to a ridge at z25 (y42); `white_concrete` ribs at every 4th x (x23,27,31,35,39… and 41) running up the slopes; gable end triangles at x23 and x41 filled with `white_stained_glass_pane`; `shroomlight` row at y34, z21..29 under it; interior left air.
12. `bannerWord(g, "WORD", {center, face, letter, base})` / `plaque(g, ...)` — signs; banner letters in the colours of the plan MATERIALS; use the toolkit helper so the word reads left to right from the street.
13. `signboard(g, "TEXT", {at, face, mode:"wall"|"hanging", wood:"spruce"})` — a `spruce_wall_sign` row / `spruce_hanging_sign` under a `spruce_fence` bracket arm; `iron_chain` support.
14. `lanternBracket(g, {at, face})` — a `spruce_fence` arm one out from the pier, `lantern` `hanging:"true"` under its end; at pier heads at y 8-10 (floor+...).
15. `lampPost(g, {at, h:4})` — `spruce_fence` column `h` high on a `stone_bricks` base, `lantern` `hanging:"false"` on top; two cells from the footprint edge, only on ground cells.
16. `stallFit(g, {box, front, trade})` — counter along the front: `spruce_slab` `type:"top"` row on `spruce_planks`, back wall `spruce_planks`, shelf of `spruce_trapdoor`; goods per trade; `glowstone` in the ceiling every 3rd cell; one `lantern` `hanging:"true"` per bay.
17. `produceCrate(g, {at, kind})` — crate = `barrel` `facing:"up"`; row of produce blocks `melon`, `pumpkin`, `hay_block` alternating; `potted_fern`, `flower_pot`s on the counter top; stack at most 2 high.
18. `hangingLantern(g, {at, drop})` — `lantern` `hanging:"true"` under the arch crown on an `iron_chain` (`axis:"y"`) of `drop` cells.
19. `chimneyStack(g, {at:[x,z], y0:33, y1:38})` — 2×2 `bricks` column y33..38 with a `deepslate_bricks` ring at y36, then `brick_slab` cap ring (outward by one) at y38; solid, no flue.
20. `stairHouse(g, {box:[92,33,60,97,37,65]})` — brick box, door opening at z60 face (2 high, air), `stone_brick_slab` lid y38 slightly over.
21. `rooftopVent(g, {at})` — 2×2 `light_gray_concrete` box 2 high with a `stone_brick_slab` lid.
22. `rooftopPlanter(g, {box})` — a strip of `dirt` with `oak_leaves` `persistent:"true"` clumps and `potted_fern` on the parapet cap (Economy terrace, Garden Center roof).
23. `shopFront(g, {at, face, w:10, door:true})` — `spruce_planks` base y1, `glass_pane` y2..5, `spruce_door` (lower+upper, same facing/hinge, facing out) in the door cell, fascia of `spruce_planks` y7, lintel `stone_brick_slab`.
24. `fireEscape(g, {x0:211,x1:222,z0:0,z1:1, landings:[8,14]})` — landings of `polished_blackstone_slab` `type:"top"` with `iron_bars` rail one high around the open sides; a diagonal flight of `polished_blackstone_stairs` `facing` toward the high end between landings, `iron_bars` along it; a drop `ladder` `facing:"south"` (against the wall) from y8 down to y3.
25. `sanitaryPier(g, {at, face:"west"})` — `smooth_sandstone` 2 wide pier from ground to y10, `cut_sandstone` cap at y10.
26. `gardenPot(g, {at})` — `potted_fern` or `potted_azalea_bush` on a full block top/bottom slab-free; window box = `spruce_trapdoor` `open:"true"` flat with `potted_fern` above.

## ROOMS (exterior-visible only; stalls and the atrium)

Floors: stall floor `spruce_planks`; atrium `smooth_sandstone`. No interior walls; each room is the 3-deep lit space behind an open front, designed to read from outside. Interior designers: stalls, never more than 3 deep.

Rooms (inner air):
- Economy atrium (E5 entrance hall): [43,13,49,46,25,58]; door x45..46 at z59.
- Economy Pike Place street-storey stall band: [50,18,3,52,24,29]; seen through windows x55 at z3..29 (plane edge); also x52 door z36..37.
- Corner C1 stalls: [79,8,32,82,14,53]; C2 stalls: [73,6,56,76,14,77]; C3 stalls: [67,4,80,70,14,93].
- Corner C3 south stalls (Pike St): [68,4,91,73,14,93] (merged with C3 corner; arches x68..73 and 76..81 on z94).
- Sanitary S1 shops: [131,2,82,134,9,119]; S1b shops: [131,2,120,134,9,143].
- Sanitary entrance hall: [131,2,109,136,9,114].
- Sanitary S6 shops: [159,4,8,162,10,39].
- Garden Center shop A: [215,2,4,218,6,13]; shop B: [215,2,16,218,6,25].

## PARTS

1. P1 `parts/economy.mjs` Economy shell + roof + skylight: plinthTo for E1-E5 down to ground, brickWall all masses, floors, openings per table, E6 skylightGable, flat roofs, cornices, parapets, E4 terrace rail (rooftopPlanter). Elements: Economy walls, roof, skylight, west face.
2. P2 `parts/corner.mjs` Corner shell + roof: C1-C4 shells, plinth, piers, cornice, parapet, chimneyStack x2, stairHouse, sign panel base.
3. P3 `parts/sanitary-garden.mjs`: S1-S7 shell, piers, entrance, roof/parapet/vents; Garden Center G1/G2 shell and roof, openings.
4. P4 `parts/economy-corner-facade.mjs`: archOpening, windowFrame, litWindow, stripedAwning, quoins, bannerWord, atriumArch, name block, CORNER MARKET panel.
5. P5 `parts/sanitary-garden-facade.mjs`: stripedAwning, signboard, bannerWord (SANITARY PUBLIC MARKET), litWindow, shopFront, fireEscape, window boxes, hanging signs.
6. P6 `parts/stalls-lights.mjs`: stallFit/produceCrate for all rooms, hangingLantern, lanternBracket, lampPost, gardenPot, rooftop plantings, glow.

Checklist: [x] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6

## NOTES FOR WORKERS
- Each plot's y 0 is its lowest ground; use the GROUND maps in brief with 3x3 (plot 0,1), 4x4 (plot 2), 2x2 (plot 3) cells per char.
- Do not write outside the `#` cells. Edge bands carry projections only.
- 1.21.1 only. Lanterns hang on chains; awnings sit in edge band; leaves persistent.
- Stairs: top-half stairs make arches; face direction per `$MCD states`.
- Rooms get furnished by their designers; stalls are lit (light >= 8) and must show from outside.
- Sign words via `bannerWord`/`plaque` only.
