# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Golden Gate south end: Fort Point + arch, pylons, anchorage, approach (kit, 0.5 blocks/m, MC 1.21.1)

Exterior only: no rooms. Two modules, each in its OWN local coordinates (x east, z south, y up). North (−z) is the water.

## SITE

### Plot 0: Fort Point (43 x 37: x 0..42, z 0..36, y 0..16). y 0 = ground course
Fort mask = the footprint map, 1 char = 2x2 blocks (map col c → x 2c..2c+1, row r → z 2r..2r+1, clipped to x≤42, z≤36). Fort = every `#` cell (692 cells). Parade = the enclosed `.` region inside it (228 cells). Everything else is open ground.

| Mass | Cells | y | Notes |
|---|---|---|---|
| Ground course (whole plot) | x 0..42, z 0..36 | 0 | fort, parade, walk, paving all at y 0 |
| Fort casemate ring | all fort-mask cells | 1..6 | SOLID mass (no interior), y 6 is the barbette deck (walk on its top) |
| Parapet, outer edge | outermost fort cells (fort cells with an outside neighbour) | 7..8 | 1 thick, continuous |
| Parade rail | fort cells with a parade neighbour | 7 | 1 high |
| N stair tower | x 24..27, z 0..3 | 1..9, cap 10 | |
| E stair tower | x 38..41, z 2..5 | 1..9, cap 10 | the stub x 38..39, z 0..1 is a buttress, y 1..8 |
| SW stair tower | x 4..7, z 32..35 | 1..9, cap 10 | |
| NW corner (lighthouse base) | x 0..5, z 8..13 (the west lobe) | 1..8 | as the ring, parapet 7..8 |
| Lighthouse | x 2..4, z 10..12 | 7..14 | on the deck, see FACADES |
| Sally port passage | x 26..27, z 18..25 | 1..3 | open air through the wall to the parade (z 17) |
| Parade ground | parade cells | 0 | paved, open to the sky |
| Seawall walk | open cells within 2 of the fort | 0 | |
| Shore rocks | open cells with z ≤ 3 or x ≤ 1 (beyond the walk) | 1..2 | boulder clusters, ≤30 % of that strip |
| Paving (landward) | all other open cells | 0 | |

The fort's face runs. A "face" is a fort cell whose neighbour that way is outside. Runs of 4 or more:
- North-facing, outer: z0 x24..29 · z2 x20..23 · z2 x30..37 · z6 x14..17 · z8 x0..5 · z8 x10..13 · z10 x6..9
- West-facing, outer: x0 z8..13 · x4 z16..35
- East-facing, outer: x37 z10..19
- South-facing, outer (landward): z23 x30..33 · z25 x26..29 · z27 x22..25 · z29 x18..21 · z31 x14..17 · z35 x8..11
- Parade faces: N-facing z16 x28..31, z18 x24..27, z20 x20..23, z24 x14..17, z26 x10..13 · S-facing z5 x24..27, z7 x20..23, z9 x16..19, z17 x10..13 · W-facing x28 z6..9, x32 z12..15 · E-facing x9 z18..21, x13 z12..17
- 2-wide risers on the stepped diagonals stay plain brick (they read as buttresses).

### Plot 1: arch, pylons, anchorage, approach (31 x 191: x 0..30, z 0..190, y 1..50). y 0 = water: build NOTHING at y 0
Centre line x 15; cable/rib/truss planes x 8 and x 22. All footings run down to y 1.

Road block height Y(z): z 11..110 Y = 34 (full block). Descent in half steps (S = bottom slab at Y, F = full block at Y):

| z | 111..116 | 117..123 | 124..129 | 130..136 | 137..143 | 144..149 | 150..156 | 157..163 | 164..169 | 170..176 | 177..183 | 184..189 | 190 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Y | 34 F | 34 S | 33 F | 33 S | 32 F | 32 S | 31 F | 31 S | 30 F | 30 S | 29 F | 29 S | 28 F |

The whole deck section follows Y: road/sidewalk/curb at Y, railing Y+1, truss Y−4..Y−1. On S segments the sidewalk/road/line cells are slabs and the curb is still a full block.

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| Deck: curb + railing | 8 and 22 | curb Y, rail Y+1 | 11..190 | |
| Deck: sidewalks | 9..10, 20..21 | Y | 11..190 | |
| Deck: road | 11..19 | Y | 11..190 | lane lines below |
| Deck floor | 9..21 | Y−1 | 11..190 | under road and sidewalks |
| Stiffening truss | 8 and 22 | Y−4..Y−1 | 14..190 | chords Y−4 and Y−1; verticals at z ≡ 2 (mod 4); Warren diagonals in the Y−3..Y−2 rows |
| Pylon S1 west / east | 1..7 / 23..29 | 1..42 | 6..14 | stepped top, see FACADES |
| Pylon S2 west / east | 1..7 / 23..29 | 1..42 | 63..71 | |
| S1 cross beam | 8..22 | 26..29 | 8..12 | bears into both pylons; the north module's deck rests on it |
| S2 cross beam | 8..22 | 26..29 | 65..69 | |
| Arch skewbacks (4) | 8..9 and 21..22 | 1..13 | 11..14 (S1), 63..66 (S2) | concrete springing blocks |
| Arch ribs (2) | 8..9 and 21..22 | see arch table | 15..62 | |
| Spandrel posts | 8..9 and 21..22 | rib top+1 .. 29 | 18,22,26,30, 46,50,54,58 | 1 deep in z |
| Rib cross struts | 10..20 | rib top (intrados+2) | same z as posts | |
| Main cable (exposed) | 8 and 22 | 35..36 | 71 | continues the north module's cable |
| Cable housings (2) | 7..9 and 21..23 | 15 .. cable y+1 | 72..80 | solid concrete wedge, cable buried in it |
| South anchorage | 0..30 | 1..14 | 72..112 | solid, top course y 14 |
| Anchorage deck piers | 7..9 and 21..23 | 15..28 | 88..90, 104..106 | |
| Pier cap beams | 7..23 | 29 | 88..90, 104..106 | truss bottom (y 30) sits on it |
| Approach bents (4) | legs 8..9 and 21..22 | see bent table | z c−1..c for c = 120, 136, 152, 168 | |
| Bent pedestals | 7..10 and 20..23 | 1..top | c−2..c+1 | |
| South abutment | 8..22 | 1..24 (z 184..189), 1..23 (z 190) | 184..190 | meets the land road |

Arch table: rib INTRADOS (lowest rib cell) y by z. The rib is 3 deep, intrados..intrados+2. Where the next z's intrados jumps by more than 2, fill vertically so the rib stays continuous. From z 33 to 44 the rib is just the intrados row at y 29 and merges into the truss chord (y 30).

| z | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33..44 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| y | 14 | 15 | 16 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 24 | 25 | 26 | 26 | 27 | 27 | 28 | 28 | 29 |

