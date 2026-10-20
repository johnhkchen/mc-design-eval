# Sun Yat-sen Memorial Hall: architect's plan (form)

Plot-local coordinates: x 0..152, z 0..158, y 0..50. North = low z, south = high z (MAIN FRONT, faces SOUTH toward the camera side), east = high x.
Symmetric about x = 75.5 (mirror x ↔ 151 − x). One colonnade module = 9 blocks.

## SITE

- Ground is flat. **y 0 = the ground course** (grass / paving laid AT y 0; people stand on y 1). Nothing below y 0, nothing above y 50.
- Buildable rectangle: x 4..147, z 4..147. Extra footprint bits: south apron x 52..99 z 148..155 and x 56..95 z 156..158 (the steps); lawn scraps x 4..7 z 0..3 and x 0..7 z 144..151 (ground and planting only).
- No street on the plot: the hall stands in its park. The approach is from the SOUTH (Taipei 101 side) up broad steps on the axis x 56..95.

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| Park ground (lawn, hedges, paving) | 4..147 (+ scraps above) | 0 | 4..147 | outside the podium only |
| Podium (stone plinth) | 8..143 | 0..2 | 8..143 | deck surface = top of y 2; stand on y 3 |
| Colonnade, 14 columns a side | centres 17,26,35,44,53,62,71,80,89,98,107,116,125,134 | 3..19 | same centres on z | each 3x3 (centre ±1); the four corner columns are shared by two sides (14 per side, 52 total) |
| Hall body (red walls) | wall planes x 21 and x 130 | 3..21 | wall planes z 21 and z 130 | 1 thick; closed box x 21..130, z 21..130 |
| Gallery (open walk between columns and wall) | 19..20 / 131..132 | 3..19 | 19..20 / 131..132 | open air under the eave |
| Eave beam ring (over the columns) | 16..135 ring, 3 deep (16..18 / 133..135) | 22..23 | same on z | carries the roof |
| Main roof (yellow, concave hip) | 10..141 | 24..41 | 10..141 | see ROOFS |
| South entrance portal (raised eave) | 49..102 | 3..47 | 120..143 | see below |
|  ├ portal fins (upswept ridges) | 49..51 and 100..102 | 24..45, tips to 47 | 124..141, flick out to 143 | 3 thick |
|  ├ portal lintel / cornice box | 49..102 | 37..40 | 130..141 | deck on top y 41, parapet y 42 |
|  ├ portal columns (tall) | centres 53,62,71,80,89,98 on z 134 | 3..36 | 133..135 | replace the short columns there |
|  ├ mid beam with plaque | 52..99 | 30..31 | 131..132 | |
|  └ lobby glass wall (recessed) | 55..96 | 3..36 | 130 | lobby behind x 55..96, z 122..129 |
| South steps | 56..95 | 1..2 | 144..157 | slab ramp, see OPENINGS |
| Step cheek walls | 52..55 and 96..99 | 1..2 | 144..155 | stone, lamp posts on them |

## ROOFS

One great hand-built roof (no preset fits: the concave sweep and the raised south eave are the identity; the nearest preset `teahouse` is the wrong scale and shape). A part builds it from this profile.

**Main roof: concave hip over x 10..141, z 10..141.** Let d = distance in from the nearest outer eave edge (d = min(x−10, 141−x, z−10, 141−z)). The surface block of each cell sits at:

| d | surface y | slope |
|---|---|---|
| 0–2 | 24 | eave, nearly flat |
| 3–5 | 25 | 1 in 3 |
| 6–8 | 26 | |
| 9–11 | 27 | |
| 12–13 | 28 | 1 in 2 |
| 14–15 | 29 | |
| 16–17 | 30 | |
| 18–19 | 31 | |
| 20–21 | 32 | |
| 22..29 | 33..40 (y = d + 11) | 1 in 1, steep crown |
| ≥30 | 41 | flat top deck x 40..111, z 40..111 |

