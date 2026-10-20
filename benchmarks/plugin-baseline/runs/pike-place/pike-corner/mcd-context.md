# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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

Checklist: [ ] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6

## NOTES FOR WORKERS
- Each plot's y 0 is its lowest ground; use the GROUND maps in brief with 3x3 (plot 0,1), 4x4 (plot 2), 2x2 (plot 3) cells per char.
- Do not write outside the `#` cells. Edge bands carry projections only.
- 1.21.1 only. Lanterns hang on chains; awnings sit in edge band; leaves persistent.
- Stairs: top-half stairs make arches; face direction per `$MCD states`.
- Rooms get furnished by their designers; stalls are lit (light >= 8) and must show from outside.
- Sign words via `bannerWord`/`plaque` only.
```

### elements.md

```markdown
# Required elements — Pike Place south & east markets

Coordinates are MODULE coordinates (plan.md). Part numbers: P1 Economy shell+roof, P2 Corner shell+roof,
P3 Sanitary+Garden shell+roof, P4 Economy+Corner facade fittings, P5 Sanitary+Garden facade fittings,
P6 stalls, lights and grounds (all four). Helpers are in plan.md VOCABULARY. "Open front" = left as air by the shell.

## Whole module
- [ ] **Ground-hugging plinths** — every wall column runs from the cell's GROUND height (plan GROUND maps, +plot y 0) up; `plinthTo` fills `stone_bricks` (1 in 10 `mossy_stone_bricks`/`cracked_stone_bricks`, low only) from y 0 to the ground under each wall cell, so west faces show their extra lower storeys and nothing floats or is buried. P1-P3, helper `plinthTo`.
- [ ] **Dusk glow** — every glass bay backed by lit blocks: `litWindow` (glass_pane in a quartz frame, `shroomlight` or `glowstone` one cell behind every second bay, `lantern` hanging inside near the top). P4, P5; P6 for stalls.
- [ ] **Sound footprint** — nothing outside the `#` cells; the street-edge bands only carry projections (awning, banner, bracket, cornice nose).

## Economy Market (plot 0)
- [ ] **Red-brown brick walls, 2 storeys above the Pike Place street floor** (+ 4 storeys on the west bluff face): `bricks` body, `granite` 1 in 12 in lower storeys, `smooth_sandstone` string course y 26, quoins at corners and jogs. E1 x9..53 z12..38, E1b, E2 x51..56 z0..11, E3, E4, E5. P1 (`brickWall`, `quoins`).
- [ ] **Flat roof with parapet** — deck y 35 `stone_bricks`/`polished_andesite`, parapet y 36..37 brick + `smooth_stone_slab` coping, cornice y 33..34 upside-down `brick_stairs` +1 proud; E2 deck y 42 parapet 43..44 with a lantern flagpole (`spruce_fence` ×3 + `lantern`) on top; E4 roof terrace y 17 with `iron_bars` rail and planters. P1 (`cornice`, `parapetCap`, `rooftopPlanter`).
- [ ] **Skylit atrium roof E6** — hand-built glass gable x23..41 z19..31 y36..42, ridge along x at z25: `glass` slopes stepping in 1 per course, `white_concrete` ribs every 4 x, glazed gable ends (`white_stained_glass_pane` fans), `shroomlight` at y34 beneath so it glows. P1 (`skylightGable`).
- [ ] **Arched glass atrium doorway off Pike Street** (E5, z59, x44..47): `smooth_sandstone` piers x44/x47, upside-down `smooth_sandstone_stairs` arch springing y18 crown y21, `quartz_block` keystone y22, glazed fan `glass_pane` y16..20 x45..46; the door cells x45..46 y13..15 stay AIR (open glass-lobby, lit atrium behind); cream band y23..25 with "ECONOMY" banner letters, stepped cream parapet to y28, lantern each side at y16. P4 (`atriumArch`, `bannerWord`), lit room via P6.
- [ ] **White-framed street windows** — 3-wide shop windows y19..23 and 2-wide upper windows y28..32 on x55/52/49 planes; `smooth_quartz` frames, `quartz_slab` sills, `smooth_quartz` heads with `smooth_sandstone` keystone. P4 (`litWindow`, `windowFrame`).
- [ ] **Red/white and green/white striped awnings** over street-storey windows at y24, edge band, two courses stepping out. P4 (`stripedAwning`).
- [ ] **Name block "ECONOMY MARKET"** on E2 x55 panel z1..10 y36..41, banner letters red on cream, two lines (ECONOMY y39..40, MARKET y36..37), letters one cell proud at x56. P4 (`bannerWord`/`plaque`).
- [ ] **E2 tall arched window** x55 z4..7 y28..34 with sandstone arch. P4 (`archOpening`).
- [ ] **West bluff face** — `stone_bricks` base to y9, 4 window rows y4..7 (`iron_bars` over glass), 11..15, 19..24, 28..32; E4 annex arched windows y3..7 and y10..14; planted roof terrace. P1 shell openings, P4 glazing.
- [ ] **Lit stalls behind the street windows** (x50..52, z3..29, y18..24) and the atrium: counters, produce, lanterns. P6 (`stallFit`, `produceCrate`).