| z | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| y | 28 | 28 | 27 | 27 | 26 | 26 | 25 | 24 | 24 | 23 | 22 | 21 | 20 | 19 | 18 | 16 | 15 | 14 |

HARD CLEARANCE: nothing below y 16 at x 11..30, z 17..53 (Fort Point stands there). The table meets it (z 17 intrados 16) and every strut is at y 18 or above.

Cable y at x 8 / x 22 (red cable cell, inside the housing from z 72): z71 36 · z72 34 · z73 31 · z74 29 · z75 26 · z76 24 · z77 21 · z78 19 · z79 16 · z80 14 (meets the anchorage). Fill vertically between consecutive z. The housing wedge at each z runs from y 15 to cable y+1 (z 72 to y 35, z 80 to y 15). Where it crosses the deck (z 72..75), the housing replaces the curb, railing and truss on x 8 / x 22 and the outer sidewalk cell x 9 / x 21 (the walk narrows to 1 there).

Bent table (legs y range; cap beam x 8..22 at the row above the legs, directly under the truss):

| c | pedestal top | legs | cap |
|---|---|---|---|
| 120 | 12 | 13..28 | 29 |
| 136 | 16 | 17..27 | 28 |
| 152 | 20 | 21..25 | 26 |
| 168 | 23 | 24 | 25 |

Land (for reference only; nothing is cleared): water to z 9, y 1..2 at z 10..70, y 3..10 around the anchorage, the bluff rising y 10 at z 120 to y 25..28 at z 190. Footings hidden in the land are fine.

## ROOFS
No pitched roofs; no `$MCD roof` preset applies. Every top is flat and built by hand by the part that builds the mass:
- Fort barbette: flat deck at y 6 behind a y 7..8 parapet. Stair towers: flat, with a y 10 slab cap. Lighthouse: a little stair-pyramid cap (y 13) with a rod (y 14).
- Pylons: stepped Art Deco crowns: y 1..36 full 7x9; y 37..39 inset 1 (west x 2..6 / east x 24..28; S1 z 7..13, S2 z 64..70); y 40..41 inset 2 (x 3..5 / 25..27; z 8..12 / 65..69); y 42 inset 3 (x 4 / 26; z 9..11 / 66..68) as a slab ridge. Each exposed ledge cell gets a bottom slab on top (no spawning).
- Anchorage: flat top course at y 14 of bottom slabs (spawn-proof), cornice band y 12, and the housings rising out of it at z 72..80.

## FACADES

### Fort Point (plot 0)
- Ground course y 0. Base course y 1 = polished granite (every outer and parade face). Wall body y 2..6 = bricks. Parapet y 7 bricks, coping y 8 polished granite. Parade rail y 7 = brick_wall.
- Casemate tiers on the NORTH- and WEST-facing outer runs (the water fronts): three tiers, tier 1 y 1..2, tier 2 y 3..4, tier 3 y 5..6, the same columns on every tier. Each embrasure is 1 wide, 2 tall: lower cell a brick_slab (bottom, the sill), upper cell air, and the cell behind it (1 deeper) black_concrete in both rows (the dark casemate). Arch head: in the top row of each tier, the pier cells either side are brick_stairs, upside down, facing into the opening. That makes the arch curve.
  - Embrasure columns: z0 x 25, 28 · z2 x 31, 34 · z8 x 1, 4 (west lobe). On the 4-wide runs (z2 x20..23, z6 x14..17, z8 x10..13, z10 x6..9) one 2-wide arch in the middle two cells (x 21..22, 15..16, 11..12, 7..8), with upside-down stairs in the end cells. West: x0 at z 9, 12 · x4 at z 17, 20, 23, 26, 29.
- EAST face (x 37 z10..19): plainer, loopholes only (1x1 black_concrete slits recessed 1, at y 3 and y 5, at z 12, 15, 18).
- SOUTH (landward) faces: plain brick with loopholes (1x1, recessed 1, black_concrete) at y 3 and y 5 in the middle of each south riser. SALLY PORT on z25 x26..29: the opening x 26..27, y 1..3, open right through to the parade (passage z 18..25). Arch head: upside-down brick_stairs at x 25 and x 28, y 3, facing in. Lintel band y 4 x 25..28 = polished granite, a chiseled_stone_bricks keystone at x 26 y 4.
- Parade faces (courtyard galleries): on every listed parade run, arched openings at every other cell starting with the 2nd cell, on all three tiers. Each is 2 deep: bottom slabs (brick_slab) in the lower row of both cells, air above. Arch heads as on the outer front. They read as arcaded galleries.
- Stair towers: bricks with stone_bricks quoins on their 4 vertical corners (alternating every other course), rising 1 over the parapet (y 9), a polished_granite_slab cap ring at y 10, a 1x2 doorway onto the deck on the side facing the parade (y 7..8).
- Lighthouse (x 2..4, z 10..12): legs at the 4 corners y 7..10 polished_blackstone_wall; a core column x 3 z 11 y 7..10 green_terracotta; gallery y 11 = 3x3 polished_blackstone_slab (top); lantern room y 12: centre x 3 z 11 glowstone, the 4 edge cells glass_pane, corners polished_blackstone_wall; cap y 13: centre polished_blackstone, ring of polished_blackstone_stairs rising inward; y 14 lightning_rod at x 3 z 11.

### Bridge (plot 1)
- Pylons: smooth_sandstone (pale cream concrete). Vertical fluting: grooves 1 deep (made by leaving the face cell out; the cell behind is smooth_sandstone), y 6..35. North and south faces at x 3, 5 (west pylon) and x 25, 27 (east). Outer faces (west pylon x 1, east pylon x 29) at z 8, 10, 12 (S1) and z 65, 67, 69 (S2). Inner faces (x 7, x 23) plain. String course y 36 = cut_sandstone (flush). Base y 1..3 = cut_sandstone plinth.
- Arch ribs: orange_terracotta body, the intrados row red_concrete (highlight line along the curve). Spandrel posts orange_terracotta. Cross struts red_terracotta.
- Stiffening truss: chords and verticals orange_terracotta, Warren diagonals red_terracotta. Curb (x 8 / x 22 at Y) orange_terracotta. Railing (Y+1) orange_concrete, the bright line of the deck.
- Deck floor (Y−1, x 9..21) gray_concrete.
- Road x 11..19: polished_deepslate (S segments: polished_deepslate_slab). Lane lines: x 12 and x 18 dashed smooth_quartz (2 on, 2 off, on at z ≡ 0,1 mod 4; S segments smooth_quartz_slab); x 15 continuous yellow_concrete (S segments smooth_sandstone_slab). Sidewalks: smooth_stone (S: smooth_stone_slab).
- Art Deco lamp posts: on the railing, post Y+1 orange_concrete, Y+2 red_concrete, Y+3 lantern (standing). West posts (x 8) at z 16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176. East posts (x 22) at z 24, 40, 56, 88, 104, 120, 136, 152, 168, 184 (staggered, so a lamp every 8). For z ≤ 70 the cable owns y 36 on x 8 / x 22, so those posts stand on the outer sidewalk cell (x 9 / x 21) instead: y 35 orange_concrete, y 36 red_concrete, y 37 lantern.
- Cross beams and skewbacks: smooth_sandstone, cut_sandstone bottom course.
- Cable: red_concrete. Housings: smooth_sandstone with a cut_sandstone collar ring 1 proud around the cable mouth at z 72 (x 6..10 / 20..24, y 33..37, only where that is air).
- South anchorage: smooth_sandstone body, cut_sandstone base y 1..2 and cornice y 12, top y 13 smooth_sandstone, y 14 smooth_sandstone_slab. Art Deco recessed panels, nothing proud (x 0 / x 30 are the plot edges):
  - West (x 0) and east (x 30) faces: flush pilasters z 72..74, 85..86, 98..99, 110..112. Panels recessed 1 at z 75..84, 87..97, 100..109, y 3..11; inside each a second recess (2 deep) at z 77..82, 89..95, 102..107, y 5..9.
  - South face (z 112): pilasters x 0..2, 14..16, 28..30. Panels recessed 1 x 3..13, 17..27, y 3..11; inner recess 2 deep x 5..11, 19..25, y 5..9.
  - North face (z 72): plain under the deck; the housings sit on it.
