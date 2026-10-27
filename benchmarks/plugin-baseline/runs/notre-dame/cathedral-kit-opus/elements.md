# Notre-Dame de Paris: REQUIRED ELEMENTS (checklist)

Coordinates are plan.md's (plot 0; axis along x, west low x, chevet high x, south = high z = the river/camera).
North mirrors south: z(north) = 76 - z(south). "Part" = the generator module; "vocab" = plan.md VOCABULARY helper.
Exterior only: the inside is a lit void that glows through the glass.

## Massing (P1 shell, parts/shell.mjs)
- [x] **Two west towers, flat tops at y 95, parapet 96..97** (M1 x 2..22 z 10..30; M2 z 46..66). Hollow smooth_sandstone walls 2 thick, clasping corner buttresses +1 to y 93, stepped corner at z 10..11 / 65..66 starting x 5. Vocab `ashlarWall`, `plinthCourse`, `setoffPier`.
- [x] **Facade centre** M3 x 2..22 z 31..45 y 3..57, west portal base M5 x 2..8 (7 thick), nave west gable M4 (stone gable, peak y 63 at z 38). Vocab `ashlarWall`, `stoneGable`.
- [x] **Nave + choir clerestory** M6/M11 x 23..152 z 27..49 y 3..47, walls 2 thick (z 27..28 / 48..49). Vocab `ashlarWall` tiled by `flankBay`.
- [x] **Tribunes** M7/M12 z 17..26 / 50..59 y 3..31 and **outer aisles + chapels** M8/M13 z 10..16 / 60..66 y 3..20. Vocab `flankBay`.
- [x] **Transept** M9 x 85..103 z 9..67 y 3..47 with stone gable ends to y 57; front buttresses M10 x 85..87 / 101..103 at z 68..69 / 7..8. Vocab `stoneGable`, `setoffPier`.
- [x] **Apse** half-decagon M14 (vertices (152,49) (158,47) (162,41) (162,35) (158,29) (152,27)); **ambulatory rings** M15 (r 11..19, y ≤31) and M16 (r 19..26, y ≤20) about C = (152, 38). Vocab `polarWall`, `polygonWall`.
- [x] **Five radiating chapels** M17 at angles 0, ±36, ±72 (Lady chapel face x 181 z 35..41; (174,22)/(174,54); (160,12)/(160,64)), y 3..20. Vocab `radialChapel`.
- [x] **Sacristy** M18-M20 (gallery x 122..142 z 70..79; west wing x 115..134 z 80..99; main hall x 135..149 z 80..107, buttresses to z 110), y 1..16 / 26. Vocab `ashlarWall`, `setoffPier`.
- [x] **South-east stair turret** M21 x 105..108 z 67..72 y 2..50 octagonal, cone 51..54. Vocab `octagonRing`.
- [x] **Plinth** every footing down to the local ground: stone_bricks + ~1/10 cracked_stone_bricks to y 2, smooth_stone top course, +1 proud. Vocab `plinthCourse`.
- [x] **Every OPENING left as air** (portals, chapel/tribune/clerestory windows, roses, belfry lancets, apse/chapel windows, sacristy windows) and every RESERVED cell untouched.

## Relief (the point: P1 piers; P4 the rest)
- [x] **Outer piers (culées)** nave p = 32..80 step 8, choir p = 112..144 step 8, x p..p+1, z 65..69 (S) / 7..11 (N), y 3..38, set-offs: face z 69 to y 20, z 68 to y 30, z 67 to y 38, each set-off capped by `smooth_sandstone_stairs` weathering facing out. P1, vocab `setoffPier`.
- [x] **Six chevet piers** at -90, -54, -18, +18, +54, +90° (plan.md coordinates), same set-offs radially. P1, vocab `setoffPier` (radial variant `radialPier`).
- [x] **Pier pinnacles** above every pier, x p..p+1 z 66..67 (S) / 9..10 (N), y 39..47: 2x2 smooth_sandstone shaft 39..42 with four `smooth_sandstone_stairs` gablets at 42, 1x1 `sandstone_wall` spirelet 43..46, `end_stone_brick_wall` finial 47. P4, vocab `pinnacle`.
- [x] **Flying buttresses (nave+choir, both sides)**: one block thick at x p, z 64→51 (S) / 12→25 (N); top course y per plan.md table (36 at z 64 → 45 at z 51), `smooth_sandstone_stairs` coping (facing toward the clerestory, climbing), `smooth_sandstone` body, upside-down stair underside; 2 deep at both ends, 1 deep mid-span; air below (≥4 sky above the lean-to roofs). P4, vocab `flyer`.
- [x] **Six chevet flyers**: radial, r 27 (y 36) → r 11 (y 45), Bresenham cells along the angle, same section. P4, vocab `flyerRadial`.
- [x] **Clerestory wall buttresses** x p..p+1 at z 50 (S) / 26 (N), y 37..47, 1 proud; apse vertex buttresses at the 6 polygon corners. P4, vocab `wallButtress`.
- [x] **Gargoyles** one per clerestory buttress at y 47: `chiseled_sandstone` at z 51 + `sandstone_stairs` snout at z 52 (facing back toward the wall, i.e. upside-down stair pointing out). Mirror north z 25/24. P4, vocab `gargoyle`.
- [x] **String course y 19 + balustrade y 20** along the outer aisle walls and the ambulatory ring; **corbel table y 46, cornice y 47, pierced parapet y 48** along the clerestory and the apse. P4, vocab `stringCourse`, `corbelTable`, `balustrade`.
- [x] **Window reveals**: every window 1 recessed with `cut_sandstone` jambs, pointed head of upside-down `smooth_sandstone_stairs`, `smooth_sandstone_slab` sill. P1 (shape left as air with jambs), vocab `lancet`.