## Corner Market (plot 1)
- [ ] **Three storeys red-brown brick**, floors C1 y7 / C2 y5 / C3-C4 y3, 2nd y16, 3rd y24, roof y32. P2 (`brickWall`).
- [ ] **Big round arches, ground storey** — 6 wide, between 2-wide brick piers every 8, springing floor+5, crown y15 level along the face; `brick_stairs` upside down, `smooth_sandstone` keystone and imposts; west face (z32..37 … 80..93) and south face (x68..73, 76..81, 88..93, 96..101). P4 (`archOpening`, `pier`).
- [ ] **Open produce stalls under canvas awnings** — recessed to edge+3; red/white and green/white wool-stripe awning in each arch mouth at floor+5; barrels, melon, pumpkin, hay_block crates; lanterns hung from the arch crown. P4 (`stripedAwning`), P6 (`stallFit`, `produceCrate`, `hangingLantern`).
- [ ] **Tall windows in white frames** — 2 wide ×5 high at y18..22 and y26..30, pairs every 4, `brick_stairs` flat arches, `quartz_slab` sills; string courses y16 and y24 `smooth_sandstone`. P4 (`windowFrame`, `litWindow`).
- [ ] **Cornice and parapet** — y30..31 upside-down `smooth_sandstone_stairs` +1 proud, `brick` dentils every other block; parapet y33..34, `smooth_sandstone_slab` coping. P2 (`cornice`, `parapetCap`).
- [ ] **"CORNER MARKET" raised sign panel** on C2 west x72, y33..36, cream banner letters on red. P4 (`bannerWord`).
- [ ] **Roof chimney stacks (2)** `bricks` 2×2 at x80..81 z40..41 and x98..99 z86..87, y33..38, `deepslate_bricks` band y36, slab cap 37..38; **stair house** x92..97 z60..65 y33..37, brick, `stone_brick_slab` lid, one door opening. P2 (`chimneyStack`, `stairHouse`; solid masonry stacks, no fire needed).
- [ ] **Quoins** `smooth_sandstone` at corners, alternating 2/1. P2 (`quoins`).

