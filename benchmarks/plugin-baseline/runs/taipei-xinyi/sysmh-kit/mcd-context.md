# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# REQUIRED ELEMENTS: Sun Yat-sen Memorial Hall (plot-local coords from plan.md; parts P1..P6 are listed in plan.md PARTS)

- [ ] **Raised stone podium** y 0..2, x/z 8..143. polished_andesite body, stone_bricks course y 0, smooth_stone_slab coping (type top) y 2 on the outer ring. P1, `podium()`.
- [ ] **Broad south steps** x 56..95, z 144..157 as the architect's slab ramp (half steps, 3 then 2-long landing). polished_andesite_slab (bottom) + full polished_andesite; cheeks x 52..55 / 96..99 stone_bricks with `lamp_post()`. P1, `step_ramp()`, `cheek_wall()`.
- [ ] **52 columns, 14 a side**, 3x3 quartz_pillar axis y, centres 17..134 step 9, y 3..19; polished_andesite base y 3, smooth_stone capital y 19. P1, `column()`.
- [ ] **Red walls + gray pilasters** closed box x 21..130 z 21..130, red_terracotta y 3..19; smooth_stone pilaster 1 wide, +1 proud at each column centre line (x/z 20 and 131). P1, `red_wall_run()`.
- [ ] **Red-brown band** polished_granite ring y 20..21 on the wall plane. P1.
- [ ] **Eave beam ring** smooth_stone y 22..23 over the columns (16..18 / 133..135) with smooth_stone_slab top brackets y 21 each side of each column. P1, `eave_bracket()`.
- [ ] **Great yellow concave-hip roof** x 10..141, y 24..41 per the architect's d-table; yellow_concrete 60% with yellow_terracotta every 3rd ring; smooth_stone fascia ring y 24; solid closed shell with smooth_stone soffit y 23..24 for d 0..5. P2, `roof_cell()`, `roof_shell()`.
- [ ] **Hip ridges** on the four diagonals, smooth_stone one above the surface, corner to top deck. P2, `hip_ridge()`.
- [ ] **Corner upsweep** eave lifts +0,0,1,1,1,2,2,3,3,4 over 10 cells; curled tip of stone_stairs to y 31, gold_block tip at the corner cell. P2, `corner_flick()`.
- [ ] **Top deck** y 41 yellow, smooth_stone rim y 42 at d=30, gold_block at four rim corners. P2.
- [ ] **South raised-eave portal** x 49..102: roof cut away z 120..141 between fins; lintel box y 37..40 (smooth_stone), dentil row y 36, deck y 41, parapet y 42. P3, `portal_lintel()`.
- [ ] **Upswept fins** x 49..51 and 100..102, z 124..141, rising to y 45, flick stepping to z 143 at y 46..47 in stone_stairs, gold_block tip y 47. The famous upswept roof. P3, `fin()`.
- [ ] **Six tall portal columns** quartz_pillar, centres 53..98 on z 134, y 3..36. P3, `column(tall)`.
- [ ] **Mid beam + name board** smooth_stone beam y 30..31 z 131..132; black_concrete board x 64..87 y 32..35 on z 133, gold_block frame, "SUN YAT-SEN" gold banner letters via `plaque()`. P4, `name_board()`.
- [ ] **Lit glass lobby wall** z 130, x 55..96, y 3..36: glass_pane, polished_deepslate mullions every 3 (x 55,58..96), transoms y 9,15,21,27,33; four door pairs left open air y 3..5 (x 60..63, 66..69, 82..85, 88..91). P4, `glass_wall()`.
- [ ] **Lobby interior seen through glass** smooth_quartz floor, three chandeliers (chain + lanterns) x 66, 75..76, 85, z 125, y 26..30. P5, `chandelier()`.
- [ ] **East/west/north lit door bays** x 130 / x 21 z 73..78, z 21 x 73..78; y 3..9 glass_pane with a lit sea_lantern-backed vestibule pocket behind. P4, `door_bay()`.
- [ ] **Red-banner flagpoles** iron_bars 6 high with red_banner in the south hedge. P6, `flagpole()`.
- [ ] **Floodlight wells** shroomlight flush in the deck y 2 one cell outboard of every column (all sides). P5, `flood_well()`.
- [ ] **Gallery hanging lanterns** under the eave beam, y 20..21, between columns. P5, `gallery_lantern()`.
- [ ] **Roof lights** ochre_froglight set in the tiles on an 8-grid (offset 4) plus one at every ridge foot. P5, `roof_light()`.
- [ ] **Red aircraft lights**: not applicable (low building); instead gold_block tips are floodlit by a shroomlight under each fin flick. P5.
- [ ] **Lamp posts** on step cheeks x 53, 98 at z 145, 150, 155 and the podium corners: andesite_wall post (1.21.1 has no polished_andesite_wall) + lantern. P5, `lamp_post()`.
- [ ] **Park: hedges, topiary, lawn** azalea/flowering azalea hedge z 144..147 (x 4..51, 100..147) and lawn strips; spruce_leaves cone topiary every 18; grass patches with dirt_path/coarse_dirt. P6, `hedge_run()`, `topiary_cone()`.
- [ ] **Dusk light and no spawns**: every roof, deck, gallery and lawn cell at light >= 1 from lanterns, shroomlights, froglights. P5.
```

### rooms.json

```json
{"entrance":[67,3,131],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "roof_tile": ["yellow_concrete", "yellow_terracotta", "ochre_froglight"],
    "stone_trim": ["smooth_stone", "smooth_stone_slab", "stone_stairs", "stone_brick_stairs"],
    "gold": ["gold_block"],
    "columns": ["quartz_pillar", "smooth_quartz", "quartz_slab", "quartz_stairs"],
    "podium": ["polished_andesite", "polished_andesite_slab", "polished_andesite_stairs", "stone_bricks", "stone_brick_wall"],
    "wall_post": ["andesite_wall"],
    "walls": ["red_terracotta", "polished_granite", "polished_granite_slab"],
    "glass": ["glass_pane", "polished_deepslate"],
    "board": ["black_concrete", "yellow_banner", "yellow_wall_banner"],
    "greenery": ["grass_block", "dirt_path", "coarse_dirt", "azalea_leaves", "flowering_azalea_leaves", "spruce_leaves"],
    "flags": ["iron_bars", "red_banner"],
    "lights": ["lantern", "shroomlight", "sea_lantern"]
  },
  "objects": ["chain"]
}
```

### make.sh

```sh
#!/bin/sh
# Make build.nbt from scratch: node build.mjs writes a temp file, which is moved into place only if the build succeeded.
set -eu
cd "$(dirname "$0")"
tmp=$(mktemp ./build.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Sun Yat-sen Memorial Hall: lay the ground, then run the six parts in order, and save to the path in argv[2].
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SIZE, GROUND_Y, GRASS_BLOCK, onFootprint } from "./vocab/base.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const PARTS = [
  ["shell", "parts/shell.mjs"],
  ["roof", "parts/roof.mjs"],
  ["portal", "parts/portal.mjs"],
  ["facade", "parts/facade.mjs"],
  ["lights", "parts/lights.mjs"],
  ["grounds", "parts/grounds.mjs"],
];

