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
- [x] **White-framed street windows** — 3-wide shop windows y19..23 and 2-wide upper windows y28..32 on x55/52/49 planes; `smooth_quartz` frames, `quartz_slab` sills, `smooth_quartz` heads with `smooth_sandstone` keystone. P4 (`litWindow`, `windowFrame`).
- [x] **Red/white and green/white striped awnings** over street-storey windows at y24, edge band, two courses stepping out. P4 (`stripedAwning`).
- [x] **Name block "ECONOMY MARKET"** on E2 x55 panel z1..10 y36..41, banner letters red on cream, two lines (ECONOMY y39..40, MARKET y36..37), letters one cell proud at x56. P4 (`bannerWord`/`plaque`).
- [x] **E2 tall arched window** x55 z4..7 y28..34 with sandstone arch. P4 (`archOpening`).
- [ ] **West bluff face** — `stone_bricks` base to y9, 4 window rows y4..7 (`iron_bars` over glass), 11..15, 19..24, 28..32; E4 annex arched windows y3..7 and y10..14; planted roof terrace. P1 shell openings, P4 glazing.
- [ ] **Lit stalls behind the street windows** (x50..52, z3..29, y18..24) and the atrium: counters, produce, lanterns. P6 (`stallFit`, `produceCrate`).

## Corner Market (plot 1)
- [x] **Three storeys red-brown brick**, floors C1 y7 / C2 y5 / C3-C4 y3, 2nd y16, 3rd y24, roof y32. P2 (`brickWall`).
- [x] **Big round arches, ground storey** — 6 wide, between 2-wide brick piers every 8, springing floor+5, crown y15 level along the face; `brick_stairs` upside down, `smooth_sandstone` keystone and imposts; west face (z32..37 … 80..93) and south face (x68..73, 76..81, 88..93, 96..101). P4 (`archOpening`, `pier`).
- [ ] **Open produce stalls under canvas awnings** — recessed to edge+3; red/white and green/white wool-stripe awning in each arch mouth at floor+5; barrels, melon, pumpkin, hay_block crates; lanterns hung from the arch crown. P4 (`stripedAwning`), P6 (`stallFit`, `produceCrate`, `hangingLantern`).
- [x] **Tall windows in white frames** — 2 wide ×5 high at y18..22 and y26..30, pairs every 4, `brick_stairs` flat arches, `quartz_slab` sills; string courses y16 and y24 `smooth_sandstone`. P4 (`windowFrame`, `litWindow`).
- [x] **Cornice and parapet** — y30..31 upside-down `smooth_sandstone_stairs` +1 proud, `brick` dentils every other block; parapet y33..34, `smooth_sandstone_slab` coping. P2 (`cornice`, `parapetCap`).
- [x] **"CORNER MARKET" raised sign panel** on C2 west x72, y33..36, cream banner letters on red. P4 (`bannerWord`).
- [x] **Roof chimney stacks (2)** `bricks` 2×2 at x80..81 z40..41 and x98..99 z86..87, y33..38, `deepslate_bricks` band y36, slab cap 37..38; **stair house** x92..97 z60..65 y33..37, brick, `stone_brick_slab` lid, one door opening. P2 (`chimneyStack`, `stairHouse`; solid masonry stacks, no fire needed).
- [x] **Quoins** `smooth_sandstone` at corners, alternating 2/1. P2 (`quoins`).

## Sanitary Market (plot 2)
- [x] **Long cream stucco block, stepped west curve** — `smooth_sandstone` body, `cut_sandstone` bands, steps x128→132→136→144→152→156. P3.
- [ ] **Open-fronted shops with piers** — `smooth_sandstone` 2-wide piers every 8 with `cut_sandstone` caps y10; shops recessed to edge+3, floor y1 (S5 y2, S6 y3) to y9. P3 (`sanitaryPier`), P5, P6.
- [x] **Striped awnings** red/white, green/white alternating, y9 at edge+2, y8 at edge. P5 (`stripedAwning`).
- [x] **Painted shop signs** on each fascia y11: `spruce_wall_sign`/banner boards. P5 (`signboard`).
- [x] **"SANITARY PUBLIC MARKET" lettering** green banner letters, 22 columns, z100..123, edge band x128, over the entrance. P5 (`bannerWord`).
- [ ] **Entrance** x129 z109..114 y2..9 framed in `smooth_quartz`; sign parapet S7 x129..130 z104..119 to y30 with second "SANITARY" at y26..27 z108..115. P3 shell + P5.
- [ ] **Small upper windows** 2×3 at y16..18, white quartz frames, 2 per bay. P5 (`litWindow`).
- [ ] **Flat roof, cornice y22, parapet y24..25 quartz coping; rooftop vents** 2×2 `light_gray_concrete` every ~20 z. P3 (`cornice`, `parapetCap`, `rooftopVent`).
- [ ] **Lit stalls** (barrels, produce, lanterns) in every bay. P6.

## Garden Center Building (plot 3)
- [x] **Small two-storey brick building**, ground y1, upper y8, roof y15. P3.
- [x] **Two west shopfronts** z4..13 and z16..25 recessed to x214: `glass_pane` y2..5 over `spruce_planks` base y1, doors z8..9 and z20..21 (`spruce_door`, both halves), green/white awning x211..212 y6, fascia sign y7. P5 (`shopFront`, `stripedAwning`).
- [ ] **Upper windows** x212 z6..7, 13..14, 20..21 y9..12, white frames. P5.
- [ ] **"GARDEN CENTER" panel** x212 z9..20 y15..17, green banner letters on cream `smooth_sandstone`. P5 (`bannerWord`).
- [x] **Fire escape on Post Alley (north) face** x211..222 z0..1: `polished_blackstone_slab` (top) landings y8 and y14, `iron_bars` rails, diagonal `polished_blackstone_stairs` flight between, drop ladder (`ladder`) to y3. P5 (`fireEscape`).
- [ ] **Post Alley door** x230..231 z2 y3..4 and windows x214..215, 219..220 y9..12. P3 openings, P5.
- [x] **Rooftop and window-box plants** `potted_fern`, `oak_leaves` (persistent) clumps along the parapet. P6 (`gardenPot`).

## Dusk extras (expected by a viewer)
- [x] **Street lamps** along Pike Place: `lampPost` (`spruce_fence` ×4 + `lantern`) every 10 z along the x edge bands, on the ground cell. P6.
- [ ] **Bracket lanterns** at every pier head (`lanternBracket`). P6.
- [ ] **Hanging blade signs** over Sanitary and Garden shops (`signboard` hanging). P5.
