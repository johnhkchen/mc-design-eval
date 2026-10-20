# MoPOP: plan of the form (architect)

## SITE

Plot 0: x 0..101, z 0..152, y 0..46. Ground y 0 = smooth_stone (1 block); every ground-floor surface stands on y 0, the floors start at y 1. North = low z (the street side, toward the Space Needle), east = high x. No turning.

**Footprint mask** (from the map, 1 char = 4x4). Nothing of the building outside these x spans; `.` cells are plaza.

| z | building x | z | building x |
|---|---|---|---|
| 0..3 | 68..87 | 60..67 | 12..99 |
| 4..7 | 64..91 | 68..79 | 8..95 |
| 8..11 | 56..95 | 80..83 | 8..99 |
| 12..15 | 52..99 | 84..87 | 8..95 |
| 16..19 | 20..27, 52..99 | 88..99 | 12..95 |
| 20..23 | 8..39, 48..95 | 100..103 | 8..95 |
| 24..27 | 8..91 | 104..107 | 4..95 |
| 28..35 | 8..99 | 108..111 | 8..91 |
| 36..47 | 0..99 | 112..119, 124..135 | 8..87 |
| 48..55 | 0..95 | 120..123 | 8..91 |
| 56..59 | 4..95 | 136..139 | 12..87 |
| | | 140..143 | 12..83 |
| | | 144..147 | 12..71 |
| | | 148..151 | 16..67 |