- The roof is a closed shell: each cell filled from its surface y down to one below the previous ring's surface (no holes on the risers). Underside (soffit) visible from d 0..5 at y 23..24: smooth stone.
- **Eave fascia:** the d = 0 ring is smooth_stone (the gray concrete edge in the photo), 1 course, y 24.
- **Hip ridges:** on the four diagonals (cells where the x- and z-distances are equal) a smooth_stone ridge one block above the surface, from the corner tip to the flat top.
- **Corner upsweep:** within 10 cells of each corner, the eave edge lifts +0,0,1,1,1,2,2,3,3,4 toward the corner (corner eave at y 28); the hip ridge ends in a curled tip of smooth_stone stairs rising to y 31 at the outer corner cell (10,10 etc.), gold_block on the very tip.
- **Top deck (y 41):** yellow tile like the slopes; a smooth_stone rim one course up (y 42) on its edge ring (d = 30), gold_block at its four corners.
- **South raised eave:** between the fins (x 52..99) the south slope is cut away from z 120 to z 141: there the roof is replaced by the portal (lintel box y 37..40, deck y 41 flush with the top deck, parapet y 42). The yellow slopes on either side die into the fins.
- **Fins:** each fin is the turned-up end of the roof: its top line follows the neighbouring roof surface from the eave (y 24 at z 141) up the slope, then rises above it to y 45 at z 126..141, with the front flick stepping out to z 143 at y 46..47 (smooth_stone stairs curling forward), gold_block tip at y 47. Inner faces of the fins are flat gray.
- Roof light: ochre_froglight tiles set INTO the yellow surface on a grid every 8 cells (both axes, offset 4), plus a froglight at every ridge foot: lights the roof (no spawns) and makes the roof glow warm at dusk.
- Maximum height: fin tips y 47 (≤ 50).

## FACADES

All four sides share base / colonnade / eave / roof. SOUTH is the hero face, EAST next, then north and west.

| Layer | y | Content | Depth |
|---|---|---|---|
| Podium | 0..2 | polished_andesite body, stone_bricks bottom course y 0, smooth_stone_slab coping lip at y 2 on the outer ring | podium face at x/z 8 and 143 |
| Colonnade | 3..19 | quartz_pillar shafts 3x3 on the 9-block rhythm; base: polished_andesite 3x3 at y 3; capital: smooth_stone 3x3 at y 19 | columns stand free, 2-block gallery behind |
| Red walls | 3..19 | red_terracotta panels on the wall plane (21 / 130) | recessed 4 behind the column centres |
| Wall pilasters | 3..19 | smooth_stone strips 1 wide on the wall's outer face in line with each column centre (x 20 / 131 or z 20 / 131) | +1 proud of the red |
| Red-brown band | 20..21 | polished_granite frieze on the wall plane, full ring | flush with wall |
| Eave beam | 22..23 | smooth_stone ring over the columns, with smooth_stone_slab (top) brackets at y 21 under it, one each side of every column | beam flush with column faces |
| Roof | 24..47 | yellow concave hip, gray ridges, corner flicks | eave overhang 6 beyond the column faces |

**South portal (x 49..102):** two gray fins frame it; six tall quartz_pillar columns (3x3, y 3..36) stand on the z 134 line; behind them the lobby glass wall (z 130) runs y 3..36 with polished_deepslate mullions every 3 blocks (x 55,58,..,96) and transoms every 6 rows (y 9,15,21,27,33); a smooth_stone mid beam y 30..31 (z 131..132, x 52..99) carries the name board; the lintel box y 37..40 is smooth_stone with a dentil row (smooth_stone_slab top, every 2nd cell) at y 36 along z 141. Name board: black_concrete x 64..87, y 32..35 on the beam's south face (z 133), gold_block frame; text "SUN YAT-SEN" in gold banner letters.

**East / west / north faces:** colonnade + red walls, one lit glass door bay centred (between columns 71 and 80).

## MATERIALS

| Role | Block |
|---|---|
| Roof tile (60%) | yellow_concrete |
| Roof tile courses (every 3rd ring of the slope, texture) | yellow_terracotta |
| Roof lights in the tiles | ochre_froglight |
| Ridges, fascia, fins, portal, beams, capitals | smooth_stone (stairs: smooth_stone has none, use stone_stairs for curls; slabs smooth_stone_slab) |
| Gold trim (tips, board frame, top-deck corners) | gold_block |
| Columns | quartz_pillar (axis y) |
| Column bases, podium body, plaza paving | polished_andesite |
| Podium bottom course, step cheeks | stone_bricks |
| Coping, steps | smooth_stone_slab, polished_andesite_slab |
| Walls | red_terracotta |
| Band under the eave | polished_granite |
| Glass | glass_pane (lobby, doors) |
| Mullions | polished_deepslate |
| Name board | black_concrete |
| Lobby floor | smooth_quartz |
| Ground | grass_block; hedges azalea_leaves + flowering_azalea_leaves (persistent); cone topiary spruce_leaves (persistent) |
| Lights | lantern (hanging, on chain: the 1.21.1 id is `chain`, NOT iron_chain), shroomlight (floodlight wells) |