- Approach bents: pedestals smooth_sandstone; legs orange_terracotta; cap beam red_concrete; inside x 10..20 an X of red_terracotta diagonals (stepped, leg top to leg foot) plus a horizontal strut at mid-height. On the bent at c = 168 the legs are 1 tall, so just the cap and the pedestals.
- Anchorage piers and caps: smooth_sandstone.
- Abutment: smooth_sandstone, cut_sandstone top course.

## MATERIALS
| Role | Block |
|---|---|
| Fort wall body, parapet | bricks |
| Fort base course, coping, sally lintel | polished_granite (slabs: polished_granite_slab) |
| Fort arch heads, sills | brick_stairs (upside down), brick_slab |
| Casemate dark | black_concrete |
| Fort quoins, keystone | stone_bricks, chiseled_stone_bricks |
| Parade rail | brick_wall |
| Plot 0 ground course, walk | smooth_stone |
| Parade paving, landward paving | stone_bricks |
| Shore rocks | andesite, cobblestone, mossy_cobblestone (mixed, ≤ 2 high) |
| Lighthouse | polished_blackstone(_wall/_slab/_stairs), green_terracotta, glowstone, glass_pane, lightning_rod |
| Bridge steel (primary) | orange_terracotta |
| Bridge steel (secondary, shadow) | red_terracotta |
| Steel highlights | red_concrete (rib intrados, bent caps, cable, lamp posts), orange_concrete (railing, lamp bases) |
| Concrete (pylons, anchorage, beams, piers) | smooth_sandstone, cut_sandstone, smooth_sandstone_slab |
| Road | polished_deepslate / polished_deepslate_slab |
| Lane lines | smooth_quartz (+_slab) white; yellow_concrete (smooth_sandstone_slab on slab steps) |
| Sidewalk | smooth_stone / smooth_stone_slab |
| Deck floor | gray_concrete |
| Light | lantern |
All of these were checked with `$MCD blocks --check` and exist in 1.21.1. The 1.21.1 chain is `chain` (the toolkit only knows `iron_chain`): don't use chains at all.

## OPENINGS
- Fort sally port: x 26..27, y 1..3, z 25 through to z 18 (open, no door). It is the only entrance at ground level.
- Fort embrasures, loopholes, gallery arches: as listed in FACADES (recesses, not ways in; black backs or slab sills).
- Tower doors onto the barbette: N tower x 25..26 z 3 y 7..8; E tower x 39..40 z 5 y 7..8; SW tower x 7 z 33..34 y 7..8 (air, the deck side).
- Bridge: no doors. The road is open end to end, z 11..190 (continuing north at z 10 and onto the land road at z 190).

## RESERVED
- Plot 1, x 8 and x 22, y 36, z 0..70: the main cables, drawn by the north module. Leave them AIR (no lamp, post or rail there).
- Plot 1, x 11..30, z 17..53, y 1..15: Fort Point (from plot 0, at placement). Leave it empty.
- Plot 1, y 0 everywhere: water. Leave it empty.
- Plot 1, z 0..10, x 8..22, y 26..36: the north module's deck and truss end at z 10. Only the S1 cross beam (z 8..12, y 26..29) and the pylons occupy that range.
- Plot 0 embrasure, loophole and gallery cells and the sally port passage: the shell leaves them as listed (air / slab / black back), not solid brick.
- Plot 0 lighthouse cells x 2..4, z 10..12, y 7..14: the parapet steps around it.

## FLOORS
No interior rooms (exterior only). Walking levels:
- Plot 0: parade and walk y 0 (walk on y 1); barbette deck top y 6 (walk on y 7), enclosed by the parapet. Casemate tiers (notional, the wall is solid): y 1, 3, 5.
- Plot 1: road walking surface on top of Y (z 11..110 on y 35, down to y 29 at z 190 in half steps).
- Lighting (no spawns): plot 0: lamp posts (polished_blackstone_wall y 1..2, lantern y 3) every ~8 along the walk and paving, never on rocks. Parade posts at (16, 12), (26, 12), (24, 8), (12, 20). Lanterns on the parapet top every 6 around the barbette. A hanging lantern in the sally port at x 26, y 3, z 21. Plot 1: deck lamps as above. A standing lantern on the middle of every rib strut (x 15). Hanging lanterns under the deck floor at x 15, y Y−2, every 8 z where the arch and bents lie below (z 16..62, 112..190). A lantern on every pedestal top and every pier cap end. Run `$MCD light`/`check` and add lanterns until no exposed top is at light 0.

# DESIGNER SECTIONS

## PALETTE
Roles keep the MATERIALS ids exactly. Shape variants (all verified in 1.21.1): bricks -> brick_stairs, brick_slab, brick_wall; polished_granite -> polished_granite_stairs, polished_granite_slab; stone_bricks -> stone_brick_stairs, stone_brick_slab; polished_blackstone -> _wall, _slab, _stairs; smooth_sandstone -> smooth_sandstone_slab, cut_sandstone -> cut_sandstone_slab; polished_deepslate -> polished_deepslate_slab; smooth_stone -> smooth_stone_slab; smooth_quartz -> smooth_quartz_slab. Functional/decor: lantern, glass_pane, glowstone, lightning_rod, black_concrete (dark casemate), mossy_stone_bricks (sparse, <=1 in 10, near ground). No chain, no doors, no campfires (exterior only, no chimney).
Checked with `$MCD blocks --check`: all known except `chain` (unused).

