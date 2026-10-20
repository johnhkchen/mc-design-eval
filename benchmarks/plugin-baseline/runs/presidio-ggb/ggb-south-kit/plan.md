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
- P1 done (fort-shell.mjs): ring is solid everywhere incl. tower footprints (P2 must use over:true); N embrasure at x25 z0 skipped (tower); gallery/loophole carve into own wall.
