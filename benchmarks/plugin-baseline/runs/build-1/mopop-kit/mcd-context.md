# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# MoPOP: required elements (checklist)

Every shell is a HOLLOW heightmap shell (thickness 1), built by `billowShell` (see plan.md VOCABULARY). Coordinates are from plan.md (architect). `[ ]` = to tick when built.

| # | Element | Real construction | Coordinates | Part | Vocab |
|---|---|---|---|---|---|
| 1 | Purple drum (Sky Church) | purple_concrete barrel shell, rim of upside-down purpur_stairs rolled out 1, purpur_slab crown 2 below the rim, 1-in-7 vertical magenta_concrete streaks, fold F4 | ellipse (73,33) rx18 rz31/25, x55..91 z2..58, rim y44 N to y38 S | 1 north shells | billowShell, fold, streaks |
| 2 | Silver A (big NW form) | iron_block shell, polished_diorite stairs/slab steps, billow 1.10 at y14..24 W/N, dome crown, folds F1 F2 (light_gray_concrete shadow) | (23,44) r19/18, x4..42 z26..62, y40 | 1 | billowShell, fold |
| 3 | Silver hood + L1 overhang | draped lip, underside y8 over x26..39, ground x11..25, crease F3 y18, upside-down polished_diorite_stairs on the underside edge | (25,27) r14/6, x11..39 z21..33, y30 | 1 | billowShell, fold, softEdge |
| 4 | Silver fin | tapered blade of iron_block leaning south, 8 wide at y1, 3 at the top, curved top edge in polished_diorite stairs | x20..27 z16..21, y20 | 1 | fin |
| 5 | Blue body | light_blue_concrete shell, billow 1.06 E/S, smooth_quartz stairs/slab crown (white glint), fold F8 rolled lip (light_blue_terracotta) | (74,84) r20/22, x54..94 z62..106, y34 | 2 blue+red | billowShell, fold |
| 6 | Blue bridge lobe over the track | shell with soffit y18 over x41..53, curving to y12 at x33 and x59 in upside-down smooth_quartz_stairs; glass strip in the soffit; gallery band windows | (46,78) r13/12, x33..59 z66..90, y32 | 2 | bridgeLobe |
| 7 | Red form | red_concrete shell, red_nether_brick steps, deep fold F5 (red_terracotta) | (23,74) r14/13, x9..37 z61..87, y28 | 2 | billowShell, fold |
| 8 | Gold form | gold_block shell, bamboo_mosaic steps, billow W, crown leans north, F6, F7 | (26,106) r16/20, x10..42 z86..126, y32 | 3 south shells | billowShell, fold |
| 9 | Magenta form | magenta_concrete shell, crimson steps, fold magenta_terracotta | (70,126) r17/18, x53..87 z108..144, y26 | 3 | billowShell |
| 10 | Silver B | iron_block shell, crown from y12 | (29,138) r13/11, x16..42 z127..149, y22 | 3 | billowShell |
| 11 | MONORAIL beams | two light_gray_concrete beams 2 wide, 2 high | W x44..45, E x48..49, y9..10, z0..152 | 4 monorail | beamRun |
| 12 | T-pylons (7) | light_gray_concrete column 2x2 y1..7, cap polished_andesite 8x1x2 at y8 | column x46..47; cap x43..50; z 5-6, 29-30, 53-54, 77-78, 101-102, 125-126, 147-148 | 4 | tPylon |
| 13 | Monorail train | white_concrete body, red_concrete stripe y12, light_gray_stained_glass_pane windows runs of 3, gray_concrete doors, black_concrete windscreen, smooth_quartz stair noses, lit by lanterns inside | x47..50 y9..16 z70..87 | 4 | monorailTrain |
| 14 | Glass entrances between forms | glass_pane curtain walls, polished_andesite mullions every 4th, birch_door pairs, lobby roof polished_andesite_slab top | L1..L5, doors D1..D7 (plan OPENINGS) | 5 lobbies | curtainWall, doorPair |
| 15 | Soffit glass strip + gallery windows + purple slot window | glass | see OPENINGS | 5 | glassBand |
| 16 | Shell-to-shell connections | 2x3 openings at y1 | plan FLOORS | 5 | connector |
| 17 | Paved plaza | polished_andesite with light_gray_concrete band every 6 in x | `.` cells z0..25 + monorail street | 6 grounds | plaza |
| 18 | Amphitheatre steps | tiers 2 deep: slab/full+slab; andesite_wall rails | x4..40 z4..13 | 6 | tiers |
| 19 | Planting beds, garden, birch trees | grass_block, moss_block, birch_log x6 + persistent birch_leaves, polished_andesite_slab kerb | edges x0..11, x88..101; SE garden | 6 | birchTree, bed |
| 20 | Lamp posts | andesite_wall x3 + lantern, every 9, none in x43..51 above y7 | plaza edges + monorail street | 6 | lampPost |
| 21 | Interior light | hanging lanterns / sea_lantern in floors and ceilings, light >= 8 | all rooms | room designers | - |
```

### rooms.json

```json
{"entrance":null,"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "silver": [
      "iron_block",
      "polished_diorite_stairs",
      "polished_diorite_slab",
      "light_gray_concrete"
    ],
    "purple": [
      "purple_concrete",
      "purpur_stairs",
      "purpur_slab",
      "magenta_concrete"
    ],
    "red": [
      "red_concrete",
      "red_nether_brick_stairs",
      "red_nether_brick_slab",
      "red_terracotta"
    ],
    "blue": [
      "light_blue_concrete",
      "smooth_quartz_stairs",
      "smooth_quartz_slab",
      "light_blue_terracotta"
    ],
    "gold": [
      "gold_block",
      "bamboo_mosaic_stairs",
      "bamboo_mosaic_slab",
      "yellow_terracotta"
    ],
    "magenta": [
      "magenta_concrete",
      "crimson_stairs",
      "crimson_slab",
      "magenta_terracotta"
    ],
    "glass": [
      "glass_pane",
      "glass",
      "light_gray_stained_glass_pane"
    ],
    "andesite": [
      "polished_andesite",
      "polished_andesite_slab",
      "polished_andesite_stairs",
      "andesite_wall"
    ],
    "monorail": [
      "light_gray_concrete"
    ],
    "train": [
      "white_concrete",
      "red_concrete",
      "gray_concrete",
      "black_concrete",
      "smooth_quartz_stairs",
      "smooth_quartz_slab"
    ],
    "ground": [
      "smooth_stone",
      "smooth_stone_slab"
    ],
    "planting": [
      "grass_block",
      "moss_block",
      "birch_log",
      "birch_leaves"
    ]
  },
  "objects": [
    "birch_door",
    "lantern",
    "sea_lantern"
  ]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: node build.mjs writes a temp file, which then replaces build.nbt.