## VOCABULARY
- fortWall(mask): per fort cell y0 smooth_stone, y1 polished_granite, y2..6 bricks (mossy_stone_bricks never in bricks; 1-in-10 cracked not required).
- parapetRun(mask): outer-edge cells y7 bricks, y8 polished_granite; parade-adjacent y7 brick_wall; skip lighthouse x2..4 z10..12 and tower cells.
- embrasure(x,z,face,wide=1): for y in tiers [1,3,5]: lower cell brick_slab type bottom, upper air; the cell 1 deeper (inward) black_concrete on both rows; in the upper row the pier cells either side brick_stairs half=top facing toward the opening. Writes slab/air over the solid wall (carve by not placing).
- loophole(x,y,z,face): single black_concrete cell recessed 1; front cell left air.
- sallyPort(): x26..27 y1..3 z18..25 air; stairs half=top x25,x28 y3 facing in; y4 x25..28 polished_granite with chiseled_stone_bricks at x26.
- gallery(run, face): every other cell from the 2nd, 3 tiers, 2 deep: brick_slab bottom in lower row, air above, stair heads as embrasure.
- stairTower(x0,z0,doorSide): 4x4 bricks y1..9 with stone_bricks quoins on corners on alternate courses, polished_granite_slab ring y10, 1x2 doorway y7..8.
- lighthouse(): as plan FACADES, blackstone family, green_terracotta core, glowstone centre, glass_pane edges.
- rockCluster(cells): andesite/cobblestone/mossy_cobblestone 1-2 high, never under a lamp.
- lampPost(x,z,base): polished_blackstone_wall x2 + lantern(hanging=false).
- pylon(x0,z0): smooth_sandstone body; fluting by leaving face cells (cell behind stays solid); cut_sandstone y1..3 and y36; inset crown y37..42; bottom smooth_sandstone_slab on exposed ledges.
- crossBeam(z0,z1), deckPier(x,z), cableHousing(z): solid smooth_sandstone.
- anchoragePanel(face, spans): recess 1 then 2 per plan; panel floor/back cells smooth_sandstone.
- deckSection(z0,z1,Y,slab): rows per plan (road, lines, sidewalk, curb full block, floor y Y-1, rail Y+1).
- trussBay(z,Y): chords Y-4 and Y-1 orange_terracotta, vertical at z≡2 mod 4, red_terracotta diagonal in rows Y-3..Y-2 alternating direction per bay.
- deckLamp(x,z,Y,outer): orange_concrete, red_concrete, lantern.
- archRib(table), spandrelPost(z), cableDive(table), bent(c), abutment(), hangLantern(x,y,z) (lantern hanging=true under a solid block).
Use `g.set` in cells; where the part would overwrite a reserved cell it must skip it.

## ROOMS
None. Exterior only. The fort's casemates are solid (notional); the sally port (x26..27, y1..3, z18..25) is open air and the tower doors lead onto the deck.
Entrance: sally port from the south, cell (26,1,26); street: (26,0,30) on the landward paving. Bridge module entrance: (15,35,190) on the road at the land end (walk north along the deck).

## PARTS
1. P1 fort shell: parts/fort-shell.mjs, plot 0: ground, ring, parapet, embrasures, loopholes, sally port, galleries. (fortWall, parapetRun, embrasure, loophole, sallyPort, gallery)
2. P2 fort towers+grounds: parts/fort-top.mjs, plot 0: stair towers, lighthouse, paving, rocks, lamps. (stairTower, lighthouse, rockCluster, lampPost)
3. P3 pylons+anchorage: parts/concrete.mjs, plot 1: pylons, cross beams, anchorage + panels, housings, piers + caps.
4. P4 deck+truss: parts/deck.mjs, plot 1: deckSection, trussBay, deckLamp, z11..190 with the descent table.
5. P5 arch+cables: parts/arch.mjs, plot 1: skewbacks, ribs, spandrel posts, struts, cables (nothing below y16 at x11..30 z17..53).
6. P6 approach+lighting: parts/approach.mjs, plot 1: bents, pedestals, abutment, hanging lanterns, pedestal/pier lanterns.

Order matters: P3 before P4 (deck meets beams), P4 before P5/P6 (truss sits above).

## Notes for workers
- Build each module in its OWN coordinates; plot 1 builds nothing at y 0.
- Never place anything in the architect's RESERVED cells; the housings replace curb/rail/truss at z72..75.
- Spawn-proof: bottom slabs on exposed ledges, lanterns per plan; run `$MCD light`/`check`.
- Block ids only from PALETTE; no chain, nothing past 1.21.1.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (coordinates from plan.md; plot 0 = fort, plot 1 = bridge; each module in its own local coords)