All checked with `$MCD blocks --check` (chain is reported unknown by the toolkit's newer table but is the correct 1.21.1 id; never use iron_chain).

## OPENINGS

| Opening | Coordinates | Notes |
|---|---|---|
| South lobby glass wall | x 55..96, y 3..36, z 130 | glazed; mullion grid as above |
| South main doors (in the glass) | four pairs at x 60..63, 66..69, 82..85, 88..91, y 3..6, z 130 | glass panes left as door openings (air y 3..5), the rest glazed |
| East door bay | x 130, z 73..78, y 3..9 | glass_pane, lit vestibule behind |
| West door bay | x 21, z 73..78, y 3..9 | same |
| North door bay | z 21, x 73..78, y 3..9 | same |
| South steps (accessible) | x 56..95: z 157 bottom slab y 1; z 156 full y 1; z 155 full y 1 + bottom slab y 2; landing z 153..154 (full y 1 + slab y 2); z 152 full y 2 (= deck level); z 144..151 full y 1..2 deck | half steps only, 3 then a 2-long landing, 40 wide |

No other openings: the red walls are solid.

## RESERVED

| Cells | For |
|---|---|
| Column cells 3x3 at every centre, y 3..19 (portal ones y 3..36) | columns (podium deck under them stays) |
| x 20 / 131 and z 20 / 131 in line with each column centre, y 3..19 | wall pilasters |
| Lobby x 55..96, z 122..129, y 3..36 | lit lobby: smooth_quartz floor, 3 chandeliers (lanterns on chain) at x 66, 75..76, 85, z 125, y 26..30 |
| Floodlight wells: podium deck at y 2, 1 cell outboard of every column on all sides | shroomlight flush in the deck (warm uplight on the columns) |
| Gallery lanterns: under the eave beam, between columns, y 20..21 | hanging lanterns on chain |
| Lamp posts: step cheeks x 53, 98 at z 145, 150, 155; podium corners | polished_andesite wall post + lantern |
| Hedge band z 144..147, x 4..51 and 100..147; east/west/north lawn strips x 4..7, x 144..147, z 4..7 | planting, cone topiary every 18 (between column bays), optional red banner flagpoles (iron_bars 6 high) in the south hedge |

## FLOORS

| Level | y | Volume |
|---|---|---|
| Ground (park) | stand on y 1 | outside the podium |
| Podium deck / gallery / lobby floor | stand on y 3 | gallery ring between columns and walls; lobby x 55..96 z 122..129 |
| Hall interior (not built; closed box) | 3..23 | x 22..129, z 22..129: leave empty or filled, unseen |
| Portal soffit | underside y 37 | z 130..141 |
| Roof top deck | stand on y 42 | x 40..111, z 40..111 |

---
# DESIGNER'S SECTIONS

## PALETTE (architect's ids kept exactly; 1.21.1 only)

| Role | Block and variants |
|---|---|
| Roof tile | yellow_concrete (60%), yellow_terracotta (every 3rd ring), ochre_froglight lights |
| Stone trim, ridges, fascia, fins, beams, capitals | smooth_stone, smooth_stone_slab, stone_stairs (curls; smooth_stone has no stairs), stone_brick_stairs |
| Gold | gold_block |
| Columns | quartz_pillar (axis y), smooth_quartz (lobby floor), quartz_slab, quartz_stairs |
| Podium, bases, paving | polished_andesite, polished_andesite_slab, polished_andesite_stairs; stone_bricks, stone_brick_wall (cheek copings) |
| Wall posts | andesite_wall (no polished_andesite_wall in 1.21.1) |
| Walls and band | red_terracotta; polished_granite, polished_granite_slab |
| Glass | glass_pane (connections set), polished_deepslate mullions |
| Board | black_concrete, gold_block frame, banners (gold letters) |
| Greenery | grass_block, dirt_path, coarse_dirt, azalea_leaves, flowering_azalea_leaves, spruce_leaves (all persistent: "true") |
| Flags | iron_bars, red_banner |
| Lights | lantern (hanging true on `chain` axis y, never iron_chain), shroomlight, ochre_froglight, sea_lantern (vestibule backing, hidden) |

## VOCABULARY (helpers; coordinates local, y 0 = ground course)

- `podium()`: fill x 8..143, z 8..143: y 0 stone_bricks, y 1 polished_andesite, y 2 polished_andesite deck; outer ring at y 2 smooth_stone_slab type top.
- `step_ramp()`: exactly the architect's OPENINGS step table, x 56..95; slabs `type: bottom`, fulls below.
- `cheek_wall(x0,x1)`: stone_bricks y 1..2, z 144..155, coping stone_brick_wall nowhere above y 2 except lamp posts.
- `column(cx, cz, top=19)`: 3x3 quartz_pillar axis y y 4..top-1; y 3 polished_andesite base; y top smooth_stone capital 3x3. Tall: top = 36.
- `red_wall_run(side)`: red_terracotta plane at 21/130, y 3..19, pilaster smooth_stone 1 wide in line with each column centre on the outer face (x/z 20, 131) y 3..19; leave door bays air.
- `eave_bracket(cx,cz,side)`: smooth_stone_slab `type: top` at y 21 either side of the column centre on the beam ring.
- `roof_cell(x,z)`: surface y per the d-table; block yellow_terracotta if (d div 3) % 3 == 0 else yellow_concrete; fill down to prior ring's surface y minus 1; d 0 = smooth_stone fascia.
- `roof_shell()`: loops every cell of x 10..141, z 10..141 using roof_cell, skipping the portal cut-out x 52..99 z 120..141 (portal part owns it), applying corner lift.
- `hip_ridge(corner)`: along the diagonal, smooth_stone at surface+1 from the corner to d=30.
- `corner_flick(corner)`: stone_stairs facing outward-up rising from y 28 to y 31 over the last 4 diagonal cells; gold_block on the tip.
- `fin(x0)`: 3-thick smooth_stone wall x0..x0+2, z 124..141, top line = roof surface rising to y 45; front flick stone_stairs (facing south, half bottom) at z 142..143 y 46..47, gold_block at the very tip (z 143, y 47); shroomlight below the flick at y 44 flush in the inner face.
- `portal_lintel()`: smooth_stone box x 49..102 y 37..40 z 130..141, deck y 41 yellow_concrete, parapet smooth_stone y 42, dentil smooth_stone_slab top every 2nd cell y 36 along z 141; underside y 37 smooth_stone with sea_lantern none (lit by chandeliers/lanterns).
- `glass_wall()`: z 130, x 55..96, y 3..36: glass_pane filled, polished_deepslate mullion every 3 (x 55,58..96), transoms at y 9,15,21,27,33 (full row polished_deepslate), door pairs open as air.
- `door_bay(wall, centre)`: 6 wide x 7 high glass_pane in the red wall, behind it a 3-deep pocket floor smooth_quartz with a sea_lantern in the back wall at y 5 so it glows.
- `name_board()`: black_concrete x 64..87, y 32..35, z 133; gold_block frame ring; `plaque(g,"SUN YAT-SEN",{material:null,face:"south",letter:"yellow"})` (banner letters, gold/yellow on black).
- `chandelier(x,z)`: chain axis y from y 36 down to y 30 then lantern hanging true at y 29, plus four lanterns around a quartz_slab ring at y 27; at x 66, 75/76, 85, z 125.
- `flood_well(x,z)`: shroomlight at (x,2,z) in the podium deck, one cell outboard of each column.
- `gallery_lantern(x,z)`: chain y 21, lantern hanging true y 20, under the beam between each column pair.
- `roof_light(x,z)`: ochre_froglight replacing the surface block, grid x,z = 4 + 8k relative to roof origin 10; plus at each ridge foot.
- `lamp_post(x,y,z)`: andesite_wall 3 high, lantern on top (hanging false).
- `hedge_run(x0,x1,z)`: 2 wide, 2 high azalea_leaves with flowering_azalea_leaves flecks 1 in 4, persistent true.
- `topiary_cone(x,z)`: spruce_leaves cone, base 3x3 tapering to 1, 5 high on a spruce_fence-free coarse_dirt cell; persistent.
- `flagpole(x,z)`: iron_bars 6 high, red_banner hung at the top on the east face.

## ROOMS (inner air boxes; only walkable exteriors, hall interior not built)

Entered from the open deck. Lobby floor smooth_quartz at y 2/3 surface (its floor cell y 2 is smooth_quartz). Galleries: floor polished_andesite deck.

- Lobby: [56,3,122, 95,36,129]; ways in: the four open door pairs in the glass wall at z 130, x 60..63, 66..69, 82..85, 88..91, y 3..5. A tall quiet memorial lobby, warm chandeliers, a gold seated-statue plinth (smooth_quartz stairs and slabs, gold_block accent) at the back wall x 72..79, z 122..124; nothing blocks the doors.
- North gallery: [19,3,19, 132,19,20] open ring strip behind the north columns; ways in: open between columns anywhere on the z 16..18 line, plus the north door bay x 73..78 z 21.
- East gallery: [131,3,21, 132,19,130]; open between columns on x 133..135; east door bay x 130 z 73..78.
- West gallery: [19,3,21, 20,19,130]; open between columns; west door bay x 21 z 73..78.
- South-west gallery: [19,3,131, 48,19,132]; open between columns on z 133..135.
- South-east gallery: [103,3,131, 132,19,132]; same.

Galleries are lit by `gallery_lantern`; designers add benches and planters only along the red wall, never in the doorway cells, lane 1 wide always clear.

Stairs between floors: none (the roof deck is not for visitors). Main way in: street [75,1,158], steps (slab ramp) to entrance [67,3,131].

## PARTS (≤6, build order)

1. **P1 Podium, steps, colonnade, walls** (parts/shell.mjs): podium(), step_ramp(), cheek_wall(), column() x 52 (portal six at tall height later by P3), red_wall_run() x4 with door bay gaps, polished_granite band y 20..21, eave beam ring y 22..23 + eave_bracket(). Ticks podium, steps, columns, walls, band, beam.
2. **P2 Great roof** (parts/roof.mjs): roof_shell() with concave d-table, corner lift, hip_ridge(), corner_flick(), top deck and rim with gold corners. Skip portal cut-out. Use a direct generator loop (not the roof tool), simulate-free.
3. **P3 South portal** (parts/portal.mjs): fin() x2, six tall columns, portal_lintel(), mid beam y 30..31, junction where roof slopes die into the fins. Ticks portal, fins, tall columns.
4. **P4 Glazing and signs** (parts/facade.mjs): glass_wall(), door_bay() x3 (E/W/N), name_board() with banner lettering. Ticks lobby wall, doors, name board.
5. **P5 Lighting** (parts/lights.mjs): chandelier() x3, flood_well() at every column, gallery_lantern(), roof_light() grid and ridge feet, lamp_post() on cheeks and podium corners, fin-tip floodlights. Check no dark cell on deck, galleries, lobby and roof decks.
6. **P6 Grounds** (parts/grounds.mjs): lawn patches, hedge_run() z 144..147, topiary_cone() every 18, flagpole() x4, east/west/north strips, dirt_path edging; plot-edge only on `#` cells.

## Notes for workers

- Build in plot-local coordinates exactly as the architect's tables; nothing above y 50, nothing outside the `#` footprint, never below y 0 or buried.
- The roof is mostly seen from above/south-east: make tile courses visible (terracotta every 3rd ring) and the upsweep prominent; fins and corner tips are the identity.
- Order matters: P1 then P2; P3 overwrites the roof where it cuts away z 120..141 x 52..99 and replaces the short columns on z 134.
- Facade of the south face and east face matters most; those glow warm at dusk.
- Use `chain` not iron_chain; no polished_andesite_wall (use andesite_wall); persistent leaves.
- Door cells and lobby cells are air; the glass wall is z 130 only.
- Run `$MCD check` and `$MCD fit` after each part.

- P1 (shell.mjs) done: podium, steps, cheeks, 46 short columns (the six portal columns at z 134 x 53..98 are left to P3, tall), red walls (south wall gap x 49..102 for the portal/glass; E/W/N gaps x/z 73..78 for door bays), granite band, beam ring. Added smooth_stone block y 20..21 on each column to carry the beam. Lamp posts, floods not built.