**The idea:** seven free-form metal shells, each its own colour, standing in two groups either side of a straight north-south **monorail street** (x 43..51) that runs through the whole plot; one blue shell bridges over the track and the train stands under it. Every shell is a HOLLOW heightmap shell (thickness 1), surfaces rounded to half blocks: stairs on every step, slabs on the gentle crown, upside-down stairs under every overhang (the curved brush's `dome` with a custom profile on an elliptical plan, or the same heightmap by hand). No flat box faces: walls lean or bulge, crowns curve.

**Hard envelope:** x 43..51, y 8..17 is the train's corridor for the whole length z 0..152; no shell, floor, light or decor in it except the beams, pylon caps and the train. Every shell is also clipped to the footprint mask.

### Masses (build order = overlap order: a later shell tucks behind an earlier one where they meet)

Plan = ellipse centre (cx, cz), radii (rx, rz) at y 1. "Billow" = the section grows by the given factor at that height (bulge), then the crown curves in to the top.

| # | Mass | Colour | Plan centre / radii | Extent at base | Profile (section factor by y) | Top |
|---|---|---|---|---|---|---|
| 1 | PURPLE drum (Sky Church) | deep purple | (73, 33), rx 18, rz 31 north / 25 south (egg) | x 55..91, z 2..58 | near-vertical barrel: 1.00 at y1, 1.03 at y18..30 (bulge, north and west faces only), 1.00 at the rim | rim slopes y 44 at the north end (z 2..14) down to y 38 at the south end (z 58), rim edge rolled out 1 (upside-down stairs); inside the rim a shallow crown of slabs 2 below the rim |
| 2 | SILVER A, big NW form | polished silver | (23, 44), rx 19, rz 18 | x 4..42, z 26..62 | 1.00 at y1..6, 1.10 at y14..24 (billows out W and N, the crumpled overhang), 0.85 at y32, dome to the top | crown y 40 at (21, 40), sagging to y 34 at the south edge |
| 2a | SILVER hood (north lip of A) | silver | (25, 27), rx 14, rz 6 | x 11..39, z 21..33 | a draped lip: its underside lifts to y 8 over x 26..39 (the north lobby under it), comes to the ground at x 11..25; top rolls into A | y 30 |
| 2b | SILVER fin | silver | box x 20..27, z 16..21 | | a tapered blade: 8 wide at y1, leaning south, 3 wide at the top, its top edge curved | y 20 |
| 3 | BLUE body | sky blue | (74, 84), rx 20, rz 22 | x 54..94, z 62..106 | 1.00 at y1, 1.06 at y20..26 (billow E and S), crown rolls over in a big rounded lip | y 34 |
| 3a | BLUE bridge lobe (over the monorail) | sky blue | (46, 78), rx 13, rz 12 | x 33..59, z 66..90 | solid from its underside to y 32; underside (soffit) flat at y 18 over x 41..53, curving down to y 12 at x 33 and x 59 (upside-down stairs) | y 32, joins the blue body's crown |
| 4 | RED (west middle) | red | (23, 74), rx 14, rz 13 | x 9..37, z 61..87 | 1.00 at y1, 1.05 at y10..16, a deep fold, crown | y 28 (tucks under the bridge lobe at x 33..37) |
| 5 | GOLD (south-west) | gold | (26, 106), rx 16, rz 20 | x 10..42, z 86..126 | 1.00 at y1, 1.08 at y12..18 (billow W), crown leaning north | y 32 at (24, 100), y 24 at the south end |
| 6 | MAGENTA (south-east) | magenta | (70, 126), rx 17, rz 18 | x 53..87, z 108..144 | 1.00 at y1, 1.05 at y10..14, rounded crown | y 26 |
| 7 | SILVER B (south) | silver | (29, 138), rx 13, rz 11 | x 16..42, z 127..149 | 1.00 at y1, crown from y 12 | y 22 |

### Folds (the crumple): grooves cut by the SHELL part as it is built (shell leaves them; never carved later)

Each fold is a groove 2 wide, 2 deep (the surface steps in by 2), in the shadow block of that shell, running across the face as listed; stairs line both lips.

| Shell | Fold line (outer surface) |
|---|---|
| Silver A | F1 diagonal on the west face from (5, 30, 36) down to (6, 10, 56); F2 across the north crown from (12, 36, 32) to (36, 28, 40) |
| Silver hood | F3 a horizontal crease at y 18 along the north face, x 12..38 (the lip's sag) |
| Purple | F4 one vertical crease on the west face at x 55..57, z 30..36, y 4..38 (magenta_concrete streak in it) |
| Red | F5 diagonal on the west face from (9, 24, 66) to (10, 6, 84) |
| Gold | F6 diagonal on the west face from (11, 28, 96) to (12, 8, 118); F7 across the crown x 14..38 at z 110 |
| Blue | F8 the rolled lip on the east crown: a horizontal crease at y 26 from z 66 to z 100 on the east face |

### Monorail (the signature)

| Element | Cells | Block |
|---|---|---|
| Beam W | x 44..45, y 9..10, z 0..152 | light_gray_concrete |
| Beam E | x 48..49, y 9..10, z 0..152 (gap x 46..47 between) | light_gray_concrete |
| T-pylons (7) | column x 46..47, y 1..7, 2 deep at z 5..6, 29..30, 53..54, 77..78, 101..102, 125..126, 147..148; cap x 43..50, y 8, same z | column light_gray_concrete, cap polished_andesite |
| Train (on beam E, inside the building under the bridge lobe) | z 70..87 (18 long); skirts x 47 and x 50 at y 9..10 straddling the beam; floor x 47..50 y 11; body sides x 47 and x 50 y 12..15; roof x 47..50 y 16 (smooth_quartz_slab bottom on the edges, white_concrete between); noses: z 70 and z 87 ends slanted with smooth_quartz_stairs at y 14..15, a black_concrete windscreen at y 14 | white_concrete body; a red_concrete stripe the full length at y 12 (both sides and both noses); windows light_gray_stained_glass_pane at y 13..14 in runs of 3, 1 white between; 2 door panels (gray_concrete, y 12..14) per side at z 75 and z 82 |

The z 77..78 pylon stands under the train, inside the building; the bridge lobe never rests on the track.

### Ground floor lobbies (glass between the forms)

| Lobby | Box | Roof |
|---|---|---|
| L1 North entrance | x 26..42, z 22..36, y 1..7 | silver hood's underside (y 8) |
| L2 West street lobby | x 36..42, z 56..94, y 1..7 | y 8 polished_andesite_slab (top) where no shell is above; under the bridge lobe from z 66 |
| L3 East street lobby | x 52..56, z 22..60, y 1..7 | y 8 polished_andesite_slab (top), purple behind it from x 55 |
| L4 South-west street lobby | x 40..42, z 110..148, y 1..7 | y 8 polished_andesite_slab (top) |
| L5 South-east street lobby | x 52..54, z 108..142, y 1..7 | y 8 polished_andesite_slab (top) |

The monorail street x 43..51 itself, inside the footprint (z 20..151), is paved arcade at grade (y 0 paving, open to the sky except under the bridge lobe and nothing above y 17 elsewhere).

### Plaza and steps (the `.` cells only)

| Feature | Cells |
|---|---|
| North plaza paving | all `.` cells z 0..25 + the monorail street; y 0 replaced by polished_andesite with light_gray_concrete bands every 6 along x |
| Amphitheatre steps (the photo's seating) | x 4..40, z 4..13: tiers rising to the north, each tier 2 deep: z 12..13 y 1 (bottom slab smooth_stone_slab), z 10..11 y 1 full + y 2 slab, z 8..9 y 2 full + y 3 slab, z 4..7 y 3 full top (polished_andesite); andesite_wall rails at x 4 and x 40; NOT on any path to a door |
| Entrance landing | x 26..42, z 14..21 level paving (the door cells z 22 are flush with y 1: no step) |
| East and west edges | `.` cells along x 0..11 and x 88..101: paving with planting beds (grass_block, 1 high kerb of polished_andesite_slab) |
| South-east garden | `.` cells x 72..101, z 140..152 and x 88..101, z 108..139: grass, birch trees (birch_log trunk 6, persistent birch_leaves crown) every ~10 |
| Lamp posts | andesite_wall post 3 high + lantern on top every 9 along the plaza edges and down the monorail street (never in x 43..51 above y 7, never on a door path) |

## ROOFS

No pitched roof and no `$MCD roof` preset: references/roofs.md has none for a free-form metal building. Every roof IS its shell's crown, built by the shell's own part with the curved heightmap brush (slab crowns, stair steps), in the shell's own colour. Shells meet by overlap: the earlier-built shell keeps the shared cells, the later one stops against it (a seam, no gutter). The blue bridge lobe's crown runs into the blue body's crown at x 54..59. Crowns are built of stairs and bottom slabs only (no flat full-block terrace bigger than 2x2), so nothing spawns on top.

## FACADES

These shells have no storeys or cornices: their hierarchy is base (glass), body (metal), fold, crown.

| Face | Base (y 1..7) | Body | Ornament |
|---|---|---|---|
| North (street) | L1 glass curtain wall at z 22 under the silver hood; amphitheatre steps; the purple drum comes to the ground solid | silver hood drape, silver fin, purple drum wall towering at the east (tallest thing, y 44) | hood lip: upside-down polished_diorite_stairs along its underside edge; purple rim rolled out 1 (purpur_stairs upside down) |
| Monorail street (x 42 west face, x 52 east face) | glass curtain walls L2..L5 with mullions | shells rise behind the glass, set back 0..4 | beams and T-pylons run past; the bridge lobe's soffit at y 18 with a glass strip x 44..50, z 70..87 (glass) looking down on the train |
| West | shells come to the ground (no plinth), red and gold folds | silver A billow overhangs by 2 at y 14..24 | folds F1, F5, F6 |
| East | blue and purple to the ground | blue billow and rolled lip | fold F8 |
| South | L4/L5 glass at the street ends; silver B and magenta low | | |

Curtain walls: glass_pane in every cell, with polished_andesite mullions (full height y 1..7) every 4th cell; the head at y 8 is the lobby roof or the shell.

## MATERIALS

| Role | Block (all verified for 1.21.1) |
|---|---|
| Silver body | iron_block |
| Silver curve steps / crown | polished_diorite_stairs, polished_diorite_slab |
| Silver fold shadow | light_gray_concrete |
| Purple body | purple_concrete |
| Purple shimmer streaks (vertical, 1 wide, 1 in ~7 columns, plus fold F4) | magenta_concrete |
| Purple rim / crown | purpur_stairs, purpur_slab |
| Red body | red_concrete |
| Red steps / fold | red_nether_brick_stairs, red_nether_brick_slab; fold red_terracotta |
| Blue body | light_blue_concrete |
| Blue steps / crown (white glint) | smooth_quartz_stairs, smooth_quartz_slab; fold light_blue_terracotta |
| Gold body | gold_block |
| Gold steps / crown | bamboo_mosaic_stairs, bamboo_mosaic_slab; fold yellow_terracotta |
| Magenta body | magenta_concrete |
| Magenta steps / fold | crimson_stairs, crimson_slab; fold magenta_terracotta |
| Glass | glass_pane (curtain walls), glass (soffit strip) |
| Mullions, lobby roofs, pylon caps | polished_andesite, polished_andesite_slab |
| Monorail beams, pylons | light_gray_concrete |
| Train | white_concrete, red_concrete, smooth_quartz_stairs/slab, light_gray_stained_glass_pane, gray_concrete, black_concrete |
| Doors | birch_door |
| Ground / paving | smooth_stone (base), polished_andesite, light_gray_concrete bands, smooth_stone_slab steps |
| Planting | grass_block, moss_block, birch_log, birch_leaves (persistent) |
| Light | lantern (posts, hanging inside; hang from blocks, never from a chain: `iron_chain` is not 1.21.1, use `chain` if one is needed), sea_lantern set flush into floors/ceilings |

## OPENINGS

All doors: birch_door, both halves, y 1..2, facing out of the building; the door cells and the cell in front are level with y 1 floor (no step).

| Opening | Face | Cells |
|---|---|---|
| D1, D2 main north doors (double) | z 22, facing north | x 31..32 and x 35..36 |
| North curtain wall | z 22 | x 27..41, y 1..7 glass (doors in it) |
| D3 east street doors (double) | x 52, facing west | z 38..39 and z 46..47 |
| East curtain wall | x 52 | z 22..60, y 1..7 |
| D4 west street doors (double) | x 42, facing east | z 62..63 and z 92..93 |
| West curtain wall | x 42 | z 56..94, y 1..7 |
| D5 south-west doors | x 42, facing east | z 128..129 |
| SW curtain wall | x 42 | z 110..148, y 1..7 |
| D6 south-east doors | x 52, facing west | z 124..125 |
| SE curtain wall | x 52 | z 108..142, y 1..7 |
| D7 west garden door (red) | x 9 (red's west surface), facing west | z 73..74 |
| Soffit glass strip | y 18 | x 44..50, z 70..87 (inside the bridge lobe's floor, over the train) |
| Gallery windows (bridge lobe) | north face z 66 and south face z 90 | x 40..52, y 22..24 glass band |
| Purple slot window | north face, at the drum's north tip | x 70..76, y 30..32 glass band |

## RESERVED

| What | Cells (the shell leaves them air) |
|---|---|
| Train corridor | x 43..51, y 8..17, z 0..152 (only beams, pylon caps, train) |
| Pylon columns | x 46..47, y 1..7 at the pylon z's above |
| Train | x 47..50, y 9..16, z 70..87 |
| Door cells + 2 cells in front of each door | as OPENINGS, y 1..2 |
| Amphitheatre steps | x 4..40, z 4..13, y 1..3 |
| Lamp-post cells | the plaza part places them; posts never in x 43..51 above y 7 |

## FLOORS

Ground floor of every shell: y 1 (standing on the y 0 ground, paved polished_andesite inside). Upper floors are full slabs of the shell's interior (polished_andesite, 1 thick) at the listed block layer; the shell's inner surface walls them.

| Mass | Floors (floor block y → walk-on y) | Interior volume (rooms go here) |
|---|---|---|
| Purple (Sky Church) | ground y 1; one north mezzanine block y 12 → 13 over z 6..20 | x 57..89, z 6..56, y 1..36: one tall hall |
| Silver A + hood | y 1; y 12 → 13; y 24 → 25 | x 7..40, z 28..60 (hood x 13..38, z 23..32 up to y 26) |
| Blue body | y 1; y 18 → 19 | x 57..92, z 65..104, y 1..30 |
| Blue bridge lobe | y 18 → 19 (gallery over the train, with the glass strip) | x 36..58, z 68..88, y 19..30 |
| Red | y 1; y 12 → 13 | x 12..35, z 64..85, y 1..24 |
| Gold | y 1; y 12 → 13 | x 13..40, z 89..123, y 1..28 |
| Magenta | y 1; y 12 → 13 | x 56..85, z 111..141, y 1..22 |
| Silver B | y 1; y 12 → 13 | x 18..40, z 129..147, y 1..19 |
| Lobbies L1..L5 | y 1 | as their boxes; they open into the shells behind them |

Connections between shells at y 1 (2 wide, 3 high) where they overlap: silver A↔red (x 20..21, z 61..62), red↔gold (x 22..23, z 86..87), gold↔silver B (x 28..29, z 126..127), purple↔blue (x 72..73, z 58..62), blue↔magenta (x 70..71, z 106..108). The two groups meet across the monorail street only at grade (doors D3/D4) and over the train in the bridge lobe gallery (y 19).

Light: every interior floor cell ≥ 8 (hanging lanterns, sea_lanterns in ceilings); outer surfaces of stairs and bottom slabs only, so nothing spawns on the shells.

---
# DESIGNER SECTIONS

## PALETTE
Architect's ids kept exactly (all checked with `$MCD blocks --check`; `chain` is the 1.21.1 name but the toolkit lists only `iron_chain`: use NO chains, hang lanterns from blocks).

| Role | Block | Variants |
|---|---|---|
| Silver | iron_block | polished_diorite_stairs, polished_diorite_slab, shadow light_gray_concrete |
| Purple | purple_concrete | purpur_stairs, purpur_slab, streak magenta_concrete |
| Red | red_concrete | red_nether_brick_stairs/_slab, fold red_terracotta |
| Blue | light_blue_concrete | smooth_quartz_stairs/_slab, fold light_blue_terracotta |
| Gold | gold_block | bamboo_mosaic_stairs/_slab, fold yellow_terracotta |
| Magenta | magenta_concrete | crimson_stairs/_slab, fold magenta_terracotta |
| Glass | glass_pane, glass | light_gray_stained_glass_pane (train) |
| Mullion/lobby roof/caps/paving | polished_andesite | polished_andesite_slab, polished_andesite_stairs, andesite_wall (posts, rails) |
| Monorail | light_gray_concrete | |
| Train | white_concrete, red_concrete, gray_concrete, black_concrete | smooth_quartz_stairs/_slab |
| Doors | birch_door | |
| Ground | smooth_stone | smooth_stone_slab |
| Planting | grass_block, moss_block, birch_log, birch_leaves (persistent) | |
| Light | lantern, sea_lantern | |

## VOCABULARY
- `billowShell(g, {name, center:[cx,cz], rx, rz, y0, profile:[[y,factor],...], top, topFn, body, stairs, slab, clip})`: for each (x,z) compute normalized r=sqrt(((x-cx)/rx)^2+((z-cz)/rz)^2) / factor(y). Heightmap h(x,z) = top*(1-r^2)^0.5-ish crown given by `topFn` rounded to half blocks. Outside the profile = air. Surface cell of each column: full `body` where the slope <=0, `stairs` (facing downhill, bottom) where the half-step rises, bottom `slab` on the gentle crown; side steps where factor grows by half a block per y; upside-down `stairs` under any overhang. Interior left AIR (thickness 1). Clip to the footprint mask and never write into x43..51, y8..17. Earlier shells keep shared cells.
- `fold(g, shell, {from:[x,y,z], to:[x,y,z], width:2, depth:2, shadow})`: groove 2 wide, 2 deep along the line, stairs lining both lips, `shadow` block in the groove floor.
- `streaks(g, shell, {block:"magenta_concrete", every:7})`: vertical 1-wide lines of block in the shell's outer surface on 1 of 7 columns.
- `softEdge(g, {cells, stairs})`: upside-down stairs along an overhang's underside edge.
- `fin(g, {x0:20,x1:27,z0:16,z1:21,yTop:20})`: iron_block blade leaning south, width 8 at y1 to 3 at top, curved top edge of polished_diorite stairs.
- `bridgeLobe(g)`: light_blue_concrete lobe solid y12..32 as a roof over the track with soffit y18 flat x41..53 and upside-down smooth_quartz_stairs curve down to y12 at x33/x59; glass strip x44..50 z70..87 at y18; rest of its volume hollow gallery y19..30.
- `beamRun(g, {x0,x1,z0:0,z1:152,y:9,h:2})`: two light_gray_concrete boxes.
- `tPylon(g, {z})`: column x46..47 z..z+1 y1..7 light_gray_concrete; cap polished_andesite x43..50 y8 same z.
- `monorailTrain(g, {z0:70,z1:87})`: as the architect's Train row: skirts x47,x50 y9..10; floor x47..50 y11; sides y12..15; roof y16 (white_concrete between, smooth_quartz_slab bottom on edges); noses at z70/z87 slanted smooth_quartz_stairs y14..15 with black_concrete windscreen y14; red_concrete stripe y12; windows y13..14 runs of 3 with 1 white between; gray_concrete door panels y12..14 at z75 and z82 each side; 2 lanterns inside at y15 hung from the roof.
- `curtainWall(g, {axis, fixed, from, to, y0:1, y1:7})`: glass_pane in every cell, polished_andesite mullion (y1..7) every 4th cell, panes connected.
- `doorPair(g, {x|z, facing})`: two birch_door (lower/upper, same facing and hinge mirrored so they meet) at the OPENINGS cells, cell in front level, a lantern on andesite_wall post either side.
- `glassBand(g, {box})`: glass_pane band set into the shell.
- `connector(g, {box})`: 2 wide x 3 high opening cut at y1..3, lined with polished_andesite.
- `plaza(g, {mask})`: polished_andesite at y0 with light_gray_concrete band every 6 in x.
- `tiers(g)`: amphitheatre per architect with andesite_wall rails.
- `birchTree(g, {x,z})`: birch_log axis y x6 + persistent birch_leaves crown 5 wide, 2 taller than trunk, not a sphere; on grass_block.
- `bed(g, {box})`: grass_block with moss_block patches, polished_andesite_slab kerb.
- `lampPost(g, {x,z})`: andesite_wall x3 + lantern on top.

## ROOMS
Inner air boxes (one block inside the shells' skin). Floors polished_andesite, walk-on = the box's y0. Ground rooms stand on y0 paving; upper rooms on a full-slab floor at the block below.

See the returned `rooms` list (same boxes). Stairs between floors: each two-floor shell has a straight stair flight (3 wide, polished_andesite_stairs): Silver A x9..11 z38..48 up to y13 (flight y1..13 facing north), Silver A y13..25 x37..39 z45..55 facing south; Blue x58..60 z68..80 to y19; Red x14..16 z66..76 to y13; Gold x15..17 z92..104; Magenta x58..60 z114..126; Silver B x20..22 z131..139. Purple mezzanine y13 over z6..20 reached by a flight x58..60 z21..33 facing north up to y13. Bridge gallery is reached from the blue upper floor through x57..58 z74..82 at y19 (open).

Entrance: main doors D1/D2 at z22 (x31..32, x35..36), entrance cell (31,1,21), street cell (44,1,16) on the paved monorail street; the whole approach is level at y1, so no steps.

## PARTS
1. North shells: Purple drum, Silver A, hood, fin, folds F1-F4. `parts/north.mjs`.
2. Middle shells: Blue body, bridge lobe, Red, F5, F8. `parts/middle.mjs`.
3. South shells: Gold, Magenta, Silver B, F6, F7. `parts/south.mjs`.
4. Monorail: beams, 7 T-pylons, train. `parts/monorail.mjs`.
5. Lobbies and openings: curtain walls L1-L5, doors D1-D7, glass bands, connectors, floors and stairs. `parts/lobbies.mjs`.
6. Grounds: plaza, amphitheatre, beds, garden, trees, lamp posts. `parts/grounds.mjs`.

## NOTES FOR WORKERS
- Do not alter any architect coordinate. Shells hollow, thickness 1; interior stays air for the rooms.
- Never write into x43..51, y8..17 except part 4. Clip every shell to the footprint mask.
- Build at 1.21.1 only; no iron_chain, no pale oak.
- Stairs/slabs only on crowns (no flat terrace over 2x2). Test with `$MCD check`, `$MCD fit`, `$MCD light`.
- Part 5 cuts doors/glass after shells exist (shells leave lobby boxes air); lobby roofs are y8 polished_andesite_slab (top).
- north.mjs: shells with a split y0 (1 outside, 8 inside the L1 lobby box) because billowShell clips only in x,z; F2 and F3 crown folds leave a few floating stair lips.