// A part file that is not there (its worker is mid-copy) builds nothing; that is never an error.
async function partBuild(file) {
  const path = resolve(here, file);
  if (!existsSync(path)) { console.log(`part ${file}: missing, built as nothing`); return () => {}; }
  return (await import(pathToFileURL(path).href)).build;
}

const g = new Grid(SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
for (let x = 0; x < SIZE[0]; x++) for (let z = 0; z < SIZE[2]; z++) if (onFootprint(x, z)) g.set(x, GROUND_Y, z, GRASS_BLOCK);

const list = [];
for (const [name, file] of PARTS) list.push([name, await partBuild(file)]);
runParts(g, list, { palette: resolve(here, "palette.json"), roof: resolve(here, "roof.json") });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Palette ids, plan.md site coordinates and a seeded rng, shared by every part. Ids are palette.json's (1.21.1);
// coordinates are plot-local, y 0 = ground course (people stand on y 1).

// ---- palette: one constant per palette.json id ----

// ---- palette: one constant per palette.json id ----
export const YELLOW_CONCRETE = "yellow_concrete";                 // roof tile (60%)

export const YELLOW_TERRACOTTA = "yellow_terracotta";            // roof tile courses, every 3rd ring

export const OCHRE_FROGLIGHT = "ochre_froglight";                // roof lights set into the tiles

export const SMOOTH_STONE = "smooth_stone";                      // ridges, fascia, fins, beams, capitals

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";            // coping, brackets, dentils

export const STONE_STAIRS = "stone_stairs";                      // roof corner curls and fin flicks

export const STONE_BRICK_STAIRS = "stone_brick_stairs";          // stone-brick curls and steps

export const GOLD_BLOCK = "gold_block";                          // tips, name board frame, top-deck corners

export const QUARTZ_PILLAR = "quartz_pillar";                    // column shafts (axis y)

export const SMOOTH_QUARTZ = "smooth_quartz";                    // lobby floor, statue plinth

export const QUARTZ_SLAB = "quartz_slab";                        // chandelier ring, plinth slabs

export const QUARTZ_STAIRS = "quartz_stairs";                    // plinth steps

export const POLISHED_ANDESITE = "polished_andesite";            // podium body, column bases, paving

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";  // step slabs, coping

export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs"; // step ramps

export const STONE_BRICKS = "stone_bricks";                      // podium bottom course, step cheeks

export const STONE_BRICK_WALL = "stone_brick_wall";              // cheek copings

export const ANDESITE_WALL = "andesite_wall";                    // lamp posts (no polished_andesite_wall in 1.21.1)

export const RED_TERRACOTTA = "red_terracotta";                  // hall walls and door-bay panels

export const POLISHED_GRANITE = "polished_granite";              // red-brown band under the eave

export const POLISHED_GRANITE_SLAB = "polished_granite_slab";    // band caps

export const GLASS_PANE = "glass_pane";                          // lobby wall, door bays

export const POLISHED_DEEPSLATE = "polished_deepslate";          // mullions and transoms

export const BLACK_CONCRETE = "black_concrete";                  // name board field

export const YELLOW_BANNER = "yellow_banner";                    // gold letters, standing

export const YELLOW_WALL_BANNER = "yellow_wall_banner";          // gold letters, on the board

export const GRASS_BLOCK = "grass_block";                        // park ground, y 0

export const DIRT_PATH = "dirt_path";                            // edging

export const COARSE_DIRT = "coarse_dirt";                        // topiary bases

export const AZALEA_LEAVES = "azalea_leaves";                    // hedges (persistent)

export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves"; // hedge flecks (persistent)

export const SPRUCE_LEAVES = "spruce_leaves";                    // topiary cones (persistent)

export const IRON_BARS = "iron_bars";                            // flagpoles

export const RED_BANNER = "red_banner";                          // flags

export const LANTERN = "lantern";                                // chandeliers, gallery and lamp-post lanterns

export const SHROOMLIGHT = "shroomlight";                        // floodlight wells in the deck

export const SEA_LANTERN = "sea_lantern";                        // vestibule backing, hidden

export const CHAIN = "chain";                                    // hanging lanterns (1.21.1 id; never iron_chain)

// ---- site (plan.md) ----
export const SIZE = [153, 51, 159];                              // x 0..152, y 0..50, z 0..158

export const GROUND_Y = 0;                                       // the ground course

export const FOOTPRINT = [[4, 147, 4, 147], [52, 99, 148, 155], [56, 95, 156, 158], [4, 7, 0, 3], [0, 7, 144, 151]]; // [x0, x1, z0, z1] rects: buildable, apron, lawn scraps

export const PODIUM = { x0: 8, x1: 143, z0: 8, z1: 143, top: 2 };  // stone plinth, y 0..2 (deck top = y 2)

export const COLUMN_CENTRES = [17, 26, 35, 44, 53, 62, 71, 80, 89, 98, 107, 116, 125, 134]; // 14 a side, both axes

export const COLUMN_TOP = 19;                                    // short column capital y

export const PORTAL_COLUMN_TOP = 36;                             // tall portal columns (centres 53..98 on z 134)

export const HALL = { x0: 21, x1: 130, z0: 21, z1: 130 };        // red wall planes (wall at 21 and 130)

export const ROOF = { x0: 10, x1: 141, z0: 10, z1: 141 };        // concave hip roof footprint (eave y 24)

export const DECK = { x0: 40, x1: 111, z0: 40, z1: 111, y: 41 }; // flat top deck

export const PORTAL = { x0: 49, x1: 102, z0: 120, z1: 143 };     // raised south eave, cut out of the roof

export const GLASS_Z = 130;                                      // lobby glass wall plane

export const LOBBY = { x0: 55, x1: 96, z0: 122, z1: 129, y0: 3, y1: 36 }; // lit lobby air behind the glass

export const ENTRANCE = [67, 3, 131];                            // main way in, at the top of the steps

export const STEPS = { x0: 56, x1: 95, z0: 144, z1: 157 };       // accessible slab ramp, 40 wide

export const BEAM_Y = [22, 23];                                  // eave beam ring

export const BAND_Y = [20, 21];                                  // granite frieze under the beam

export const DOOR_BAY_CENTRE = 75.5;                             // E/W/N door bays span 73..78

/** True if (x, z) is a footprint cell (buildable rectangle, apron or lawn scrap). */
export function onFootprint(x, z)

/** Seeded PRNG: rng(seed)() returns a float in [0, 1); the same seed gives the same sequence (mulberry32). */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Vocabulary helpers, part 1 (plan.md VOCABULARY): podium, column, roof_cell, corner_flick, glass_wall, chandelier,
// roof_light, topiary_cone. Coordinates are plot-local, y 0 = ground course.
//
// Every helper takes its position as arguments and writes only inside its own footprint, into air only: a cell that
// already holds a block is refused and listed, never overwritten. roof_light is the one exception (it replaces the
// roof tile it sits on). A position outside the helper's own footprint throws, since that is a caller error.
// Each helper returns { placed, refused }, where refused is a list of [x, y, z, block].

// Podium: a stone plinth over the box x0..x1, z0..z1, y 0..2. The y 0 course is stone_bricks, y 1 and the deck y 2
// polished_andesite, with a smooth_stone_slab (top) coping on the outer ring at y 2.
// groundOver: the y 0 course may replace the park ground under it (grass, dirt, coarse dirt, path). Off by default:
// the ground is an earlier part's cells and is refused.
export function podium(g, x0, z0, x1, z1, { groundOver = false } = {})

// Column: 3x3 centred on (cx, cz), y 3..top. Base polished_andesite at y 3, quartz_pillar shaft (axis y) to top-1,
// smooth_stone capital at y top. Short columns top at 19; the six portal columns use top = 36.
export function column(g, cx, cz, top = 19)

// Roof cell at (x, z) of the great concave hip roof (x and z 10..141). The surface y comes from the d-table, and the
// column is filled from it down to one below the previous ring's surface, so the roof is a closed shell.
// Soffit (y <= 24, d <= 5) and the d = 0 fascia are smooth_stone; the tile is yellow_terracotta on every third band of
// three rings, else yellow_concrete. The d = 30 ring gets a smooth_stone rim at y 42, gold_block at its four corners.
export function roof_cell(g, x, z)

// Corner flick: the curl over one outer corner of the roof (corner = "nw" | "ne" | "sw" | "se"). Four diagonal cells in
// from the corner: stone_stairs rising from y 28 to y 30 toward the tip, then a gold_block tip at y 31 on the corner
// cell. Stairs face toward the corner's end of the building (north for the north corners, south for the south ones).
export function corner_flick(g, corner)

// Glass wall: a glass_pane wall on plane z over x0..x1, y0..y1. polished_deepslate mullions at x0, every third column
// after it, and at x1; deepslate transoms at y 9, 15, 21, 27, 33 (where in y0..y1). doors: [[xa, xb], ...] spans left
// open as air for y0..y0+2 (the four door pairs use y 3..5). Panes connect to their in-wall neighbours.
export function glass_wall(g, x0, x1, z, y0, y1, doors = [])

// Chandelier at (x, z) in a lit room, hung at `top` (default 36): a chain (axis y) from top down
// to top-6 with a hanging lantern at top-7, a quartz_slab ring (bottom) at top-9 around the open centre, and four
// hanging lanterns under the ring's corners at top-10. The lantern hangs from the chain above it, and the lanterns
// hang from the slab above them.
export function chandelier(g, x, z, top = 36)

// Roof light at (x, z): replaces the topmost yellow roof tile in that column with ochre_froglight, so the light sits
// set into the surface (also where corner lift moves it). Refused if the column holds no roof tile.
export function roof_light(g, x, z)

// Topiary cone centred on (x, z), standing on the ground course: a 3x3 base at y 1 tapering over four more layers to
// a single leaf at y 5. Leaves are persistent so they never decay.
export function topiary_cone(g, x, z)
```

### vocab/h2.mjs

```js
// Vocabulary helpers, batch h2 (plan.md VOCABULARY): step_ramp, red_wall_run, roof_shell, fin, door_bay, flood_well,
// lamp_post, flagpole. Coordinates are plot-local (plan.md; y 0 = ground course). Blocks are plan.md PALETTE ids and
// states are valid for 1.21.1.
//
// Contract, for every helper: the footprint comes in as arguments (a box {x0,x1,y0,y1,z0,z1}, inclusive, or a position
// [x,y,z] for one object); it writes only inside that footprint and only into air unless o.over is true; it returns
// { placed, blocked } where blocked lists the footprint cells that were not air (left alone). Facing comes in as an
// argument too. None of these is furniture, so there is no room lane to keep clear.

/**
 * South steps (plan.md OPENINGS table). box.z1 is the street-side bottom row, box.z0 the podium-side deck row, and
 * k = z1 - z. k 0: bottom slab on y1. k 1: full on y1. k 2..4: full on y1 with a bottom slab on y2 (the landing).
 * k >= 5: full on y1 and y2 (deck level). Writes only y1..y2, so the ground under the steps is never touched.
 * box: { x0,x1 (56..95), y0 1, y1 2, z0 (144), z1 (157) }.
 */
export function step_ramp(g, box, o = {})

/**
 * A red wall run on one face of the hall: red_terracotta on the wall plane over box y0..y1, and smooth_stone pilasters
 * one block proud on the outer face at each column centre. The box spans both planes: north: z1 is the wall and z0 the
 * pilasters; south: z0 the wall, z1 the pilasters; west: x1 the wall, x0 the pilasters; east: x0 the wall, x1 the
 * pilasters. Along the wall, the run is x0..x1 (north, south) or z0..z1 (east, west). o.columns: the along-wall
 * coordinates of the column centres; o.gaps: [a0, a1] spans left air (door bays, see door_bay).
 */
export function red_wall_run(g, box, side, o = {})

/**
 * The great roof's shell (plan.md ROOFS): every cell of the roof footprint box (x0..x1, z0..z1) filled from its bottom
 * up to its surface. Eave ring (d 0): smooth_stone fascia; d 0..5: smooth_stone soffit at y 23..24; the rest yellow,
 * yellow_terracotta on every third ring (d div 3 mod 3 = 0), otherwise yellow_concrete. The column bottom is one below
 * the previous ring's surface, so the shell has no holes on its risers. o.skip: a footprint box left to the portal part
 * (the south cut-out). box y0 23, y1 41.
 */
export function roof_shell(g, box, o = {})

/**
 * A portal fin (plan.md PARTS P3): a 3-thick smooth_stone wall on box x0..x1 that stands on the roof from the eave ring
 * (roof.z1 - 17 = box.z0) toward the front. From roof.z1 - 15 forward it rises to y 45; further back it is the roof
 * itself. The flick steps out over z roof.z1+1..+2 at y 46 in stone_stairs (facing south, bottom), with a gold_block tip
 * at (x0+1, 47, roof.z1+2) and a shroomlight under the flick at y 44 on the portal side. o.roof: {x0,x1,z0,z1} of the
 * roof (the same footprint roof_shell took); o.inner: "east" when the portal lies east of the fin (the west fin, default),
 * "west" for the east fin.
 */
export function fin(g, box, o = {})

/**
 * A lit door bay on one face (plan.md OPENINGS and ROOMS): side is the wall's face ("east", "west", "north", "south"),
 * wallAt the wall plane's coordinate (x for east/west, z for north/south), [a0, a1] the span along the wall (6 wide).
 * In the wall: glass_pane from yFloor to yGlass, red_terracotta above it to yTop. Behind it, a 3-deep vestibule into the
 * hall: smooth_quartz floor at yFloor, and a smooth_quartz back wall four cells in, with two sea_lanterns set in it at
 * yFloor + 2, on the span's middle (so the lanterns have a block to hang on). o: { yFloor 3, yGlass 9, yTop 19, over }.
 */
export function door_bay(g, side, wallAt, [a0, a1], o = {})

/**
 * A floodlight well: shroomlight flush in the podium deck at [x, y, z] (the deck top is y 2), one cell outboard of a
 * column. The deck cell is polished_andesite; it is replaced only with o.over === true. Any other occupied cell is left.
 */
export function flood_well(g, [x, y, z], o = {})

/**
 * A lamp post: andesite_wall three high from [x, y, z] (the base sits on a cheek or podium top), a standing lantern on
 * top at y + 3. andesite_wall is the 1.21.1 id (no polished_andesite_wall). o.over: replace occupied cells.
 */
export function lamp_post(g, [x, y, z], o = {})

/**
 * A flagpole: iron_bars six high from [x, y, z] (a post, no arms), with a red wall banner on its east face at the top
 * (y + 5), pointing east. o.over: replace occupied cells.
 */
export function flagpole(g, [x, y, z], o = {})
```

### vocab/h3.mjs

```js
// vocab/h3.mjs: the seven helpers plan.md VOCABULARY gives this part: cheek_wall, eave_bracket, hip_ridge,
// portal_lintel, name_board, gallery_lantern, hedge_run. Each takes its position (and side, corner, face) as arguments,
// writes only its own footprint, and only into air: a cell that is not air belongs to an earlier part, so it is refused
// and listed, never overwritten. Every helper returns { placed: [[x, y, z], ...], refused: [{ at, why }, ...] }.

/** Stone cheek walls beside the south steps: stone_bricks at y 1..2 over x0..x1, z0..z1 (plan: x 52..55 and 96..99, z 144..155). */
export function cheek_wall(g, x0, x1, z0, z1)

/** Eave bracket: smooth_stone_slab (type top) at y 21 either side of the column centre (cx, cz), under the beam. side is the
 *  facade it sits on: north/south spread the two brackets along x (cx ± 1), east/west along z (cz ± 1). */
export function eave_bracket(g, cx, cz, side)

/** Hip ridge on one diagonal: smooth_stone one block above the roof, from d 4 out to the top deck rim (d 30). The four tip
 *  cells (d 0..3) are left to the corner flick, which curls them up. corner: nw, ne, sw or se. */
export function hip_ridge(g, corner)

/** South portal lintel box over x0..x1, z0..z1: smooth_stone at y 37..40, yellow_concrete deck at y 41, smooth_stone parapet
 *  at y 42 on the box's edge, and a dentil (smooth_stone_slab top on every 2nd cell) at y 36 along the z1 edge. */
export function portal_lintel(g, x0, x1, z0, z1)

/** Name board on a facade: black_concrete over u0..u1 and y0..y1 on the wall plane d, a gold_block frame ring around it, and
 *  the text in banner letters hung on the board's outer face (plaque, material null). u is x on north/south facades and z on
 *  east/west ones. face: north, south, east or west. */
export function name_board(g, face, u0, u1, y0, y1, d, text = "SUN YAT-SEN")

/** Hanging gallery lantern under the eave beam at (x, z): chain at y 21 and a hanging lantern at y 20. The chain hangs from the
 *  beam at y 22, so nothing is placed when that cell is air. */
export function gallery_lantern(g, x, z)

/** Hedge two cells deep (z, z+1) and two high (y 1..2), from x0 to x1: azalea_leaves, with flowering_azalea_leaves on 1 cell in 4. */
export function hedge_run(g, x0, x1, z)
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