## Sanitary Market (plot 2)
- [ ] **Long cream stucco block, stepped west curve** — `smooth_sandstone` body, `cut_sandstone` bands, steps x128→132→136→144→152→156. P3.
- [ ] **Open-fronted shops with piers** — `smooth_sandstone` 2-wide piers every 8 with `cut_sandstone` caps y10; shops recessed to edge+3, floor y1 (S5 y2, S6 y3) to y9. P3 (`sanitaryPier`), P5, P6.
- [ ] **Striped awnings** red/white, green/white alternating, y9 at edge+2, y8 at edge. P5 (`stripedAwning`).
- [ ] **Painted shop signs** on each fascia y11: `spruce_wall_sign`/banner boards. P5 (`signboard`).
- [ ] **"SANITARY PUBLIC MARKET" lettering** green banner letters, 22 columns, z100..123, edge band x128, over the entrance. P5 (`bannerWord`).
- [ ] **Entrance** x129 z109..114 y2..9 framed in `smooth_quartz`; sign parapet S7 x129..130 z104..119 to y30 with second "SANITARY" at y26..27 z108..115. P3 shell + P5.
- [ ] **Small upper windows** 2×3 at y16..18, white quartz frames, 2 per bay. P5 (`litWindow`).
- [ ] **Flat roof, cornice y22, parapet y24..25 quartz coping; rooftop vents** 2×2 `light_gray_concrete` every ~20 z. P3 (`cornice`, `parapetCap`, `rooftopVent`).
- [ ] **Lit stalls** (barrels, produce, lanterns) in every bay. P6.

## Garden Center Building (plot 3)
- [ ] **Small two-storey brick building**, ground y1, upper y8, roof y15. P3.
- [ ] **Two west shopfronts** z4..13 and z16..25 recessed to x214: `glass_pane` y2..5 over `spruce_planks` base y1, doors z8..9 and z20..21 (`spruce_door`, both halves), green/white awning x211..212 y6, fascia sign y7. P5 (`shopFront`, `stripedAwning`).
- [ ] **Upper windows** x212 z6..7, 13..14, 20..21 y9..12, white frames. P5.
- [ ] **"GARDEN CENTER" panel** x212 z9..20 y15..17, green banner letters on cream `smooth_sandstone`. P5 (`bannerWord`).
- [ ] **Fire escape on Post Alley (north) face** x211..222 z0..1: `polished_blackstone_slab` (top) landings y8 and y14, `iron_bars` rails, diagonal `polished_blackstone_stairs` flight between, drop ladder (`ladder`) to y3. P5 (`fireEscape`).
- [ ] **Post Alley door** x230..231 z2 y3..4 and windows x214..215, 219..220 y9..12. P3 openings, P5.
- [ ] **Rooftop and window-box plants** `potted_fern`, `oak_leaves` (persistent) clumps along the parapet. P6 (`gardenPot`).