## Roofs (P2, parts/roofs.mjs)
- [x] **Nave+choir lead roof** R1 one gable x 23..152, eave 48, ridge 59 at z 38, `iron_bars` crest y 60, stops round the spire box x 90..98 z 34..42. `$MCD roof` gable + lead mix; vocab `leadCourse`, `ridgeCrest`.
- [x] **Transept roof** R2 ridge along z, ridge 57 at x 94, valleys into R1. `$MCD roof` gable.
- [x] **Apse roof** R3 five hipped facets rising to y 59 at (152,38); ridge cross `end_stone_brick_wall` + `end_rod` at x 152 y 60..62. Vocab `apseRoof`.
- [x] **Tribune lean-tos** R4 (32→37) and **aisle lean-tos** R5 (21→25), straight along the flanks and polar round the apse. Vocab `leanTo`, `leanToPolar`.
- [x] **Chapel roofs** R6 small radial gables 20→24. Vocab `radialChapel` (roof half).
- [x] **Tower decks** R7 flat `polished_deepslate` at y 95. Vocab `leadDeck`.
- [x] **Sacristy roofs** R8 gables with overhang 1 and `smooth_sandstone_stairs` verge.

## West front (P3, parts/westfront.mjs)
- [x] **Three deep portals** (Virgin z 17..25, Last Judgement z 34..42 with trumeau z 38, St Anne z 51..59), archivolts stepping in 1 per 2 courses, `chiseled_sandstone` tympana, `dark_oak_door` pairs at x 6. Vocab `portal`.
- [x] **Gallery of Kings** y 23..28, 28 niche statues at x 2, even z 12..64. Vocab `kingNiche`.
- [x] **West rose** centre (x 2, y 39, z 38) r 6, in square frame z 31..45. Vocab `roseWindow`.
- [x] **Blind lancets** each tower y 32..45. Vocab `lancet`.
- [x] **Grand Gallery** open colonnade y 48..56 x 2..3 z 10..66, cornices 47 and 57. Vocab `colonnade`.
- [x] **Chimera gallery** balustrade y 57..58 + chimeras at the tower corners. Vocab `balustrade`, `gargoyle`.
- [x] **Belfry lancets** 2 per face 3 x 25 (y 62..86), louvred. Vocab `belfryLancet`.
- [x] **Openwork parapet + corner pinnacles** y 96..97 (none higher). Vocab `balustrade`.
- [ ] **Four facade buttresses** to x 0 (+2), y 3..57. Vocab `setoffPier`.

## Transept faces (P4)
- [x] **South rose** (hero) and north rose: disc r 6 about (94, 40), plane z 66 / 10, square frame x 87..101, pierced spandrels. Vocab `roseWindow`.
- [x] **Transept portals** (Saint-Étienne S, Cloître N) x 91..97 with wimperg to y 26. Vocab `portal`, `wimperg`.
- [x] **Triforium lancets** odd x 88..100, y 28..31. Vocab `lancet`.
- [x] **Transept gables** crocketed rakes, small rose 3x3 y 51..53, finial y 57..58. Vocab `stoneGable`, `roseWindow` (r 1).
- [x] **Transept buttress pinnacles** y 55..60. Vocab `pinnacle`.

## Chevet details (P4)
- [x] **Chapel windows under gablets**: each chapel window 3 x 12 (y 5..16) with a wimperg rising to y 25 in front, `chiseled_sandstone` apex, corner pinnacles y 21..26. Vocab `wimperg`, `pinnacle` (small).

## Spire (P5, parts/spire.mjs)
- [x] **Spire drum** M22 x 90..98 z 34..42 y 50..70, octagon (corners cut 2), tall lancets on each face. Vocab `octagonRing`.
- [x] **Needle** M23 centred (94, 38): 7 wide y 71..85, 5 wide 86..105, 3 wide 106..124, 1 wide 125..133; ribs `deepslate_tile_wall` on the arrises; crockets every 3 courses. Vocab `octagonRing`, `crocket`.
- [x] **Cross arms** y 131, mast `end_rod` 134..136, **rooster tip `lightning_rod` at (94, 137, 38)** = the highest block. Vocab `spireTip`.
- [x] **Apostles** 4 groups of 3 on the roof slopes y 51..56. Vocab `apostle`.

## Glass, light, ground (P6, parts/finish.mjs)
- [x] **Stained glass** every lancet (`blue` 60 / `purple` 20 / `red` 20 % panes), rose fields full blocks. Vocab `glazeLancet`, `roseWindow` (glass).
- [x] **Glow behind glass**: `shroomlight` 2 cells behind every window and rose. Vocab `glowBehind`.
- [x] **Floodlights** `ochre_froglight` flush in the ground course 1 out from every south/chevet pier foot; every 6 on west and north. Vocab `floodlight`.
- [x] **Lanterns** standing on every pier set-off at y 20 (south + chevet), hanging under tower corbels, on parapets so every walkable deck/gallery/gutter is ≥ 8. Vocab `pierLantern`.
- [x] **Paving strip** `smooth_stone` 1 wide along the walls. Vocab `paveStrip`.
- [x] **Belfry louvres** `spruce_trapdoor` (open) over `black_stained_glass_pane`. Vocab `belfryLancet` (fill).
- [ ] **Doors** `dark_oak_door` pairs in every portal (west 3, transept 2, Porte Rouge, sacristy).
