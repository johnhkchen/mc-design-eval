# Required elements: the lumber camp

Coordinates are the architect's (plan.md). "Vocab" names the helper in plan.md VOCABULARY. Parts: P1 Bunkhouse log shell,
P2 Sawmill pole frame, P3 Roofs, P4 Fittings (glazier, joiner, lamplighter), P5 Chimneys, stacks and fires, P6 Grounds and yard.

- [ ] **1. Log bunkhouse, saddle-notched corners** (P1, vocab `plinthCourse`, `logCourse`, `saddleNotch`). Plinth y=1 `cobblestone`
  (`mossy_cobblestone` ~1 in 6) x=4..18, z=8..17 ring. Courses y=2..5 of `spruce_log`: north/south walls axis x, east/west walls axis z.
  Notches: even courses (y=2,4) the axis-x logs run x=3..19 at z=8 and z=17 (log ends 1 past each corner); odd courses (y=3,5) the
  axis-z logs run z=7..18 at x=4 and x=18. Opening cells stay air.
- [ ] **2. Front porch** (P1 deck/posts/rail/step; P3 its roof; vocab `porchBay`). Deck `spruce_planks` x=5..17,y=1,z=5..7; posts
  `stripped_spruce_log` axis y at x=5,9,17 (none at x=13, the step gap), y=2..3, z=5; `spruce_fence`
  at y=2, z=5, x=6..8, 10..12, 14..16; `spruce_stairs` facing south at (13,1,4).
- [ ] **3. Steep slate roof with pale gables** (P3, `roof.json`, vocab none). The architect's cottage-preset spec; gable triangles
  `stripped_spruce_log`, `dark_oak` verges; loft windows left air at (18,8..9,15) and (4,8..9,12..13).
- [ ] **4. Cook chimney with smoke** (P5, vocab `fieldstoneStack`). 2x2 stack x=19..20, z=12..13, y=1..16 of `cobblestone` with
  `mossy_cobblestone` ~1 in 6; `stone_bricks` band y=15; y=16 three `cobblestone` + lit `campfire` at (20,16,13); y=17 `cobblestone_slab`
  (bottom) ring x=18..21, z=11..14 minus the 4 stack cells, air above the campfire.
- [ ] **5. Mess hearth** (P5, vocab `hearthMouth`). Firebox in the east wall at (18,2..3,12..13): floor cobble at y=1 (plinth), lit
  `campfire` (lit true, signal_fire false) at (18,2,12), `smoker` (lit) at (18,2,13) facing west; (18,3,12..13) stay air; lintel `cobblestone_stairs` half top facing west at (17,4,12..13).
- [ ] **6. Cordwood** (P6, vocab `cordwood`). West: `spruce_log` axis z, x=2..3, z=9..10, y=1..2. Woodshed: x=9..12, z=18..19, y=1..3.
- [ ] **7. Woodshed lean-to** (P6 posts and wood, P3 roof; vocab `leanToPost`). Posts `stripped_spruce_log` axis y at (5,1..3,21), (8,1..3,21), (12,1..3,21),
  beam `stripped_spruce_wood` axis x at y=3, x=5..12, z=21; roof BY HAND in P3.
- [ ] **8. Shutters on every window** (P4, vocab `shutterPair`). `spruce_trapdoor` open true, flat against the wall, positions per FACADES.
- [ ] **9. Doors** (P4, vocab `doorPair`): front (13,2..3,8) facing north; back (7,2..3,17) facing south; `spruce_door`.
- [ ] **10. Porch lanterns** (P4, vocab `hangLantern`): `lantern` hanging true at (12,3,6),(14,3,6) on `iron_chain` axis y at y=4.
- [ ] **11. Bunkroom bunks** (room designer, vocab `bunkBed`), **mess table and benches** (`messTable`), **loft bunks and stores**.
- [ ] **12. Loft ladder + hatch** (P1 floor hole, P4 ladder; vocab `loftLadder`): `ladder` facing north at (5,2..5,16) on the back wall, hatch air at (5,5,16).
- [ ] **13. Open pole-frame sawmill** (P2, vocab `millPost`, `kneeBrace`, `topPlate`). 12 posts `stripped_spruce_log` axis y, y=1..5, x=23,27,31,35
  at z=8 and z=20 and z=12,16 at x=23,35; plate `stripped_spruce_wood` y=6 (axis x on z=8, z=20; axis z on x=23, x=35); knee braces
  `spruce_stairs` half top at y=5 beside every post on north, south and long sides, facing the post.