set -e
cd "$(dirname "$0")"
tmp=$(mktemp ./build.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// MoPOP kit: the site grid, the ground, then every part in the order the plan gives. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, GROUND, GROUND_Y } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order (plan.md PARTS). Overlap order matters: the shells come first, so later parts only add.
const PARTS = [
  ["North shells", "parts/north.mjs"],
  ["Middle shells", "parts/middle.mjs"],
  ["South shells", "parts/south.mjs"],
  ["Monorail", "parts/monorail.mjs"],
  ["Lobbies, doors, floors", "parts/lobbies.mjs"],
  ["Plaza and grounds", "parts/grounds.mjs"],
];

// A part whose file is not there yet is skipped (its worker hasn't written it); a part that exists must build.
const list = [];
for (const [name, module] of PARTS) {
  if (!existsSync(module)) { console.log(`part ${name}: ${module} not written yet, skipped`); continue; }
  list.push([name, (await import(`./${module}`)).build]);
}

const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([0, GROUND_Y, 0], [SITE[0] - 1, GROUND_Y, SITE[2] - 1], GROUND);   // the ground course over the whole plot
// runParts lays roof.json (none for this plan: the roof is each shell's own crown) and skips it while the file is absent
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the MoPOP kit: palette block ids (palette.json only), site coordinates from plan.md, and a seeded rng.

// Site and levels

// Site and levels
export const SITE = [102, 47, 153];                                       // plot 0: x 0..101, y 0..46, z 0..152

export const GROUND_Y = 0;                                                // ground course (smooth_stone), every ground surface stands on it

export const FLOOR_Y = 1;                                                 // first floor level; floors and doors start here

export const STREET = { x0: 43, x1: 51, y0: 8, y1: 17, z0: 0, z1: 152 };  // monorail street: train corridor, no shell, floor or decor (beams, pylon caps, train excepted)

export const MAIN_DOOR_Z = 22;                                            // north curtain wall and main double doors D1/D2

export const ENTRANCE = [31, 1, 21];                                      // entrance cell, in front of the main doors

export const STREET_CELL = [44, 1, 16];                                   // street cell on the paved monorail street

// Footprint mask (plan.md, 1 char = 4x4): building spans per z band; anything outside is plaza or garden
export const FOOTPRINT = [

/** True if the cell (x, z) lies inside the footprint mask (every shell is clipped to it). */
export const inFootprint = (x, z) => ...

// Palette: silver, purple, red, blue, gold, magenta shells
export const SILVER = "iron_block";                                       // silver body

export const SILVER_STAIRS = "polished_diorite_stairs";                   // silver curve steps and crown

export const SILVER_SLAB = "polished_diorite_slab";                       // silver crown slabs

export const SILVER_SHADOW = "light_gray_concrete";                       // silver fold shadow

export const PURPLE = "purple_concrete";                                  // purple drum body

export const PURPLE_STAIRS = "purpur_stairs";                             // purple rim and crown steps

export const PURPLE_SLAB = "purpur_slab";                                 // purple rim and crown slabs

export const PURPLE_STREAK = "magenta_concrete";                          // purple shimmer streaks and fold F4

export const RED = "red_concrete";                                        // red body (also the train stripe)

export const RED_STAIRS = "red_nether_brick_stairs";                      // red steps

export const RED_SLAB = "red_nether_brick_slab";                          // red slabs

export const RED_FOLD = "red_terracotta";                                 // red fold shadow

export const BLUE = "light_blue_concrete";                                // blue body and bridge lobe

export const BLUE_STAIRS = "smooth_quartz_stairs";                        // blue steps and crown (white glint)

export const BLUE_SLAB = "smooth_quartz_slab";                            // blue crown slabs

export const BLUE_FOLD = "light_blue_terracotta";                         // blue fold shadow

export const GOLD = "gold_block";                                         // gold body

export const GOLD_STAIRS = "bamboo_mosaic_stairs";                        // gold steps and crown

export const GOLD_SLAB = "bamboo_mosaic_slab";                            // gold crown slabs

export const GOLD_FOLD = "yellow_terracotta";                             // gold fold shadow

export const MAGENTA = "magenta_concrete";                                // magenta body

export const MAGENTA_STAIRS = "crimson_stairs";                           // magenta steps

export const MAGENTA_SLAB = "crimson_slab";                               // magenta slabs

export const MAGENTA_FOLD = "magenta_terracotta";                         // magenta fold shadow

// Glass, lobbies, paving
export const GLASS_PANE = "glass_pane";                                   // curtain walls

export const GLASS = "glass";                                             // bridge soffit strip

export const TRAIN_GLASS = "light_gray_stained_glass_pane";               // train windows

export const ANDESITE = "polished_andesite";                              // mullions, lobby floors, plaza paving, rooms floors

export const ANDESITE_SLAB = "polished_andesite_slab";                    // lobby roofs, kerbs, rooms slabs

export const ANDESITE_STAIRS = "polished_andesite_stairs";                // room stair flights

export const ANDESITE_WALL = "andesite_wall";                             // lamp posts, amphitheatre rails

// Monorail, train, doors, ground, planting, light
export const MONORAIL = "light_gray_concrete";                            // beams and T-pylon columns

export const WHITE = "white_concrete";                                    // train body and roof

export const GRAY = "gray_concrete";                                      // train door panels

export const BLACK = "black_concrete";                                    // train windscreen

export const DOOR = "birch_door";                                         // all doors

export const GROUND = "smooth_stone";                                     // ground course y 0

export const GROUND_SLAB = "smooth_stone_slab";                           // amphitheatre bottom step

export const GRASS = "grass_block";                                       // planting beds and garden

export const MOSS = "moss_block";                                         // grass patches

export const BIRCH_LOG = "birch_log";                                     // birch trunks

export const BIRCH_LEAVES = "birch_leaves";                               // birch crowns (persistent)

export const LANTERN = "lantern";                                         // lamps and hanging lights

export const SEA_LANTERN = "sea_lantern";                                 // ceiling lights set into floors

// Seeded PRNG (mulberry32): rng(seed)() in [0,1), the same sequence for the same seed
export function rng(seed) { let a = (seed * 2654435761) >>> 0; return () => ...
```

### vocab/h1.mjs

```js
// MoPOP vocabulary, helper set h1 (plan.md VOCABULARY): billowShell, streaks, fin, beamRun, monorailTrain,
// doorPair, connector, tiers, birchTree. Imports nothing from vocab.mjs or the other vocab/ files.
//
// Every helper takes its position as arguments and returns { box, placed, skipped, cells }. It writes only inside
// `box` (the footprint it was given), only into air unless an option names what it may replace, never at ground
// level (y0 - 1 and below belong to an earlier part), and leaves a refused write in `skipped` instead of forcing it.

/**
 * A hollow heightmap shell (thickness 1) of a billowing metal mass. The section is an ellipse (cx, cz; rx, rz) scaled by
 * `profile` ([[y, factor], ...], interpolated): a factor above 1 bulges the wall out, and an overhang under a bulge gets
 * upside-down stairs. The crown is `topFn(x, z)` if given, else a dome down to y0 at the rim, rounded to whole blocks.
 *   crown cells: stairs stepping up toward a higher neighbour (back toward it), stairs stepping down away from a lower
 *     neighbour or the open edge, else a bottom slab (the gentle crown).
 *   side cells: body. underside cells: upside-down stairs facing the centre.
 * Interior cells stay air. clip(x, z) is the footprint mask. keepOut boxes (default: the monorail corridor) are never
 * written, but the shell still forms around them. Returns the cells it placed, for streaks().
 * o: { name, center: [cx, cz], rx, rz, y0, top, profile, topFn, body, stairs, slab, clip, keepOut }
 */
export function billowShell(g, o)

/**
 * Vertical 1-wide streaks of `block` on the outer face of a billowShell: every column with (x + z) % every === 0 that
 * the shell left as a side cell. Replaces only the shell's own body cells, which the shell wrote.
 */
export function streaks(g, shell, { block = "magenta_concrete", every = 7 } = {})

/**
 * A tapered blade of iron_block leaning south: at y0 it spans x0..x1 (width w0) and at yTop it is topWidth wide,
 * centred, and shifted `lean` blocks south. The top row is stairs at both ends and slab across the middle (the curved edge).
 */
export function fin(g, { x0, x1, z0, z1, y0, yTop, topWidth = 3, lean = 2, body = "iron_block",

/**
 * The monorail's two beams, width `w` each, at the outer ends of x0..x1 (a gap between them), y..y+h-1, z0..z1.
 * Plan: x0 44, x1 49, y 9, h 2, z 0..152 gives beams at x 44..45 and 48..49.
 */
export function beamRun(g, { x0, x1, z0, z1, y, h, w: width = 2, block = "light_gray_concrete" })

/**
 * The monorail train, 4 wide (x0..x0+3) and 8 high (y0..y0+7: skirts, floor, body, roof), from z0 to z1 (the plan's
 * train is x0 47, y0 9, z 70..87). The noses at z0 and z1 slope in; the windows are panes in runs of 3 with a white
 * block between; gray doors sit at z0+5 and z0+12; two lanterns hang from the roof at z0+8 and z0+14.
 */
export function monorailTrain(g, { x0, y0, z0, z1 })

/**
 * A door (both halves, birch by default) at x, z with its lower half at y0, facing out of the building. The two posts
 * stand in front of the wall, either side of the door (the door cell and the cell in front stay clear), each with a
 * lantern on top. over: blocks the door may replace (a curtain wall's glass_pane, for example).
 */
export function doorPair(g, { x, z, y0, facing, over = [], mat = "birch", post = "andesite_wall" })

/**
 * A 2-wide x 3-high opening through a shell wall: the box is cut to air (the one helper that cuts), and the reveal (the
 * solid cells beside and above it, in the wall's plane) is lined with `lining`. box: [x0, y0, z0, x1, y1, z1].
 */
export function connector(g, { box: [x0, y0, z0, x1, y1, z1], lining = "polished_andesite" })

/**
 * The amphitheatre steps over x0..x1, z0..z1 (z1 is the south edge, the lowest tier; the steps rise to the north). Tier
 * 0 is a bottom slab at y0; tiers 1 and 2 are full blocks to y0+t-1 with a slab at y0+t; the north rest is full blocks
 * to y0+2 with polished_andesite on top. andesite_wall rails sit on the top of x0 and x1 for every row.
 * Plan: x0 4, x1 40, z0 4, z1 13, y0 1. Writes from y0 up; the ground at y0 - 1 is left alone.
 */
export function tiers(g, { x0, x1, z0, z1, y0 })

/**
 * A birch tree at x, z with its trunk base at y (the cell above the grass, which is not written): a 6-high birch_log
 * trunk and a persistent birch_leaves crown from y+3 to y+7, rounded rather than a sphere (5 wide at the widest).
 */
export function birchTree(g, { x, z, y })
```

### vocab/h2.mjs

```js
// MoPOP vocabulary, part h2 (plan.md VOCABULARY): fold, softEdge, bridgeLobe, tPylon, curtainWall, glassBand, plaza,
// bed, lampPost. Each takes its position as arguments and returns the cells it wrote. A helper writes only inside the
// footprint it was given, and into air only, except where its doc says otherwise: fold cuts its own groove,
// glassBand({ into: "shell" }) cuts a window, plaza and bed lay the ground layer y0 they own. Nothing writes into the
// monorail corridor (x43..51, y8..17) except tPylon's cap. Block ids are plan.md PALETTE literals.

/**
 * fold(g, shell, { from, to, width = 2, depth = 2, shadow, outward }): a groove across a shell's outer surface, from
 * cell `from` to `to`, cut by the shell's own part as it is built. shell = the billowShell options (center, stairs).
 * The groove is `width` wide and `depth` deep into the shell; stairs line both lips; the floor behind the groove gets
 * `shadow` where it is air. outward = the surface's outward normal [dx,dy,dz] (default: horizontal, away from
 * shell.center). Writes only the groove, its two lips and its floor. Returns the cells written.
 */
export function fold(g, shell, { from, to, width = 2, depth = 2, shadow = null, outward = null } = {})

/**
 * softEdge(g, { cells, stairs }): upside-down stairs along an overhang's underside edge. cells = [[x, y, z, facing]],
 * facing = the side the stair's full back faces (into the wall it hangs from). stairs = a stairs block id. Air only.
 */
export function softEdge(g, { cells, stairs })

/**
 * bridgeLobe(g, { cx, cz, rx, rz, body, curve, glass }): the blue lobe over the monorail, a thin skin on an ellipse
 * (footprint x33..59, y12..32, z66..90). Soffit flat at y18 over x41..53, curving down (upside-down stairs) to y12 at
 * x33 and x59; a roof at y31..32; walls at the rim; the gallery between (y19..30) stays air. glass = [x0, z0, x1, z1],
 * the soffit glass strip over the train. Air only.
 */
export function bridgeLobe(g, { cx = 46, cz = 78, rx = 13, rz = 12, body = "light_blue_concrete", curve = "smooth_quartz_stairs", glass = [44, 70, 50, 87] } = {})

/**
 * tPylon(g, { x = 46, z }): a monorail T-pylon. A light_gray_concrete column x..x+1, y1..7, z..z+1, capped by
 * polished_andesite x-3..x+4 at y8 (the cap sits in the corridor: this is the one helper allowed there). Air only.
 */
export function tPylon(g, { x = 46, z } = {})

/**
 * curtainWall(g, { axis, fixed, from, to, y0 = 1, y1 = 7 }): a glass wall on a lobby edge. axis is the way the wall runs:
 * "z" puts it in the plane x = fixed from z = from to z = to; "x" puts it in z = fixed. glass_pane in every cell, a
 * polished_andesite mullion (full height) at every 4th cell counted from `from`. Air only.
 */
export function curtainWall(g, { axis, fixed, from, to, y0 = 1, y1 = 7 })

/**
 * glassBand(g, { box, block = "glass_pane", into = "air" }): a band of glass in a face or a soffit. glass_pane joins
 * itself across the band; block "glass" is a solid pane. into: "shell" replaces the shell's own cells in the band (a
 * window cut through a wall); the default writes into air only.
 */
export function glassBand(g, { box, block = "glass_pane", into = "air" })

/**
 * plaza(g, { mask, band = 6, bandOrigin = 0, paving, bandBlock }): the ground layer y0 of the plaza cells, paved
 * polished_andesite with a light_gray_concrete line along z every `band` cells in x. mask = (x, z) => bool, or a list
 * of [x0, z0, x1, z1] rectangles. It lays the ground it owns (the cells of the mask at y0) and nothing else.
 */
export function plaza(g, { mask, band = 6, bandOrigin = 0, paving = "polished_andesite", bandBlock = "light_gray_concrete" } = {})

/**
 * bed(g, { box }): a planting bed on the ground. box = [x0, z0, x1, z1] on the y0 ground: grass_block over the ground
 * in the box, moss_block in a fixed patch pattern, and a polished_andesite_slab kerb at y1 round the edge. Writes the
 * ground layer of its own box and the kerb ring; air only above.
 */
export function bed(g, { box: [x0, z0, x1, z1] })

/**
 * lampPost(g, { x, z }): three andesite_wall posts at y1..3 and a standing lantern on top at y4. Air only.
 */
export function lampPost(g, { x, z } = {})
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