## Dusk extras (expected by a viewer)
- [ ] **Street lamps** along Pike Place: `lampPost` (`spruce_fence` ×4 + `lantern`) every 10 z along the x edge bands, on the ground cell. P6.
- [ ] **Bracket lanterns** at every pier head (`lanternBracket`). P6.
- [ ] **Hanging blade signs** over Sanitary and Garden shops (`signboard` hanging). P5.
```

### rooms.json

```json
{"entrance":[45,13,60],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{"roles":{"brick body":["bricks","brick_stairs","brick_slab"],"cream trim":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab"],"white frames":["smooth_quartz","quartz_block","quartz_stairs","quartz_slab","smooth_quartz_slab"],"plinth and deck":["stone_bricks","stone_brick_stairs","stone_brick_slab"],"glass":["glass"],"awnings":["red_wool","white_wool","green_wool"],"shop fittings":["spruce_planks","spruce_stairs","spruce_slab"],"fire escape":["polished_blackstone_slab","polished_blackstone_stairs"],"light":["lantern","shroomlight","glowstone","chain","candle"],"produce":["melon","pumpkin","hay_block","barrel","composter","orange_wool","yellow_wool"],"skylight and vents":["white_concrete","light_gray_concrete"],"banners":["red_banner","green_banner","white_banner"],"chimney band":["deepslate_bricks"],"frame detail":["white_terracotta"],"Brick walls, pilasters and chimneys":["bricks","brick_stairs","brick_slab","brick_wall","granite"],"Cream walls and stepped arches":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab"],"White frames, cornices and trim":["smooth_quartz","quartz_stairs","quartz_slab"],"Foundations, retaining walls, paving and stairs":["stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall"],"Flat roofs, parapet caps and vents":["gray_concrete","stone_slab","stone_brick_slab","stone_bricks"],"Atrium glazing and windows":["glass","glass_pane","white_stained_glass_pane"],"Striped awnings":["red_wool","white_wool","green_wool"],"Fire escape and metal rails":["iron_bars","stone_brick_stairs","stone_brick_slab"],"Shopfronts, counters, crates and signage":["spruce_planks","spruce_stairs","spruce_slab","spruce_fence","spruce_trapdoor","spruce_door","spruce_sign"],"Warm dusk lighting":["lantern","glowstone"],"Shop objects and planting":["barrel","chest","flower_pot","potted_fern","pumpkin","melon","oak_leaves"]},"objects":["granite","brick_wall","cut_sandstone","cut_sandstone_slab","chiseled_sandstone","mossy_stone_bricks","cracked_stone_bricks","stone_brick_wall","polished_andesite","smooth_stone_slab","glass_pane","white_stained_glass_pane","red_carpet","white_carpet","green_carpet","spruce_fence","spruce_trapdoor","spruce_door","spruce_wall_sign","spruce_hanging_sign","spruce_log","iron_bars","iron_trapdoor","ladder","flower_pot","dirt","potted_fern","potted_red_tulip","potted_azalea_bush","oak_leaves","flowering_azalea_leaves","spruce_sign","spruce_planks","spruce_stairs","spruce_slab","barrel","chest","pumpkin","melon","lantern","glowstone","glass","red_wool","white_wool","green_wool"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which is moved into place only when the build succeeds.
set -eu
cd "$(dirname "$0")"
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv -f "$tmp" build.nbt
echo "build.nbt written"
```

### build.mjs

```js
// Pike Place south and east markets: the site grid, the ground from the footprint maps, then every part in plan order.
// usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file and moves the result to build.nbt)
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, groundAt } from "./vocab/base.mjs";

// the parts in plan order; each file exports build(g). A part not written yet is skipped, never an error.
const PARTS = [
  ["Economy shell and roof", "parts/economy.mjs"],
  ["Corner shell and roof", "parts/corner.mjs"],
  ["Sanitary and Garden shell and roof", "parts/sanitary-garden.mjs"],
  ["Economy and Corner facade fittings", "parts/economy-corner-facade.mjs"],
  ["Sanitary and Garden facade fittings", "parts/sanitary-garden-facade.mjs"],
  ["Stalls, lights and grounds", "parts/stalls-lights.mjs"],
];

// the ground under each footprint cell: stone up to its height, a stone brick street course on top (parts overwrite it)
function layGround(g) {
  let n = 0;
  for (let x = 0; x < SITE.x; x++) for (let z = 0; z < SITE.z; z++) {
    const h = groundAt(x, z);
    if (h === null) continue;
    for (let y = 0; y < h; y++) { g.set(x, y, z, "stone"); n++; }
    g.set(x, h, z, "stone_bricks"); n++;
  }
  console.log(`ground: ${n} blocks under the footprint`);
}

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const g = new Grid([SITE.x, SITE.y, SITE.z], { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);
const list = [];
for (const [name, file] of PARTS) {
  if (!existsSync(file)) { console.log(`part ${name}: ${file} not written yet, skipped`); continue; }
  list.push([name, (await import(`./${file}`)).build]);
}
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}: ${g.cells.size} cells`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the Pike Place build: palette ids (palette.json only), site coordinates, ground lookup, seeded rng.

// ---- palette (every id is in palette.json; the role is the comment) ---------------------------------------------------
export const BRICKS = "bricks"; // brick body

export const BRICK_STAIRS = "brick_stairs"; // brick body

export const BRICK_SLAB = "brick_slab"; // brick body

export const SMOOTH_SANDSTONE = "smooth_sandstone"; // cream trim

export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs"; // cream trim

export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab"; // cream trim

export const SMOOTH_QUARTZ = "smooth_quartz"; // white frames

export const QUARTZ_BLOCK = "quartz_block"; // white frames

export const QUARTZ_STAIRS = "quartz_stairs"; // white frames

export const QUARTZ_SLAB = "quartz_slab"; // white frames

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // white frames

export const STONE_BRICKS = "stone_bricks"; // plinth and deck

export const STONE_BRICK_STAIRS = "stone_brick_stairs"; // plinth and deck

export const STONE_BRICK_SLAB = "stone_brick_slab"; // plinth and deck

export const GLASS = "glass"; // glass

export const RED_WOOL = "red_wool"; // awnings

export const WHITE_WOOL = "white_wool"; // awnings

export const GREEN_WOOL = "green_wool"; // awnings

export const SPRUCE_PLANKS = "spruce_planks"; // shop fittings

export const SPRUCE_STAIRS = "spruce_stairs"; // shop fittings

export const SPRUCE_SLAB = "spruce_slab"; // shop fittings

export const POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab"; // fire escape

export const POLISHED_BLACKSTONE_STAIRS = "polished_blackstone_stairs"; // fire escape

export const LANTERN = "lantern"; // light

export const SHROOMLIGHT = "shroomlight"; // light

export const GLOWSTONE = "glowstone"; // light

export const CHAIN = "chain"; // light

export const CANDLE = "candle"; // light

export const MELON = "melon"; // produce

export const PUMPKIN = "pumpkin"; // produce

export const HAY_BLOCK = "hay_block"; // produce

export const BARREL = "barrel"; // produce

export const COMPOSTER = "composter"; // produce

export const ORANGE_WOOL = "orange_wool"; // produce

export const YELLOW_WOOL = "yellow_wool"; // produce

export const WHITE_CONCRETE = "white_concrete"; // skylight and vents

export const LIGHT_GRAY_CONCRETE = "light_gray_concrete"; // skylight and vents

export const RED_BANNER = "red_banner"; // banners

export const GREEN_BANNER = "green_banner"; // banners

export const WHITE_BANNER = "white_banner"; // banners

export const DEEPSLATE_BRICKS = "deepslate_bricks"; // chimney band

export const WHITE_TERRACOTTA = "white_terracotta"; // frame detail

export const GRANITE = "granite"; // objects and other

export const BRICK_WALL = "brick_wall"; // objects and other

export const CUT_SANDSTONE = "cut_sandstone"; // objects and other

export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab"; // objects and other

export const CHISELED_SANDSTONE = "chiseled_sandstone"; // objects and other

export const MOSSY_STONE_BRICKS = "mossy_stone_bricks"; // objects and other

export const CRACKED_STONE_BRICKS = "cracked_stone_bricks"; // objects and other

export const STONE_BRICK_WALL = "stone_brick_wall"; // objects and other

export const POLISHED_ANDESITE = "polished_andesite"; // objects and other

export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // objects and other

export const GLASS_PANE = "glass_pane"; // objects and other

export const WHITE_STAINED_GLASS_PANE = "white_stained_glass_pane"; // objects and other

export const RED_CARPET = "red_carpet"; // objects and other

export const WHITE_CARPET = "white_carpet"; // objects and other

export const GREEN_CARPET = "green_carpet"; // objects and other

export const SPRUCE_FENCE = "spruce_fence"; // objects and other

export const SPRUCE_TRAPDOOR = "spruce_trapdoor"; // objects and other

export const SPRUCE_DOOR = "spruce_door"; // objects and other

export const SPRUCE_WALL_SIGN = "spruce_wall_sign"; // objects and other

export const SPRUCE_HANGING_SIGN = "spruce_hanging_sign"; // objects and other

export const SPRUCE_LOG = "spruce_log"; // objects and other

export const IRON_BARS = "iron_bars"; // objects and other

export const IRON_TRAPDOOR = "iron_trapdoor"; // objects and other

export const LADDER = "ladder"; // objects and other

export const FLOWER_POT = "flower_pot"; // objects and other

export const DIRT = "dirt"; // objects and other

export const POTTED_FERN = "potted_fern"; // objects and other

export const POTTED_RED_TULIP = "potted_red_tulip"; // objects and other

export const POTTED_AZALEA_BUSH = "potted_azalea_bush"; // objects and other

export const OAK_LEAVES = "oak_leaves"; // objects and other

export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves"; // objects and other

// ---- site (module coordinates, inclusive; each plot starts at its own y 0) ----------------------------------------------
/** Full module size: the grid is x 0..252, y 0..84, z 0..154. */
export const SITE = { x: 253, y: 85, z: 155 };

/** Plot 0: Economy Market (street face east, +x). */
export const ECONOMY = { x0: 0, x1: 57, z0: 0, z1: 101, maxY: 84 };

/** Plot 1: Corner Market (street face west, -x; Pike Street south). */
export const CORNER = { x0: 62, x1: 123, z0: 0, z1: 101, maxY: 62 };

/** Plot 2: Sanitary Market (street face west, -x, ~64 long). */
export const SANITARY = { x0: 128, x1: 206, z0: 0, z1: 154, maxY: 53 };

/** Plot 3: Garden Center Building (shopfronts west, Post Alley north). */
export const GARDEN = { x0: 211, x1: 252, z0: 0, z1: 31, maxY: 33 };

/** Ground height above the plot's y 0 at (x, z), from the footprint maps; null off the footprint. */
export function groundAt(x, z)

/** True when (x, z) is a footprint cell (# on the map): mass and wall cells must be on it. */
export const onFootprint = (x, z) => ...

/** A seeded random source: rng(seed)() gives numbers in [0, 1), the same sequence for the same seed. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Vocabulary H1 (plan.md VOCABULARY 1, 4, 7, 10, 13, 16, 19, 22, 25): plinthTo, pier, litWindow, parapetCap,
// signboard, stallFit, chimneyStack, rooftopPlanter, sanitaryPier. Each takes its position as an argument and writes
// only inside the footprint it is given, into air only. `over: true` lets a helper replace non-air inside its own
// footprint; plinthTo uses it for the ground under the walls, as the plan specifies.

// plinthTo(g, {x0,x1,z0,z1, groundAt(x,z), wallY, footprint?}): stone from y 0 up to the ground under each footprint
// cell (over the ground), then on up to wallY (into air). footprint(x, z) limits it to the # cells; default: the box.
export function plinthTo(g, { x0, x1, z0, z1, groundAt, wallY, footprint = () => ...

// pier(g, {at:[x,z], face, y0, y1, width:2, cap?}): a 2-wide brick column on the wall plane from y0 to y1, capped
// at y1 with `cap` (smooth_sandstone by default).
export function pier(g, { at, face, y0, y1, width = 2, cap = "smooth_sandstone" })

// litWindow(g, {at:[x,y,z], face, w, h, lit?, light?}): glass_pane across the opening (at = its lower corner on the
// wall plane, face = the way the wall looks). lit: a light one cell inside on alternate bays, mid-height, and a
// lantern hanging under the lintel inside (a chain up to the ceiling where the room has one; otherwise no lantern).
export function litWindow(g, { at: [x, y, z], face, w, h, lit = true, light = "shroomlight" })

// parapetCap(g, {box:[x0,z0,x1,z1], y0, y1, coping, wall?}): a ring of `wall` (bricks) around the roof edge from y0
// up to y1 - 1, and the `coping` slab (type bottom) at y1 on top. Air only, so the roof deck below stays as it is.
export function parapetCap(g, { box: [x0, z0, x1, z1], y0, y1, coping, wall = "bricks" })

// signboard(g, "TEXT", {at:[x,y,z], face, mode?, wood?}): one sign at `at`, the cell in front of the wall.
// mode "wall": a spruce_wall_sign facing `face` (out from the wall). mode "hanging": a hanging sign, a chain up to
// a fence arm that reaches out from the wall on the cell above (the arm joins the wall, at y + 2).
export function signboard(g, text, { at: [x, y, z], face, mode = "wall", wood = "spruce" })

// stallFit(g, {box:[x0,y0,z0,x1,y1,z1], front, trade?}): a stall in its room box, the open side at `front`.
// Front layer: spruce_planks counter, a bottom spruce slab on it, goods on every other cell. Back layer: a planks
// wall with open spruce-trapdoor shelves. Between them a 2-high clear lane. Glowstone in the ceiling every third
// cell, a hanging lantern under each one in the middle lane layer. Needs 3 deep and 3 high (the stall is never deeper).
export function stallFit(g, { box: [x0, y0, z0, x1, y1, z1], front, trade = "produce" })

// chimneyStack(g, {at:[x,z], y0?, y1?}): a solid 2x2 brick stack (no flue), a deepslate_bricks band at y 36, and a
// brick_slab cap ring one cell outside it at the top (y1). The stack's 4x4 footprint is the bounds.
export function chimneyStack(g, { at: [x, z], y0 = 33, y1 = 38 })

// rooftopPlanter(g, {box:[x0,y0,z0,x1,y1,z1]}): a dirt bed on the box's bottom layer (sit it on the parapet cap),
// with persistent oak_leaves clumps on the layer above and a potted_fern every third cell.
export function rooftopPlanter(g, { box: [x0, y0, z0, x1, y1, z1] })

// sanitaryPier(g, {at:[x,z], face?}): a 2-wide smooth_sandstone pier from the ground (the first solid cell under the
// air) up to y 9, with a cut_sandstone cap at y 10. face defaults to west.
export function sanitaryPier(g, { at, face = "west" })
```

### vocab/h2.mjs

```js
// Named helpers from plan.md's VOCABULARY, group h2: the brick wall, the round arch opening, the striped awning, the
// skylight gable, the lantern bracket, the produce crate, the stair house, the shop front and the garden pot.
//
// Every helper takes the grid first, then its position (and facing where it has one), and returns
// { box, placed, refused }: its footprint box (inclusive corners), how many cells it wrote, and any write it left out.
// Writes stay inside the footprint, go only into air, and never reach y 0: ground, sand and floors belong to earlier
// parts. archOpening is the one exception to "only into air": it cuts the wall cells inside its own opening.
// States are written as plain objects with the properties `$MCD states` lists for 1.21.1.

/**
 * A 1-block brick shell around the box x0..x1, z0..z1, y0..y1 (the face side is 2 thick when bluff). Granite 1 in 12
 * below stringY when granite is set. keepAir: boxes [x0,y0,z0,x1,y1,z1] of windows and openings left air.
 */
export function brickWall(g, { x0, x1, z0, z1, y0, y1, face: f, bluff = false, granite = false, stringY = null, keepAir = [] })

/**
 * A 6-wide round arch cut through the wall plane at `center` = [x, y0, z]: y0 is the first air row (the floor is below
 * it, never touched), the centre cell is the first cell of the right half (u = 0), and the crown is spring + 2.
 * Imposts smooth_sandstone at spring; stairs (`${stairs}_stairs`, top half) on the curve, rising toward the centre;
 * keystone on the two crown cells. depth: cells through the wall, from the wall's outer face inwards.
 */
export function archOpening(g, { center: [cx, y0, cz], face: f, span = 6, spring, crown, keystone = "chiseled_sandstone", stairs = "brick", depth = 1 })

/**
 * Two courses of 1-wide wool stripes along a footprint edge, with an open spruce trapdoor valance under the outer course.
 * from/to = [x, z] at the edge (they share the edge coordinate); the run goes from `from` to `to` along the wall.
 * Back course at edge+1 (outward) and y; front course at the edge and y-1.
 */
export function stripedAwning(g, { from, to, face: f, y, colours = ["red", "white"] })

/**
 * The gable skylight: at each course y0..y0+K, glass rings at the two slope edges (z = z0+k and z1-k), white panes on the
 * gable triangles at x0 and x1, white concrete ribs every `ribEvery` from x0 along the slopes, interior air. The slopes
 * meet at ridgeZ on the top course (y0 + K). A shroomlight row sits at lightY over z = lightZ, under the middle.
 */
export function skylightGable(g, { x0 = 23, x1 = 41, z0 = 19, z1 = 31, y0 = 36, ridgeZ = 25, ribEvery = 4, lightY = 34, lightZ = [21, 29] } = {})

/** A lantern on a spruce fence arm, one cell out from the pier at `at` (the pier cell), hanging under the arm's end. */
export function lanternBracket(g, { at: [x, y, z], face: f })

/**
 * A row of barrels (facing up) from `at` along the axis, with produce on each barrel (melon, pumpkin, hay alternating;
 * kind "pots" puts potted plants and flower pots instead). Two high at most.
 */
export function produceCrate(g, { at: [x, y, z], kind = "produce", length = 3, axis = "x" })

/**
 * A hollow brick box (the floor and roof rings included) with a 1-wide, 2-high air door in its z0 face at the middle of
 * x, and a stone brick slab lid at y 38 overhanging the box by one cell.
 */
export function stairHouse(g, { box: [x0, y0, z0, x1, y1, z1] })

/**
 * A shop front on the wall plane of `face`, `w` cells long from `at` = [x, y0, z] (the run goes +z or +x from it):
 * spruce planks at y0+1, glass panes y0+2..y0+5, stone brick slab lintel at y0+6, spruce planks fascia at y0+7.
 * door: a spruce door (both halves, facing out) at the middle cell, its glass above it.
 */
export function shopFront(g, { at: [x, y0, z], face: f, w = 10, door = true })

/**
 * A garden pot at `at` (potted_fern or potted_azalea_bush) standing on a full block below it; refused when the cell below
 * is not a full block. box: a window box instead, a spruce trapdoor (open, facing the wall) with the plant above it.
 */
export function gardenPot(g, { at: [x, y, z], plant = "potted_fern", box = false, face: f = "north" })
```

### vocab/h3.mjs

```js
// Pike Place vocabulary, part 3: the eight plan.md helpers that set block states the others leave out.
// Each helper takes its own position (and facing) as arguments and writes only inside the footprint those
// arguments define, only into air. quoins is the one exception: it replaces the brick it corners (over, default on).
// Block ids are plan.md's PALETTE, checked on 1.21.1; iron chain is `chain` there, not `iron_chain`.

/** Corner quoins up the column [x, z] from y0 to y1: smooth_sandstone 2 long along both walls on even courses, 1 long on odd. */
export function quoins(g, [x, z], y0, y1, { dirs = [1, 1], over = true } = {})

/** Window frame one cell proud of the wall around a w x h opening; `at` is its lower-left cell seen from the street. */
export function windowFrame(g, { at, face: f, w = 2, h = 5, sill = "quartz_slab", head = "brick_stairs" })

/** Cornice row at height y on the outer column of the box x0..x1 x z0..z1 (one proud of the wall), stairs lip out, bricks dentils under every other block. */
export function cornice(g, { x0, x1, z0, z1, y, face: f, dentils = true, material = "smooth_sandstone" })

/** Banner letters reading left to right from the street, centred on `center`; only the row the word covers, only into air. */
export function bannerWord(g, word, { center, face: f = "south", letter = "red", base = "white" })

/** Street lamp: stone_bricks base in the first cell above ground at `at`, h spruce fence posts, a standing lantern on top. */
export function lampPost(g, { at, h = 4 })

/** Lantern at `at` hung on `drop` chain links from the block drop + 1 cells above (the arch crown). Places nothing if that block is air. */
export function hangingLantern(g, { at, drop = 1 })

/** Rooftop vent: a 2 x 2 x 2 light_gray_concrete box from its low corner `at`, stone_brick_slab lid on top. */
export function rooftopVent(g, { at })

/**
 * Fire escape across x0..x1 x z0..z1 (z1 side against the building): polished_blackstone_slab landings at
 * landings[0] and [1], iron_bars rails one up on the open sides, a stair flight rising east between them (its
 * outer rail along z0), and a ladder down the z1 end to ladderTo, facing out, back to the building.
 * Writes only air, so a landing, step or rail that is already built is left as it is.
 */
export function fireEscape(g, { x0, x1, z0, z1, landings = [8, 14], ladderTo = 3 })
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