- [ ] **14. Mill floor, half wall, boarded back** (P2, vocab `halfWall`, `boardBay`). Floor `spruce_planks` y=0 x=23..35,z=8..20; west half wall y=1..2
  at z=9..11,13..15,17..19; south back boards y=1..5 between posts with 3x3 doorway x=28..30 (lintel `stripped_spruce_wood` axis x y=4).
- [ ] **15. Mill gable, loft door, sign, monitor** (P3 roof + monitor + gable planks, P4 loft door and sign; vocab `wallSign`): `spruce_wall_sign`
  "SAWMILL" at (29,6,7) facing north; loft door cells (29,8..9,8) left air with open `spruce_trapdoor` beside.
- [ ] **16. Saw carriage with saw** (P2, vocab `sawCarriage`): `stripped_spruce_log` axis z rails x=28, x=30, z=9..19, y=1; `spruce_log` axis z at (29,1,9..11);
  `stonecutter` (29,1,14); the floor stays plank.
- [ ] **17. Boiler stack with tall plume** (P5, vocab `brickStack`). `bricks` x=36..37,z=17..18,y=1..18, `deepslate_bricks` band y=17 except (37,17,18) `hay_block`;
  y=18 lit `campfire` signal_fire true at (37,18,18) (lit true), other cells `bricks`; y=19 `brick_slab` ring x=35..38,z=16..19 outside the stack; (37,19,18) air.
- [ ] **18. Boiler firebox** (P5, vocab `boilerFirebox`): lit `blast_furnace` (36,1,17) facing west, lit `furnace` (36,1,18) facing west.
- [ ] **19. Saw-filing bench** (P5/P2, vocab `filingBench`): `grindstone` (34,1,18) face wall, `barrel` (33,1,17) facing up, `chest` (33,1,19) facing west.
- [ ] **20. Log deck** (P6, vocab `logDeck`): skids `stripped_spruce_log` axis z x=24,29,34, y=1, z=4..7; `spruce_log` axis x y=2 at z=4..7 x=25..33; y=3 at z=5..6 x=25..33;
  chocks `spruce_log` axis y at (24,2,4),(24,2,7),(34,2,4),(34,2,7).
- [ ] **21. Sawn lumber stacks** (P6, vocab `lumberStack`): three stacks as in plan, birch_planks / birch_slab (top) with stripped_spruce_wood stickers; slab tops on middle stack.
- [ ] **22. Stumps and chopping block** (P6, vocab `stump`): `spruce_log` axis y on `podzol` at the plan's cells; block (14,1,23) a `spruce_log` stump 1 high, with a `stripped_spruce_log` axis y at (14,2,23) as its worn top.
- [ ] **23. Spruces at the edges** (P6, vocab `spruceTree`): trunk y=1..7, persistent `spruce_leaves` cones.
- [ ] **24. Rutted logging road and skid road** (P6, vocab `ruts`, `groundPatch`): coarse_dirt road, dirt_path ruts z=1,2, gravel ~15%, skid road x=28..30.
- [ ] **25. Paths and yard lanes** (P6, vocab `pathRun`): dirt_path per the SITE table.
- [ ] **26. Camp lighting** (P4/P6, vocab `hangLantern`, `lampPost`): mill lanterns (25,5,8),(33,5,8) hanging true under the plate; `lampPost` (fence + lantern) at (13,1,2) by the road and (28,1,22) at the yard lane.
