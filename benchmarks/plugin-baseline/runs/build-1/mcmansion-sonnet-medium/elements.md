# Required elements: McMansion (front NORTH -z, street at z<0, x runs along the street)

Parts: P1 main shell, P2 garage shell, P3 roofs+chimney, P4 facade, P5 front site, P6 back deck+yard. Vocab names are helpers in plan.md "VOCABULARY".
Walking surface = y=1 (floor blocks at y=0). All ranges inclusive. Ids checked with `mcd blocks --check` (note `iron_chain`, not `chain`).

| # | Element | REAL construction (block by block) | Coordinates | Part | Vocab |
|---|---|---|---|---|---|
| 1 | Tall front gable over entry | cross-gable `$MCD roof` (style gable, pitch 1.0, rise 5), ridge along z, dark-slate palette, gable face z=7 filled with `birch_planks`, quartz raking trim (verge `quartz_slab`/`quartz_stairs`), round vent 2x2 `glass_pane` framed by `quartz_block` | rect x22..31 z7..18, y10..14 | P3 | roofSpec |
| 2 | Hipped wings | hip roofs, dark-slate: main hip rect [18,11,35,25] (ridge y=13), east wing hip [35,12,42,24] (ridge y=12), garage hip [1,7,17,24] (ridge y=12) | see plan SITE | P3 | roofSpec |
| 3 | Turret-ish bay | 5x5 chamfered block (corners (38,8),(42,8) cut) walls y1..9, windows, cone `tower-cap` roof, `lightning_rod` finial at y=14 | x38..42 z8..12 | P1 + P3 | turretWalls, roofSpec |
| 4 | Dormers (5) | `mcd roof --dormers`: gabled dormer = 3x3 `birch_planks` cheeks, `glass_pane` front, dark-slate roof, quartz trim. Garage north slope x=4 and x=13; wing north slope x=39; main south slope x=21 and x=31 | on roof slopes | P3 | roofSpec |
| 5 | Dark asphalt shingle roofs | palette `dark-slate` (deepslate_tiles / cobbled_deepslate / blackstone mix) with stairs and slabs; ridge `deepslate_tile_slab` | all roofs | P3 | roofSpec |
| 6 | Double-height entry | foyer air y1..8 (no floor slab at y=5 over x24..29 z12..16); entry opening x25..28 y1..4 at z=11; 2nd-storey arched window x25..28 y6..8 over it | x24..29 | P1 (void, openings), P4 (glazing) | entryDoor, archWindow |
| 7 | Two-storey portico + columns | 4 columns at x=23,25,28,30 (z=7), each: `quartz_slab` bottom at y=1 as base, `quartz_pillar` axis=y y2..7, capital `chiseled_quartz_block` y=8; entablature `quartz_block` row y=9 across x22..31 z=7, ceiling `birch_planks` y=9 over x23..30 z=8..10, portico floor `stone_bricks` y=0 x22..31 z=7..10, landing `stone_brick_slab` at z=6 | x22..31 z7..10 | P4 | column, portico |
| 8 | Fanlight window over the door | opening x25..28 y1..4: door leaves y1..2 (x26,27 `dark_oak_door`, see entryDoor), sidelights `glass_pane` x25,x28 y1..3, transom row y3 x26,27 `glass_pane`, fan: y4 x26,27 `glass_pane`; arch voussoirs `quartz_stairs` upside-down at (25,4),(28,4) facing inward (east at x25, west at x28) | z=11 | P4 | entryDoor |
| 9 | Stone veneer on lower front | wallBlock mix `andesite` 40 / `stone` 30 / `cobblestone` 20 / `stone_bricks` 10 per-cell hash, y1..4 on every north-facing wall + turret + 3 cells around corners; plinth row y=0 `stone_bricks` | z=7, z=11, z=12, turret | P1 + P2 | wallBlock |
| 10 | Beige siding elsewhere | `birch_planks` walls, belt course row y=5 `smooth_quartz` all around | all walls | P1 + P2 | wallBlock |
| 11 | White trim and quoins | quoin columns at every outer corner: `quartz_block` at corner cell y1..9, next cell along the face alternates `quartz_block` (y even) / siding (y odd); sills, lintels, column set, raking trim = `quartz_slab/stairs` | corners listed in plan | P1/P2 (quoins), P4 (sills, lintels) | quoins, archWindow |
| 12 | Three-car garage wing | 17x18 block x1..17 z7..24, walls y1..9, ground inner x2..16 z8..17 air y1..4, 3 openings 4 wide x 3 high | x1..17 z7..24 | P2 | garageWing |
| 13 | Carriage-style garage doors | per bay x0..x0+3: y1..2 `white_concrete` panel; `dark_oak_trapdoor` open facing north on the outside plane z=6 at (x0+1,y1),(x0+1,y2),(x0+2,y1),(x0+2,y2) as bracing; y3 row: x0 and x0+3 `white_concrete`, x0+1,x0+2 `glass_pane`; `quartz_slab` hood at y=4; bays x0 = 3, 8, 13 | z=7 | P4 | carriageDoor |
| 14 | Tall arched windows | every window = `archWindow`: glass_pane fill, `quartz_stairs` upside-down arch caps at top corners, `quartz_slab` sill, exact list in plan OPENINGS | plan OPENINGS | P4 | archWindow |
| 15 | Black shutters | flush shutter strips: wall cells at x0-1 and x1+1 over the window height = `black_concrete` (built by the shell's wallBlock), on windows flagged `sh` in plan OPENINGS | beside every window | P1/P2 | shutterCells |
| 16 | Big chimney | stone chimney 3x2 with shoulders: `stone_bricks` shaft y1..14 at x39..41 z25..26, `andesite` accent courses, cap `stone_brick_slab` ring + 2 pots (`stone_brick_wall`) at y14 | x39..41 z25..26 y1..14 | P3 | chimney |
| 17 | Wide driveway | `light_gray_concrete` x2..17 z2..6 (16 wide), `stone` expansion joint rows at z=4 and column x=9; apron into street | x2..17 z1..6 | P5 | driveway |
| 18 | Manicured lawn | `grass_block` y=0 over the whole site; `short_grass` y=1 sparse 1-in-12 NOT on walks; clipped edge with `stone_brick_slab` strips along path | x18..43 z3..6, x36..43 z3..7 | P5/P6 | lawn |
| 19 | Foundation shrubs | rounded bush = 3 wide x 1 deep x 2 high `azalea_leaves` (persistent=true) on a `coarse_dirt` mulch strip, every third with a `flowering_azalea_leaves` crown: along the main front at z=10 (x19..22 and x31..37) and at (37,1,8) by the turret | z=10, y1..2 | P5 | shrub |
| 20 | Young tree | `oak_log` axis y trunk (36,1..4,5), crown `oak_leaves` persistent radius 2 y4..7 (corners trimmed), 1 `oak_fence` stake support at (35,1,5) | (36,1..7,5) | P5 | youngTree |
| 21 | Back deck | `spruce_planks` y1 x19..34 z26..31, posts `spruce_log` y0..2 at corners, railing `spruce_fence` y2 (gap at the side steps), `spruce_stairs` facing south at (26..27,1,26) from the back door, side steps facing west at (35,1,28..29) | x19..34 z26..31 | P6 | deck |
| 22 | Double-height foyer with sweeping staircase | foyer air x24..29 y1..8 z12..16; stair x24..25 z12..16 steps (x, y=1+k, z=12+k) `oak_stairs` facing south, underside fill `oak_planks`; gallery slab z17..24 at y=5; banister later by interior designer | x24..29 | P1 (stairs), room designer (banister) | stairFlight |
| 23 | Chandelier | interior designer: `iron_chain` x3 from ceiling y=9 down to y=7 over (27,*,14), `lantern` x4 ring | foyer | room designer | n/a |
| 24 | Open-plan kitchen, island, family room, fireplace, big TV | kitchen [19..34,18..24], cased opening (35,1..3,19..22) to family room [36..41,13..23]; firebox on z=24 wall at x39..41 backed by the chimney | rooms | room designers | n/a |
| 25 | Formal dining room | [31..34,12..16] | rooms | room designers | n/a |
| 26 | Home office | [19..22,12..16] | rooms | room designers | n/a |
| 27 | Mudroom off garage | [2..16,19..23], door (15,1..2,18) | rooms | room designers | n/a |
| 28 | Primary suite, walk-in closet, bath | bedroom [36..41,13..19]+nook, bath [36..41,21..23], closet [31..34,21..24] | rooms | room designers | n/a |
| 29 | 3 more bedrooms | BR2 [19..22,12..16], BR3 [31..34,12..16], BR4 [19..22,21..24] | rooms | room designers | n/a |
| 30 | Bonus room over garage | [2..16,6..8,8..23] | rooms | room designer | n/a |
| 31 | Expected: front walk + lamps | `stone_bricks` walk x26..27 z3..6, 2 lamp posts (`blackstone_wall` y1..3 + `lantern` y4) at (24,*,4) and (29,*,4) | z3..6 | P5 | lampPost |
| 32 | Expected: mailbox | `dark_oak_fence` (21,1,3), `iron_trapdoor` closed top-half (21,2,3), `black_concrete` back | (21,1..2,3) | P5 | mailbox |
| 33 | Expected: street, curb, sidewalk | z0 `gray_concrete`, z1 `polished_andesite`, z2 `smooth_stone` x0..43 | z0..2 | P5 | street |
| 34 | Expected: carriage lamps at garage | `blackstone_wall` y1..3 + `lantern` y4 at (7,*,6),(12,*,6) | piers | P4 | lampPost |
| 35 | Expected: deck grill, AC unit | grill = `cauldron` (31,2,28) + `iron_trapdoor` closed top-half (31,3,28); AC unit = `iron_bars` (36..37,1..2,26) | P6 | P6 | deck |
| 36 | Dormer north of gable | main north slope west of the entry gable at x=20 | roof | P3 | roofSpec |
