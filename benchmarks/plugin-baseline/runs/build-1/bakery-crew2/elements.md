# Required elements: Germanic bakery (Bäckerei)

Part modules: P1 `parts/shell.mjs`, P2 `parts/roofs.mjs`, P3 `parts/oven.mjs`, P4 `parts/facade.mjs`, P5 `parts/yard.mjs`, P6 `parts/sides.mjs`.
Vocabulary names are defined in plan.md under VOCABULARY. Coordinates are from the architect's plan.md. Stair `facing` = the side of the full-height back (toolkit convention).

## From the brief

- [ ] **Spruce + deepslate palette only (overworld, forest-local)** — ground storey and wing in `deepslate_bricks` / `polished_deepslate` / `cobbled_deepslate`; every timber in spruce; infill `white_wool`; oven in `bricks`. No exotic blocks. P1, P2, P3. Vocab: all.
- [ ] **Stripped spruce structure** — posts `stripped_spruce_log` axis y; beams, sills, plates, rails, lintels `stripped_spruce_wood` axis along the beam; hoist beam `stripped_spruce_log` axis z. Front: posts x=6,8,11,14,16 y=7..10 z=8; sill y=6 x=6..16 z=8; rail y=7; head plate y=10; lintel y=5 z=9. Sides z-axis equivalents. P1 builds all; P4/P6 add braces. Vocab: `postRun`, `beamRun`, `daubPanel`.
- [x] **Brick bread oven** — x=17..21, z=23..26. Plinth y=1 `cobbled_deepslate`; body y=2..3 `bricks` around the air chamber x=18..20 z=23..25 (y=2..3); mouth (19,2..3,22) left open; z=26 closed with bricks y=1..4 (y=1 is plinth). Barrel vault: y=4 `brick_stairs` at x=17 (facing west) and x=21 (facing east), `bricks` x=18..20; y=5 `brick_slab` (bottom) x=18..20 except chimney cells. Inside: `campfire` lit (19,2,24) on the chamber floor, `smoker` (18,2,21) beside the mouth in the wing. The mouth is flanked by the wing's own south wall (P1, `cobbled_deepslate`, z=22), so P3 writes nothing at z=22. P3. Vocab: `ovenVault`.
- [x] **Chimney** — 2x2 `bricks` x=19..20 z=24..25 y=4..17 (y=4..5 are vault cells), a `deepslate_bricks` band course at y=12, top ring y=17: `brick_slab` (top) at (20,17,24),(19,17,25),(20,17,25) and lit `campfire` at (19,17,24) (smoke). Hollow flue: air at (19,5..16,24) so the fire at (19,2,24) draws through (cell (19,4,24) is also air; (19,3,24) is chamber air). P3. Vocab: `chimneyStack`.

## What a viewer expects

- [x] **Front door, shop front** — `spruce_door` facing north at (11,2..3,9), `glass_pane` transom (11,4,9), posts (10 and 12, y=2..4) `stripped_spruce_log`, stone front step (11,1,8) `cobbled_deepslate_stairs`, slabs (10,1,8),(12,1,8). P1 leaves cells open; P4 fills. Vocab: `shopWindow`, `frontStep`.
- [x] **Shop windows with counters and shutters** — 3x2 `glass_pane` at (7..9,3..4,9) and (13..15,3..4,9); `deepslate_bricks` breast (7..9,2,9),(13..15,2,9); counter `spruce_slab` (top) (7..9,2,8),(13..15,2,8); shutters `spruce_trapdoor` open flat on z=8 at (6,3..4,8),(16,3..4,8). P4. Vocab: `shopWindow`, `counterSlab`, `shutterPair`.
- [x] **Jettied half-timber upper storey** — projects to z=8; `spruce_stairs` upside-down brackets (back against the wall, facing south) at x=6,8,11,14,16, y=5, z=8; white_wool daub panels with spruce_stairs "Mann" braces at (7,8,8),(15,8,8); windows 2x2 `glass_pane`. P1 (frame + infill), P4 (brackets, braces, glazing). Vocab: `daubPanel`, `mannBrace`, `jettyBracket`, `glazedWindow`.
- [x] **Flower boxes** — `spruce_slab` (top) (9..10,7,7),(12..13,7,7) with `potted_red_tulip`/`potted_poppy` alternating at (9,8,7),(10,8,7),(12,8,7),(13,8,7). P4. Vocab: `flowerBox`.
- [x] **Steep slate roof, timbered gables, verges** — `mcd roof --spec` preset shop/slate, ridge (11,21,7..23); gable timbers kept; wing roof stairs style gable. P2 (roof tool), P1 (gable frame: collar beam y=14 x=8..14, king posts). Vocab: `roofMain`, `roofWing`, `gableFrame`.
- [x] **Flour-loft hoist beam with chain and barrel** — `stripped_spruce_log` axis z (11,19,5..8), `iron_chain` axis y at (11,18,5),(11,17,5), `barrel` (facing up) at (11,16,5); loft door (11,15..16,8) air, `spruce_trapdoor` open shutters at (10,15..16,7),(12,15..16,7). P4. Vocab: `hoistAssembly`.
- [x] **Bakery sign** — `spruce_fence` (16,7,7),(16,7,6), `spruce_hanging_sign` at (16,6,6) text "Bäckerei", `lantern` hanging (16,6,7). P4. Vocab: `signArm`.
- [ ] **Lanterns** — hanging under the jetty at (9,5,8),(13,5,8); `lantern` hanging=true; by the wing door and back door (P6); chimney not lit. Vocab: `hangingLantern`.
- [x] **Bakehouse wing** — `cobbled_deepslate` walls x=17..21 z=13..22 y=1..5, corner post (21,1..5,13), window (19,3..4,13), vent trapdoor (19,7,13), side door (21,2..3,17), windows (21,3..4,15),(21,3..4,20), shutters (18,3..4,12),(20,3..4,12). P1 shell, P6 fill. Vocab: `glazedWindow`, `shutterPair`.
- [x] **Smoke** — lit campfires (19,17,24) and (19,2,24); `smoker` (18,2,21). P3.
- [x] **Woodpile (oven fuel)** — `spruce_log` axis x, stacked x=7..10 z=24..25 y=1..2, `spruce_slab` lid y=3. P5. Vocab: `woodpile`.
- [x] **Yard: fence, gates, bench, wheat patch, props, trees, paths** — see plan. P5. Vocab: `yardFence`, `benchRun`, `wheatPatch`, `smallSpruce`, `propCluster`.
- [ ] **Street + sidewalk** — gravel lane z=0..2, kerb `cobbled_deepslate` z=3, `cobblestone` + 15% `mossy_cobblestone` z=4..7. P1/P5. Vocab: `scatterBlend`.
- [ ] **Interior: shop counter with bread displays, bakery proofing room, bakehouse with kneading trough, living room, bedroom, flour loft** — by the room designers; baked goods shown as `cake` and `candle_cake`, `barrel` flour stores, `hay_block` sacks; ovens `smoker`, `campfire`. Rooms list in plan.md.