| # | Element | Construction (block by block) | Coords | Part | Vocab |
|---|---|---|---|---|---|
| 1 | Fort brick ring | y0 smooth_stone ground; y1 polished_granite base; y2..6 bricks solid; y6 is the deck (walk on 7) | all `#` cells | P1 | fortWall |
| 2 | Parapet + coping | y7 bricks outer edge, y8 polished_granite (slab-free full block); parade rail y7 brick_wall | outer / parade-adjacent cells | P1 | parapetRun |
| 3 | Three tiers of arched gun ports (N and W fronts) | per column: lower cell brick_slab(bottom) sill, upper air, cell behind black_concrete both rows; top row pier cells either side brick_stairs half=top facing into the opening; same columns on tiers y1-2, 3-4, 5-6 | plan FACADES embrasure columns | P1 | embrasure |
| 4 | 2-wide arches on 4-wide runs | middle two cells open, end cells upside-down brick_stairs | z2 x21..22, z6 x15..16, z8 x11..12, z10 x7..8 | P1 | embrasure(wide:2) |
| 5 | Landward south front with loopholes | plain bricks, 1x1 black_concrete slit recessed 1 at y3 and y5 mid-riser; east face slits z12,15,18 | south/east runs | P1 | loophole |
| 6 | Arched sally port | opening x26..27 y1..3 through z25..18 (air); stairs half=top at x25,x28 y3 facing in; y4 x25..28 polished_granite, chiseled_stone_bricks keystone x26 | z18..25 | P1 | sallyPort |
| 7 | Parade galleries | arched openings every other cell from 2nd, 3 tiers, brick_slab in lower row of both cells, 2 deep, stair heads | parade runs in plan | P1 | gallery |
| 8 | Corner stair towers | bricks, stone_bricks quoins alternating courses, polished_granite_slab cap ring y10, doorway y7..8 on parade side | N x24..27 z0..3; E x38..41 z2..5 (+buttress x38..39 z0..1 y1..8); SW x4..7 z32..35 | P2 | stairTower |
| 9 | Fort Point Lighthouse | legs polished_blackstone_wall, green_terracotta core x3 z11, gallery slab, glowstone lantern room with glass_pane, stair cap, lightning_rod y14 | x2..4 z10..12 y7..14 | P2 | lighthouse |
| 10 | Parade paving, seawall walk, shore rocks, landward paving | stone_bricks parade/landward, smooth_stone walk, boulders andesite/cobblestone/mossy_cobblestone <=2 high on <=30% of strip | open cells | P2 | rockCluster |
| 11 | Fort lamps (spawn-proof) | polished_blackstone_wall y1..2 + lantern y3; parade posts (16,12),(26,12),(24,8),(12,20); parapet lanterns every 6; hanging lantern in sally port (26,3,21) | plot 0 | P2 | lampPost |
| 12 | Two pairs of Art Deco pylons S1, S2 | smooth_sandstone, cut_sandstone plinth y1..3, fluting grooves by omitting face cells y6..35, string course y36, stepped crown to y42, bottom slab on every ledge | x1..7/23..29, z6..14, 63..71 | P3 | pylon |
| 13 | Cross beams S1, S2 | smooth_sandstone solid | x8..22 y26..29 z8..12 / z65..69 | P3 | crossBeam |
| 14 | South anchorage with Deco panels | smooth_sandstone solid, cut_sandstone y1..2 base and y12 cornice, y14 smooth_sandstone_slab, recessed panels and inner recesses as plan | x0..30 y1..14 z72..112 | P3 | anchoragePanel |
| 15 | Cable housings | solid smooth_sandstone wedges, cut_sandstone collar at z72, red_concrete cable buried | x7..9, 21..23 z72..80 | P3 | cableHousing |
| 16 | Anchorage piers + cap beams | smooth_sandstone | z88..90, 104..106 | P3 | deckPier |
| 17 | Deck: road, lines, sidewalks, floor, curb, rail | polished_deepslate road, smooth_quartz dashed lines, yellow_concrete centre, smooth_stone walks, gray_concrete floor, orange_terracotta curb, orange_concrete railing; slab variants on S segments | x8..22 z11..190 | P4 | deckSection |
| 18 | Stiffening truss | orange_terracotta chords+verticals (z≡2 mod 4), red_terracotta Warren diagonals | x8,22 y Y-4..Y-1 z14..190 | P4 | trussBay |
| 19 | Art Deco lamp posts | orange_concrete, red_concrete, standing lantern (z<=70 on outer sidewalk) | per plan lists | P4 | deckLamp |
| 20 | Steel arch ribs, skewbacks, spandrels, struts | orange_terracotta ribs 3 deep per table with red_concrete intrados, smooth_sandstone skewbacks, posts, red_terracotta struts, lantern on strut | x8..9, 21..22 z11..62 | P5 | archRib, spandrelPost |
| 21 | Main cables | red_concrete at y36 z71, diving per table into housings | x8,22 | P5 | cableDive |
| 22 | Approach bents | sandstone pedestals, orange_terracotta legs, red_concrete cap, red_terracotta X + mid strut | z120,136,152,168 | P6 | bent |
| 23 | Abutment | smooth_sandstone, cut_sandstone top | x8..22 z184..190 | P6 | abutment |
| 24 | Deck + bridge lighting | hanging lanterns under deck x15 Y-2 every 8 z; lanterns on pedestals, pier cap ends | per plan | P6 | hangLantern |
```

### rooms.json

```json
{"entrance":[26,1,26],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{"roles":{"fort_wall":["bricks"],"fort_arch":["brick_stairs","brick_slab"],"fort_base":["polished_granite","polished_granite_slab","polished_granite_stairs"],"casemate_dark":["black_concrete"],"fort_quoin":["stone_bricks","stone_brick_stairs","stone_brick_slab","chiseled_stone_bricks"],"parade_rail":["brick_wall"],"ground":["smooth_stone","smooth_stone_slab"],"paving":["stone_bricks","stone_brick_slab","stone_brick_stairs"],"shore_rock":["andesite","cobblestone","mossy_cobblestone"],"lighthouse":["polished_blackstone","polished_blackstone_wall","polished_blackstone_slab","polished_blackstone_stairs","green_terracotta","glowstone","glass_pane","lightning_rod"],"bridge_steel":["orange_terracotta"],"bridge_shadow":["red_terracotta"],"steel_highlight":["red_concrete","orange_concrete"],"concrete":["smooth_sandstone","smooth_sandstone_slab","cut_sandstone","cut_sandstone_slab"],"road":["polished_deepslate","polished_deepslate_slab"],"lane_line":["smooth_quartz","smooth_quartz_slab","yellow_concrete"],"sidewalk":["smooth_stone","smooth_stone_slab"],"deck_floor":["gray_concrete"],"light":["lantern"],"Fort masonry and recessed casemate arches":["bricks","brick_stairs","brick_slab","brick_wall","granite","granite_stairs","granite_slab","granite_wall","polished_granite","polished_granite_stairs","polished_granite_slab"],"Foundation, courtyard paving and parapet coping":["smooth_stone","smooth_stone_slab","stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall"],"Art Deco pylons, anchorage and concrete footings":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab","sandstone_wall","light_gray_concrete"],"Orange arch ribs, cables, spandrels, trusses and approach bents":["red_terracotta","orange_terracotta","red_concrete","orange_concrete","red_sandstone_stairs","cut_red_sandstone_slab"],"Railings and steel detail":["acacia_fence","acacia_fence_gate","acacia_trapdoor","iron_bars"],"Road and lane markings":["gray_concrete","white_concrete","yellow_concrete","smooth_stone","smooth_stone_slab"],"Lighthouse and lighting":["polished_deepslate","polished_deepslate_stairs","polished_deepslate_slab","polished_deepslate_wall","iron_bars","black_stained_glass_pane","lantern"],"Rocky shoreline, bluff and planting":["stone","cobblestone","cobblestone_stairs","cobblestone_slab","cobblestone_wall","mossy_cobblestone","gravel","grass_block","moss_block","oak_leaves","water"]},"objects":["lantern","glass_pane","glowstone","lightning_rod","black_concrete","mossy_stone_bricks"]}
```

### make.sh

```sh
#!/usr/bin/env bash
# The one command that makes build.nbt from scratch: node build.mjs writes every part in plan order to a temp file,
# the temp file must read back as a structure, then it moves into place. Stubs yield the bare ground course of plot 0.
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
// Builds the Golden Gate south kit (Fort Point and the bridge's south end) from its parts, in plan order. Each part
// writes plan.md's local coordinates; plot 0 (Fort Point) is shifted into the grid by PLOT0_ORIGIN. runParts lets each
// part only ADD into air (writes into an earlier part's cells are refused and reported) and reports off-palette blocks.
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, PLOT0, PLOT0_ORIGIN, PLOT1_ORIGIN, SMOOTH_STONE } from "./vocab/base.mjs";
import * as fortShell from "./parts/fort-shell.mjs";
import * as fortTop from "./parts/fort-top.mjs";
import * as concrete from "./parts/concrete.mjs";
import * as deck from "./parts/deck.mjs";
import * as arch from "./parts/arch.mjs";
import * as approach from "./parts/approach.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// A part's view of one plot: its local (x, y, z) are shifted by the plot's grid origin before they reach the grid.
function plotView(g, [ox, oy, oz]) {
  const at = (x, y, z) => [x + ox, y + oy, z + oz];
  const view = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, ...rest) => { target.set(...at(x, y, z), ...rest); return view; };
      if (prop === "unset") return (x, y, z) => { target.unset(...at(x, y, z)); return view; };
      if (prop === "get" || prop === "blockAt" || prop === "isAir" || prop === "inBounds") return (x, y, z) => target[prop](...at(x, y, z));
      if (prop === "fill") return (a, b, block, state) => { target.fill(at(...a), at(...b), block, state); return view; };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return view;
}

// one grid for the whole site: no water, no ground outside plot 0; y 0 of plot 0 is the ground course
const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
for (let x = PLOT0.x[0]; x <= PLOT0.x[1]; x++) for (let z = PLOT0.z[0]; z <= PLOT0.z[1]; z++) g.set(x + PLOT0_ORIGIN[0], PLOT0.y[0] + PLOT0_ORIGIN[1], z + PLOT0_ORIGIN[2], SMOOTH_STONE);

runParts(
  g,
  [
    ["fort shell", (v) => fortShell.build(plotView(v, PLOT0_ORIGIN))],
    ["fort towers and grounds", (v) => fortTop.build(plotView(v, PLOT0_ORIGIN))],
    ["pylons and anchorage", (v) => concrete.build(plotView(v, PLOT1_ORIGIN))],
    ["deck and truss", (v) => deck.build(plotView(v, PLOT1_ORIGIN))],
    ["arch and cables", (v) => arch.build(plotView(v, PLOT1_ORIGIN))],
    ["approach and lighting", (v) => approach.build(plotView(v, PLOT1_ORIGIN))],
  ],
  { palette: "palette.json", roof: "roof.json" },
);

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the Golden Gate south kit: palette ids (palette.json only), plan.md site coordinates, seeded rng.
// Two plots in one grid. Plot 1 (the bridge) is at the grid origin; plot 0 (Fort Point) is built in its own frame and
// build.mjs shifts it by PLOT0_ORIGIN. Parts write plan.md's local coordinates; nothing here changes them.

// ---- palette (bare ids as in palette.json; the toolkit adds minecraft:) ------------------------------------------

// ---- palette (bare ids as in palette.json; the toolkit adds minecraft:) ------------------------------------------
/** Fort wall body and parapet. */
export const BRICKS = "bricks";

/** Arch heads (placed upside down), buttress risers. */
export const BRICK_STAIRS = "brick_stairs";

/** Embrasure sills, gallery bottom slabs, landward ledges. */
export const BRICK_SLAB = "brick_slab";

/** Parade rail (y 7) on the courtyard side. */
export const BRICK_WALL = "brick_wall";

/** Fort base course, coping, sally port lintel. */
export const POLISHED_GRANITE = "polished_granite";

/** Stair tower cap ring (y 10). */
export const POLISHED_GRANITE_SLAB = "polished_granite_slab";

/** Polished granite stairs (shape variant, unused by the plan's facades). */
export const POLISHED_GRANITE_STAIRS = "polished_granite_stairs";

/** Dark casemate backs and loophole backs. */
export const BLACK_CONCRETE = "black_concrete";

/** Fort quoins on the stair towers, alternating courses. */
export const STONE_BRICKS = "stone_bricks";

/** Quoin and paving stair variant. */
export const STONE_BRICK_STAIRS = "stone_brick_stairs";

/** Quoin and paving slab variant. */
export const STONE_BRICK_SLAB = "stone_brick_slab";

/** Sally port keystone (x 26, y 4). */
export const CHISELED_STONE_BRICKS = "chiseled_stone_bricks";

/** Plot 0 ground course, the walk, and the sidewalk. */
export const SMOOTH_STONE = "smooth_stone";

/** Ground and sidewalk slab variant. */
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";

/** Shore rock boulders (mixed with cobblestone). */
export const ANDESITE = "andesite";

/** Shore rock boulders (mixed with andesite). */
export const COBBLESTONE = "cobblestone";

/** Shore rock boulders, sparse. */
export const MOSSY_COBBLESTONE = "mossy_cobblestone";

/** Sparse decor, at most 1 in 10, near ground. */
export const MOSSY_STONE_BRICKS = "mossy_stone_bricks";

/** Lighthouse legs, gallery, cap. */
export const POLISHED_BLACKSTONE = "polished_blackstone";

/** Lighthouse legs and lamp posts. */
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";

/** Lighthouse gallery top (3x3), lamp posts' slab variant. */
export const POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab";

/** Lighthouse cap ring, rising inward. */
export const POLISHED_BLACKSTONE_STAIRS = "polished_blackstone_stairs";

/** Lighthouse core column (x 3 z 11, y 7..10). */
export const GREEN_TERRACOTTA = "green_terracotta";

/** Lighthouse lantern-room centre. */
export const GLOWSTONE = "glowstone";

/** Lighthouse lantern-room edges. */
export const GLASS_PANE = "glass_pane";

/** Lighthouse lightning rod (y 14). */
export const LIGHTNING_ROD = "lightning_rod";

/** Bridge steel, primary: ribs' body, chords, verticals, curbs. */
export const ORANGE_TERRACOTTA = "orange_terracotta";

/** Bridge steel, secondary: Warren diagonals, cross struts, bents' X bracing. */
export const RED_TERRACOTTA = "red_terracotta";

/** Steel highlight: rib intrados, bent caps, cable, lamp posts. */
export const RED_CONCRETE = "red_concrete";

/** Steel highlight: railing, lamp bases. */
export const ORANGE_CONCRETE = "orange_concrete";

/** Pylons, anchorage, beams, piers (cream concrete). */
export const SMOOTH_SANDSTONE = "smooth_sandstone";

/** Concrete slab variant: exposed ledges and slab steps. */
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";

/** Plinths, anchorage base and cornice, abutment top, pylon bands. */
export const CUT_SANDSTONE = "cut_sandstone";

/** Concrete slab variant for cut sandstone. */
export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";

/** Road surface. */
export const POLISHED_DEEPSLATE = "polished_deepslate";

/** Road surface on slab steps. */
export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab";

/** Dashed lane lines (x 12, x 18). */
export const SMOOTH_QUARTZ = "smooth_quartz";

/** Dashed lane lines on slab steps. */
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";

/** Centre lane line (x 15). */
export const YELLOW_CONCRETE = "yellow_concrete";

/** Deck floor under the road and sidewalks (Y-1). */
export const GRAY_CONCRETE = "gray_concrete";

/** Lamps, lanterns on pedestals and pier caps, hanging lanterns. */
export const LANTERN = "lantern";

// ---- site (plan.md coordinates; grid = plot 1's frame, plot 0 shifted by PLOT0_ORIGIN) ----------------------------
/** Whole kit grid: x 0..42, y 0..50, z 0..190 (MC 1.21.1). */
export const SITE_SIZE = [43, 51, 191];

/** Grid offset of plot 0 (Fort Point): its footprint is x 0..42, z 17..53 in the grid (the arch's Fort Point box). */
export const PLOT0_ORIGIN = [0, 0, 17];

/** Grid offset of plot 1 (the bridge): none, plot 1 is the grid's own frame. */
export const PLOT1_ORIGIN = [0, 0, 0];

/** Plot 0 local extent (inclusive): Fort Point, y 0 is the ground course. */
export const PLOT0 = { x: [0, 42], y: [0, 16], z: [0, 36] };

/** Plot 1 local extent (inclusive): the bridge, y 0 is the water surface and stays empty. */
export const PLOT1 = { x: [0, 30], y: [1, 50], z: [0, 190] };

/** Water surface: plot 1 builds nothing at this y. */
export const WATER_Y = 0;

/** Bridge centre line (road and lane line x). */
export const CENTRE_X = 15;

/** Cable and rib/truss planes (x). */
export const CABLE_X = [8, 22];

/** Road x (plot 1). */
export const ROAD_X = [11, 19];

/** Deck top steps by z (inclusive): the road, sidewalks and curbs sit at y, railing at y+1, truss at y-4..y-1. */
export const DECK_STEPS = [

// ---- seeded random ------------------------------------------------------------------------------------------------
/** rng(seed) -> a function returning floats in [0, 1), the same sequence for the same seed (mulberry32). */
export function rng(seed)
```

### vocab/h1.mjs

```js
// H1 helpers from plan.md VOCABULARY: fortWall, loophole, stairTower, lampPost, deckPier, deckSection, archRib, bent.
//
// Every helper takes its position (and facing, where it has one) as arguments. Writes go only into AIR: a cell that
// already holds a block, or lies outside the grid, is left alone and listed in `skipped` as [x, y, z, block], so the
// caller can report it. Pass { over: true } only where an earlier part's solid cell is meant to be replaced (a loophole
// carved through the fort wall, a tower built on the fort). Nothing writes the row under its footprint (ground, floor,
// water): fortWall's ground course is laid only with { ground: true }. Each helper returns { box, placed, skipped }:
// box is the footprint it was given as [x0, y0, z0, x1, y1, z1], placed the count written, skipped the refused cells.

/**
 * Fort wall: the solid casemate ring. mask is rows of text; one char = 2x2 blocks (char c -> x0+2c..+1, row r ->
 * z0+2r..+1), '#' = fort. Each fort cell: polished_granite at y0+1 (base course), bricks at y0+2..y0+6. The ground
 * course (y0, smooth_stone) is laid only with ground: true, since the ground part owns that row. clip: [xMax, zMax]
 * trims cells past the plot edge. Footprint: the mask's rectangle, rows y0..y0+6.
 */
export function fortWall(g, x0, z0, mask, { y0 = 0, clip = null, ground = false, over = false } = {})

/**
 * Loophole: a 1x1 black_concrete slit recessed 1 into a wall. face is the way the wall faces (north = the wall's outer
 * face looks to −z). (x, y, z) is the front cell, left air; the slit is one cell inward of it. Footprint: those two cells.
 */
export function loophole(g, x, y, z, face, { over = false } = {})

/**
 * Stair tower: a solid 4x4 of bricks, stone_bricks quoins on the four corners on alternate courses, a
 * polished_granite_slab cap ring at the top, and a 2-wide, 2-high doorway in the wall facing doorSide
 * ('north' | 'south' | 'east' | 'west'). (x0, z0) is the north-west corner, y0 the bottom course (plan: 1).
 * Rows y0..y0+8 are the walls, y0+9 the cap ring, the doorway y0+6..y0+7. Footprint: x0..x0+3, y0..y0+9, z0..z0+3.
 */
export function stairTower(g, x0, y0, z0, doorSide, { over = false } = {})

/**
 * Lamp post: a polished_blackstone_wall post at base and base+1, a standing lantern at base+2. base is the walk row
 * (plan: 1, on the ground course at 0, which is never written). Footprint: the column, rows base..base+2.
 */
export function lampPost(g, x, z, base, { over = false } = {})

/**
 * Anchorage deck pier: a solid 3x3 of smooth_sandstone at (x, z) (its min corner), rows yLo..yHi. With cap: [xa, xb],
 * a cap beam runs along x at yHi+1 across the pier's three z rows, from xa to xb. Give the cap to one pier of a pair
 * only. Footprint: the pier with its cap span.
 */
export function deckPier(g, x, z, { yLo = 15, yHi = 28, cap = null, over = false } = {})

/**
 * Deck section: the bridge deck for rows z0..z1 (inclusive) at walking level Y, in the plan's cross-section from x0
 * (the west curb; the east curb is x0+14). Full blocks: curb (orange_terracotta, Y), railing (orange_concrete, Y+1),
 * floor (gray_concrete, Y-1, under the walks and road). Walking rows at Y: sidewalks (smooth_stone) at x0+1..2 and
 * x0+12..13, road (polished_deepslate) at x0+3..11, dashed smooth_quartz lines at x0+4 and x0+10 (on where z % 4 is 0
 * or 1, road otherwise), a continuous yellow_concrete centre line at x0+7. slab: the walking rows are bottom slabs (the
 * S segments; the curb stays full). Footprint: x0..x0+14, Y-1..Y+1, z0..z1.
 */
export function deckSection(g, z0, z1, Y, { slab = false, x0 = 8, over = false } = {})

/**
 * Arch rib: a steel band 2 wide (in each pair of ribs) and 3 deep. table maps z -> intrados y (the rib's lowest row);
 * each z holds intrados..intrados+2, orange_terracotta with the intrados row red_concrete. Where a z's intrados jumps
 * more than 2 from a neighbour, that column is filled vertically up to (or down to) the neighbour so the rib stays
 * continuous. ribs: the x pairs (plan: x 8..9 and 21..22). Footprint: the ribs' x span, the table's z rows, and the
 * y range actually used.
 */
export function archRib(g, table, { ribs = [[8, 9], [21, 22]], over = false } = {})

/**
 * Approach bent at row c (its legs and cap run z c-1..c). row: { pedTop, legs: [lo, hi] } from the bent table; the cap
 * is the row above the legs. span: the bridge's west and east leg lines (plan: [8, 22]). Smooth_sandstone pedestals
 * from y 1 to pedTop (x span0-1..span0+2 and span1-2..span1+1, z c-2..c+1), orange_terracotta legs (x span0..+1 and
 * span1-1..span1), a red_concrete cap across the span. Where the legs are taller than one block, a red_terracotta X
 * fills the bay between them (stepped, leg top to leg foot) with a horizontal strut at mid-height. Footprint:
 * span0-1..span1+1, y 1..cap, z c-2..c+1.
 */
export function bent(g, c, row, { span = [8, 22], over = false } = {})
```

### vocab/h2.mjs

```js
// plan.md VOCABULARY, part 2: parapetRun, sallyPort, lighthouse, pylon, cableHousing, trussBay, spandrelPost, abutment.
// Every helper takes its position as arguments and returns { placed, refused }; refused = [x, y, z, block, reason].
// Writes stay inside the footprint the helper computes from its arguments, go only into air (opts.over replaces, for
// the cut-throughs and the walls it owns), and never touch y < 1 (the ground course and the water are earlier parts').

// The fort's outer parapet: y7 bricks and a y8 polished_granite coping on outer cells, a y7 brick_wall rail on parade cells.
// cells = [[x, z, "outer" | "parade"], ...]. Cells inside opts.skip (boxes [x0, z0, x1, z1]; default: the lighthouse and
// the towers) are left alone. A rail cell connects "low" to each neighbouring rail cell in the same run.
export function parapetRun(g, cells, opts = {})

// A sally port through the wall at z1 (the face row): the passage x..x+1, y..y+2, z0..z1 is air, with upside-down brick
// stairs at x-1 and x+2 (y+2, z1) facing into the opening, and a y+3 lintel of polished_granite across x-1..x+2 with a
// chiseled keystone at x. Carving through a solid wall needs opts.over (the fort's wall is an earlier part's).
export function sallyPort(g, x, y, z0, z1, opts = {})

// The lighthouse on a 3x3 base at x..x+2, z..z+2, from base y to y+7: polished_blackstone_wall legs at the corners (y..y+3),
// a green_terracotta core, a 3x3 polished_blackstone_slab gallery (y+4), the lantern room (y+5: glowstone centre, glass_pane
// edges facing it, blackstone wall corners), a stair cap (y+6: polished_blackstone centre, stairs rising inward) and a
// lightning_rod at y+7. Air-only unless opts.over.
export function lighthouse(g, x, y, z, opts = {})

// A Deco pylon: a 7 x 9 body at x..x+6, z..z+8 from base y (1) to y+41 (y42). Plinth cut_sandstone at y..y+2, body
// smooth_sandstone, string course cut_sandstone at y+35. Fluting: from y+5 to y+34 the face cells are left out (the cell
// behind stays solid) on the north and south faces at x+2 and x+4, and on the outer column at z+2, z+4, z+6. The outer
// column is the west one unless opts.outer says "east" (west of the centre line x 15 is the default). Crown: an inset-1
// tier (x+1..x+5, z+1..z+7) at y+36..y+38, an inset-2 tier (x+2..x+4, z+2..z+6) at y+39..y+40, and a y+41 slab course
// over the inset-2 footprint (the ridge). Every exposed ledge gets a bottom slab on top.
export function pylon(g, x, y, z, opts = {})

// One cable housing: a solid smooth_sandstone wedge at x-1..x+1, z, from y15 up to cableY+1, with the cable itself
// (red_concrete) buried at x, cableY. opts.collar: a cut_sandstone ring 1 proud of the housing (at z-1) around the mouth.
export function cableHousing(g, x, z, cableY, opts = {})

// One 4-long bay of the stiffening truss at z..z+3, deck level Y, in each column of opts.xs (default x 8 and x 22):
// chords orange_terracotta at Y-4 and Y-1, a vertical at z in Y-3..Y-2, and a red_terracotta Warren zigzag across Y-3..Y-2
// through z+1..z+3. The zigzag starts in the upper row on one bay and the lower row on the next (by z).
export function trussBay(g, z, Y, opts = {})

// The spandrel posts above an arch rib at plan z: orange_terracotta, 1 deep in z, two wide, from y0 up to y1 (default 29).
// opts.pairs: the x pairs (default [8, 9] and [21, 22]).
export function spandrelPost(g, z, y0, y1 = 29, opts = {})

export function abutment(g, x0, x1, z0, z1, opts = {})
```

### vocab/h3.mjs

```js
// Plan VOCABULARY helpers for the Golden Gate south kit: embrasure, gallery, rockCluster, crossBeam,
// anchoragePanel, deckLamp, cableDive, hangLantern. Each takes its position as arguments and writes only its own
// footprint. Writes go only into air unless opts.carve is set, which lets the helper cut into what an earlier part
// built (the fort wall, the anchorage body, the railing, the cable housing). Nothing is written at y 0 or below.
// Helpers return the number of cells written; a write the guard refuses is not counted.

/**
 * Gun port, `wide` cells across, one per tier (tiers default 1, 3, 5). (x, z) is the outer cell of the first opening;
 * face is the way the port opens (outward). Per tier: a brick_slab sill (bottom) and air above it in the outer cell;
 * black_concrete in the cell 1 deeper, both rows; upside-down brick_stairs in the upper row of the piers either side,
 * facing toward the opening. Piers stay wall in the lower row.
 */
export function embrasure(g, x, z, face, wide = 1, opts = {})

/**
 * Parade arcade on one run. run = { at, from, to }: the fort row (z for north/south faces, x for east/west) and the
 * run's first and last cells along it. Openings every other cell from the 2nd, 2 deep, 3 tiers. Lower row brick_slab
 * (bottom) in both cells, air above. Upper-row arch heads on the piers, upside-down brick_stairs facing the opening.
 * A pier between two openings stays wall (no stair can face both). The footprint takes the pier one cell past the run.
 */
export function gallery(g, run, face, opts = {})

export function rockCluster(g, cells, base, opts = {})

/** Solid smooth_sandstone cross beam over z z0..z1 and the box box = { x0, x1, y0, y1 }. */
export function crossBeam(g, z0, z1, box, opts = {})

/**
 * Art Deco recessed panels on an anchorage face. face is the outward direction, `at` the plane of the face (x for
 * west/east, z for south/north). spans: [[a0, a1]] along the face, panels between y[0]..y[1]. Recess 1 clears the
 * face cell of each panel. inner: [[a0, a1]] within the spans, a second recess 2 deep at innerY[0]..innerY[1]: it
 * clears the next cell too. Floors and backs are smooth_sandstone.
 */
export function anchoragePanel(g, face, at, { spans, inner = [], y, innerY }, opts = {})

/**
 * Art Deco lamp post at (x, Y+1..Y+3, z): orange_concrete, red_concrete, standing lantern. outer: the post stands on the
 * outer sidewalk cell; then lane (±1, the walk's direction off the post) is required and the two cells beside the post
 * on that side must be air (a 2-high clear lane), or nothing is placed.
 */
export function deckLamp(g, x, z, Y, outer = false, opts = {})

/**
 * Main cable: red_concrete at every x in xs, following table = [[z, y], ...], the cable's height at each z. Between two
 * rows the cable fills vertically at the later z, so it stays continuous. It is buried in the housing, so pass carve.
 */
export function cableDive(g, table, xs, opts = {})

/** Hanging lantern at (x, y, z), hung from the block above it. Writes nothing if the cell above is air. */
export function hangLantern(g, x, y, z, opts = {})
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
