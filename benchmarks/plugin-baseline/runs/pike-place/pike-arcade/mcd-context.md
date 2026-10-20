# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Pike Place Market: Main Arcade and North Arcade (plot 0), form plan

## SITE

- Plot: x 0..42, z 0..311, y 0..82. Build only on footprint cells. Column x 42 is never built (not in the footprint).
- **Orientation (site, not the generic "front faces north"):** the street front faces **EAST (+x)** onto Pike Place. Pike Place runs along z (north-west end at z 0, Pike Street at z 311). Elliott Bay is west (low x, downhill). Pike Street runs east-west past the south end (z 311). Hero corner = south-east corner (x 34..41, z 280..311).
- Ground: the street edge (x 35..41) sits at y 18..23 and rises toward the south. The ground falls west to y 2..7 at x 0. **Rule for every outer wall column:** the footing goes down to (ground of that 7x7 cell − 2). Nothing floats; the extra buried masonry doesn't matter.
- Floor convention: a floor value F is the y of the floor BLOCK, and people stand at F+1.

Footprint, decoded (7x7 cells):

| rows | z | footprint x |
|---|---|---|
| 0–18 | 0..132 | 28..34 |
| 19–22 | 133..160 | 28..41 |
| 23–26 | 161..188 | 21..41 |
| 27–31 | 189..223 | 14..41 |
| 32–35 | 224..251 | 7..41 |
| 36–43 | 252..307 | 0..41 |
| 44 | 308..311 | 7..41 |

Masses (all coordinates are inclusive):

| # | mass | x | y | z | notes |
|---|---|---|---|---|---|
| A | North Arcade shed (open market on posts) | 28..34 | 19..28 | 0..132 | floor 19; west wall x 29; post line x 33; roof covers 28..34 |
| A-f | North Arcade footing / plinth | 28..34 | ground−2 .. 18 | 0..132 | solid masonry under the floor; west face x 28 |
| B1 | North Arcade hall (wider shed) | 28..41 | 20..31 | 133..160 | floor 20; west wall x 29; post line x 40 |
| B1-f | its plinth | 28..41 | ground−2 .. 19 | 133..160 | |
| B2 | Upper market building, north (2 storeys) | 21..33 | 20..36 | 161..188 | street floor 20, upper floor 26, walls to y 31, eave course y 32 |
| C | Upper market building, Main Arcade (3 storeys) | 14..33 | 22..45 | 189..279 | street floor 22, floors 28 and 34, walls to y 39, eave course y 40 |
| S | Street arcade shed (stalls) | 34..41 | 20/22..29 | 161..279 | floor 20 (z 161..188), 22 (z 189..279); post line x 40; eave x 41 |
| D | Corner block at Pike Street (3 storeys, flat roof) | 14..41 | 23..43 | 280..311 | floor 23: open arcade storey y 24..28, floors 29 and 35, walls to y 41, roof deck y 42, parapet y 43 |
| DU | Down Under (the stone base under street level) | west edge of footprint .. 33 | ground−2 .. street floor | 161..311 | follows the footprint steps; levels at floor 2, 7, 12, 17 |
| T | West terraces on the Down Under roof | x 7..13 (z 224..251), x 0..13 (z 252..307), x 7..13 (z 308..311) | 22 (deck), 23 (parapet) | | deck y 22 (y 23 for z 280..311), parapet wall on the outer edge |
| SG | PUBLIC MARKET CENTER sign | 37..39 | 43..70 | 279..310 | stands on D's roof deck (legs y 43..47, board y 48..69, top rail y 70) |
| CK | Corner clock, two faces | east face x 41, south face z 311 | 35..41 | | see FACADES |
| MP | MEET THE PRODUCER board | x 41 (raised parapet) | 42..45 | 281..299 | |

There are no stairs to the street inside the plot. The street floors are at street grade. Where two street floors meet (z 132/133: 19→20, z 160/161 continuous at 20, z 188/189: 20→22, z 279/280: 22→23), the aisle steps up by slab ramps (half steps, at most 3 then a level landing of 2) inside the arcade, at x 34..39.

## ROOFS

| roof | over | form | pitch | ridge | eave course | overhang | material |
|---|---|---|---|---|---|---|---|
| R-A | A, x 28..34, z 0..132 | gable, ridge along z (by type a market shed; `shop` preset rules, but with the ridge along the street) | ~0.75 | x 31, y 28 | y 25 | 1 (walls x 29/33, eave at x 28/34); north gable end at z 0 overhang 0 | `dark-slate` palette, dark oak verge, stone brick ridge |
| R-B1 | B1, x 28..41, z 133..160 | gable, ridge along z | ~0.6 | x 34–35, y 31 | y 27 | 1 (walls x 29/40, eave x 28/41) | `dark-slate` |
| R-S | S, x 34..41, z 161..279 | shed (lean-to) falling east, high side against the upper wall | ~0.3 | high edge x 34: y 27 (z 161..188), y 29 (z 189..279) | low eave x 41: y 25 (z 161..188), y 27 (z 189..279) | 1 past the posts (x 41); 0 at the north end | `dark-slate`, dark oak fascia |
| R-B2 | B2, x 21..33, z 161..188 | low gable, ridge along z | 0.5 | x 27, y 36 | y 32 | 1 west (x 20 is off-footprint, so overhang 0 there; run the wall at x 22 if the tool insists on 1) | `dark-slate` |
| R-C | C, x 14..33, z 189..279 | low gable, ridge along z | 0.5 | x 23–24, y 45 | y 40 | 1 east over the shed and west over the terraces; the north gable at z 189 faces R-B2 (gable wall in `quartz_bricks`, keep) | `dark-slate` palette, `smooth_quartz` cornice under the eave |
| R-D | D, x 14..41, z 280..311 | flat roof deck (by type the `modern` flat-parapet preset): deck y 42, white parapet y 43 with `smooth_quartz_slab` coping | flat | — | y 41 cornice | cornice 0 (footprint edge) | deck `smooth_stone`, parapet `smooth_quartz` |

- Roofs meet by abutment. R-S's high edge stops flush against the upper building's east wall at x 33 (B2, C), with a slab flashing course. R-C's south end butts into D's north wall (D is taller, y 43 vs C eave 40; R-C's ridge at y 45 rises above D's parapet, so D's north wall rises in a stepped gable up to y 45 behind it, built by hand). R-B2 meets C's north gable at z 189. R-B1's south gable meets B2/S at z 160/161. R-A's south end butts under R-B1's north gable at z 132/133.
- Chimneys (the concept's dark stacks on the ridge): brick stacks 2x2 on R-C at (x 23..24, z 214..215) and (x 23..24, z 254..255), and on R-B2 at (x 27..28, z 174..175), each rising 3 above the ridge. These are dummy stacks (exterior only, no hearths), so they go in the roof's `keep`.
- Hand-built roofs: R-D's stepped north gable wall, and the shed's slab flashing.

## FACADES

**East (street) face, the hero.** Base, middle, top read left to right as low tail → market → corner.

| zone | base (street floor) | middle | top |
|---|---|---|---|
| A, z 0..132 | open: `green_concrete` posts x 33 at z 1, 5, 9 … 129 (every 4), y 20..24, each with an upside-down `dark_oak_stairs` bracket under the head beam; head beam `dark_oak_planks` y 25 along x 33; red/white awning valance on it | — | R-A eave |
| B1, z 133..160 | posts x 40 at z 133, 137 … 157, y 21..26; head beam y 27 | — | R-B1 |
| S, z 161..279 | stall front: posts x 40 every 4 (z 161, 165 … 277), y floor+1 .. floor+4; head beam/fascia `dark_oak_planks` at x 40..41, y floor+5; **awning valance** hanging one below the fascia on x 41, alternating `red_wool`/`white_wool` per cell; a hanging lantern under the beam in every bay; counters x 37..39 heaped with produce; aisle x 34..36; shop doors in the upper wall x 33 | upper wall x 33 above R-S: `quartz_bricks`; C storeys 28 and 34 show (windows rows y 30..32 and y 36..38); B2 storey 26 shows (window row y 28..30); `smooth_quartz` pilaster (1 proud, at x 34) on every 3rd pier | `smooth_quartz` string course (slab, 1 proud) at y 34 (C) under the top storey; eave cornice `smooth_quartz_stairs` upside down, 1 proud, y 39 (C) / y 31 (B2) |
| D, z 280..311 | open arcade storey y 24..28: posts x 41 at z 280, 284 … 308 and the corner post (41, 311); head beam y 29 `dark_oak_planks`; Pike Place Fish ice beds x 35..40, z 296..309 | storeys 29 and 35 in `quartz_bricks`, windows (below); `smooth_quartz` quoins at the corner (41, z 311) and (41, z 280), paired 2-on/2-off | cornice `smooth_quartz_stairs` y 41, 1 proud only where it stays inside the footprint (so recessed: the wall face at x 40 for y 30..40 and the cornice at x 41); parapet y 43; MP board; clock |

Depth on D: the upper wall plane is x 40 for y 30..40, set back 1 from the post line x 41, so that the cornice (x 41, y 41), the quoins (x 41) and the clock (x 41) stand proud of it.

**South face (z 311, Pike Street):** the arcade storey is open at x 34..41 (corner entrance, posts at x 34 and x 41). Westward the face drops into the Down Under (x 7..33, `stone_bricks`) with window tiers by the DU rule. The upper storeys 29/35 of D run x 14..41 with windows. The second clock face sits here.

**West face (bay side).**
- Down Under walls `stone_bricks` on faces x 0 (z 252..307), x 7 (z 224..251 and z 308..311), x 14 (z 189..223), x 21 (z 161..188), and the north-facing step faces z 161 (x 21..27), z 189 (x 14..20), z 224 (x 7..13), z 252 (x 0..6).
- Plinth: `cobbled_deepslate` from the footing up to ground+1. String course `stone_brick_stairs` (upside down, 1 proud) at each level line y 7, 12, 17. Top: parapet coping at the terrace edge, `stone_brick_wall` at y 23 (y 24 over D).
- Upper building west face x 14 (C, z 189..279) and x 21 (B2): `quartz_bricks`, same window rhythm as the east face, cornice as on the east face. Over z 189..223 it rises sheer from the DU face (the full Down Under drop + 3 storeys: the tallest wall over the bay).
- A North Arcade west wall x 29 above its plinth (x 28 face below y 19): `quartz_bricks` y 20..24 with 2-wide windows. Plinth `stone_bricks`.

**Rhythm:** one bay = 6 blocks along z. Bay k starts at z = 190 + 6k (C, D: k = 0..20). Window = 4 wide at z start+1..start+4, then a 2-wide pier. B2 uses the same grid running back (z 184−6k).

## MATERIALS

| role | block |
|---|---|
| upper body (white-painted brick) | `quartz_bricks` |
| trim: pilasters, quoins, string courses, cornice | `smooth_quartz`, `smooth_quartz_stairs`, `smooth_quartz_slab` |
| Down Under body | `stone_bricks` (cracked/mossy at most 1 in 10, near the ground) |
| base plinth | `cobbled_deepslate` |
| DU string courses, terrace parapet | `stone_brick_stairs`, `stone_brick_wall` |
| arcade posts (green-painted) | `green_concrete` |
| beams, fascia, window frames, sills | `dark_oak_planks`, `dark_oak_stairs`, `dark_oak_trapdoor` |
| awning valance | `red_wool` / `white_wool` alternating |
| roofs | `dark-slate` palette (`deepslate_tiles` base) |
| flat roof deck | `smooth_stone` |
| arcade floor | `polished_andesite` with a `smooth_stone` edge |
| glass | `glass_pane` (multi-pane read from the frames) |
| window glow (one cell behind the glass) | `ochre_froglight` |
| stall and street light | `lantern` (hanging) |
| sign board / frame | `white_concrete` board, `iron_bars` lattice legs and bracing, `white_concrete` frame rails |
| sign letters (red neon) | `red_stained_glass` letter faces at x 39, `glowstone` behind each letter cell at x 38, `white_concrete` back skin at x 37 |
| clock | dial `white_concrete`, bezel/ring `red_concrete` (neon ring), hands `black_concrete` |
| MEET THE PRODUCER | board `dark_oak_planks`; banner letters white on brown |
| fish ice beds | `packed_ice` |
| chimneys | `bricks`, cap `stone_brick_slab` |

All ids pass `$MCD blocks --check` and all exist in 1.21.1. There is nothing post-1.21.1 here (no pale oak, no `iron_chain`; use `chain` for any hanging lamp).

## OPENINGS

East face (all open bays are air between the posts):
- A: open from y 20..24 at x 33 between the posts, all along z 0..132.
- B1: open y 21..26 at x 40, z 133..160.
- S: open y floor+1..floor+4 at x 40, z 161..279.
- D: open y 24..28 at x 41, z 280..311, and on the south face z 311 at x 34..41.
- Shop doors in the upper wall behind the arcade: x 33, 2 wide, at every 2nd bay (z start+2..start+3), y floor+1..floor+2 (C: y 23..24; B2: y 21..22). Glazed shopfront panes in the remaining bays at y 23..25 (C) / 21..23 (B2).
- Upper windows, C east (x 33) and west (x 14): 4 wide × 3 tall at y 30..32 (storey 28) and y 36..38 (storey 34), per bay. West x 14 also has y 24..26 (storey 22).
- B2 east (x 33) and west (x 21): 4 × 3 at y 28..30, per bay (the bay grid runs from z 184).
- D east (x 40) and south (z 311, x 15..39): 4 × 3 at y 31..33 and y 37..39 per bay (south bays: x 16..19, 22..25, 28..31, 34..37). Cells under the clock are left out (see RESERVED).
- North Arcade west wall x 29: 2 × 2 windows at y 21..22, z 2+4k..3+4k.

Down Under windows (west faces and the north-facing step faces): for each level floor f in {2, 7, 12, 17}, windows 3 wide × 2 tall at y f+2..f+3, centred in each bay (z start+1..start+3; on the step faces x the same 6-grid from the west edge). A window exists only where f+1 > the ground of that cell. Below that the face is blank masonry.

Doors at grade:
- Down Under: x 0, z 300..301, y 8..10 (level 7, ground 6–7 there), with a slab ramp outside.
- x 7, z 236..237, y 13..15 (level 12; the ground there is 9–10, so the door opens straight to grade).
- x 14, z 200..201, y 13..15 (ground 12–13).
- South face z 311: x 10..11, y 13..15 (ground 10–12).

## RESERVED (the shell leaves these as air)

- Post line cells between posts (above).
- Counters/stall tables: x 37..39, floor+1, along S (z 161..279) and B1 (x 34..38 tables in rows, z 134..159); North Arcade craft tables x 30..32, y 20, z 2..130, in rows of 2 with 1-cell lanes.
- Fish ice beds: x 35..40, y 24..25, z 296..309.
- Clock east face: x 41, y 35..41, z 302..308 (radius 3, flush; `smooth_quartz` surround, no window there). Clock south face: z 311, y 35..41, x 33..39.
- MEET THE PRODUCER board: x 41, y 42..45, z 281..299 (it rises out of the parapet; the parapet leaves these cells).
- Sign SG: x 37..39, y 43..70, z 279..310. Legs at x 38, z 281, 289, 297, 305, y 43..47 (lattice `iron_bars` between); board plane x 38 y 48..69; letters x 39; back x 37. Three lines, narrow block font, 5 rows each: PUBLIC y 62..66, MARKET y 55..59, CENTER y 48..52 (with margins inside the board, frame rail y 70 and y 47). Facing east, the letters read left to right toward −z. Use `plaque(..., face: "east")`, never a hand loop.
- Chimney stack cells (roof `keep`): R-C (x 23..24, z 214..215) and (x 23..24, z 254..255); R-B2 (x 27..28, z 174..175); from eave to ridge+3.
- Hanging lanterns: one per bay under the head beams (x 39, y floor+4).

## FLOORS

| mass | floors (floor block y) | interior volume |
|---|---|---|
| A | 19 | x 30..32, y 20..24, z 0..132 (open) |
| B1 | 20 | x 30..39, y 21..26, z 133..160 |
| S | 20 / 22 | x 34..39, y floor+1..floor+4 |
| B2 | 20, 26 | x 22..32, z 162..187 |
| C | 22, 28, 34 | x 15..32, z 190..278 |
| D | 23, 29, 35 | x 15..39, z 281..310 (storey 23 open arcade x 34..40) |
| DU | 2, 7, 12, 17 (each 5 tall, walk at f+1) | under B2, C and D, from the footprint's west edge to x 33 |

Exterior only. Interiors show only through glass: the lit stalls, the shop fronts at x 33, and the `ochre_froglight` glow one cell behind every upper and Down Under window.

---
# DESIGNER SECTIONS (below the architect's form; nothing above is changed)

## PALETTE

Architect's ids kept exactly (see MATERIALS). Shape variants and extras (all verified with `$MCD blocks --check`; only `chain` is flagged, because the toolkit names the newer `iron_chain`: **on 1.21.1 write `chain`**).

| role | blocks |
|---|---|
| white brick | `quartz_bricks` |
| trim | `smooth_quartz`, `smooth_quartz_stairs`, `smooth_quartz_slab` |
| Down Under | `stone_bricks`, `cracked_stone_bricks`, `mossy_stone_bricks` (<=1 in 10, low), `stone_brick_stairs`, `stone_brick_slab`, `stone_brick_wall` |
| plinth | `cobbled_deepslate`, `cobbled_deepslate_stairs` |
| posts | `green_concrete` |
| timber | `dark_oak_planks`, `dark_oak_stairs`, `dark_oak_slab`, `dark_oak_fence`, `dark_oak_trapdoor`, `dark_oak_door`, `stripped_dark_oak_log` |
| awning | `red_wool`, `white_wool` |
| roofs | `dark-slate` palette (`deepslate_tiles`, `deepslate_tile_stairs`, `deepslate_tile_slab`), verge `dark_oak_stairs`, ridge `stone_brick_slab` |
| deck/floor | `smooth_stone`, `smooth_stone_slab`, `polished_andesite`, `polished_andesite_slab` |
| glass | `glass_pane`, `ochre_froglight` (glow) |
| sign | `white_concrete`, `iron_bars`, `red_stained_glass`, `red_stained_glass_pane`, `glowstone`, `redstone_lamp` (lit=true), `red_concrete`, `black_concrete` |
| ice/fish | `packed_ice`, `dried_kelp_block`, `red_wool`, `pink_wool`, `light_gray_wool`, `orange_wool`, `barrel` |
| produce | `melon`, `pumpkin`, `hay_block`, `red_wool`, `orange_wool`, `yellow_wool`, `green_wool`, `flowering_azalea_leaves` (persistent=true), `moss_block`, `flower_pot` with `potted_red_tulip`/`potted_poppy`/`potted_cornflower`/`potted_allium`/`potted_orange_tulip`, `cauldron`, `composter`, `candle` (lit) |
| lights | `lantern` (hanging=true under beams, on `chain`), `lantern` standing on posts |
| chimney | `bricks`, `stone_brick_slab` |
| text | `dark_oak_hanging_sign`, `dark_oak_wall_sign`, banners (`red_banner`, `white_banner`, `brown_banner`) via plaque/bannerWord |

## VOCABULARY

Helpers all take `g` (grid) first; `face` is the direction the thing looks (east for the street).

- `post_bay(g, {x, z, y0, h, beamY})`: `green_concrete` column y0..y0+h-1; at (x±1 along street, beamY-1) NOT used; upside-down `dark_oak_stairs` (half top, facing away from the post) on the two cells either side along z at y=beamY-1; `dark_oak_planks` beam block at (x,beamY,z) and the run between posts. Footing: post stands on `polished_andesite`.
- `awning(g, {x, y, z0, z1})`: for each z, wool at (x, y, z): `red_wool` if (z-z0) is even else `white_wool`; below it a `dark_oak_trapdoor` open=false half=top at (x, y-1, z) every 2nd cell is NOT used (keep walk clear). One row only (valance), y >= floor+4.
- `hang_lamp(g, {x, y, z})`: `chain` axis y at (x,y+1,z) below beam y+2, `lantern` hanging=true at (x,y,z). Beam must be at y+2; y>=floor+4 (where the arcade is 5 tall: y=floor+4 => beam floor+5, chain one cell).
- `stall(g, {x0, x1, z0, z1, y, kind})`: base `dark_oak_planks` row at y, top `dark_oak_slab` (type top) at y+1 (counter surface y+1 = top face at y+2 level: goods stand on a FULL block, so goods go on the plank cells; slab is only the front lip). Concretely: counter cells x37..39: planks at y floor+1; goods layer at floor+2. Kinds: `produce` (rows: melon | pumpkin | hay_block | `red_wool` heap + `green_wool` cap), `flowers` (`flower_pot`s with potted flowers in rows, `cauldron`+`flowering_azalea_leaves` buckets), `fish` (`packed_ice` + wool fish rows), `honey` (`honeycomb_block`, `beehive` not used, `candle`), `crates` (`barrel` facing up 2 high, `dark_oak_trapdoor` lid). Sloped front: `dark_oak_stairs` facing east (half bottom) at x39 for heaped look. Never block the aisle x34..36 or z-gaps at post lines.
- `produce_row(g, {x, y, z0, z1, block})`: alternate blocks along z; every 4th cell a `barrel` crate (facing up) with `dark_oak_trapdoor` lid.
- `flower_bucket(g, {x, y, z, flower})`: `cauldron` at (x,y,z), `flowering_azalea_leaves` persistent on top at y+1 (or `potted_*` pot on a plank slab); sit against a post base.
- `stall_sign(g, {x, y, z, text})`: `dark_oak_fence` bracket at (x,y+1,z) hanging from the beam (x,y+2,z) and `dark_oak_hanging_sign` below at (x,y,z) with text via `signboard(g, text, {mode:"hanging", wood:"dark_oak"})`; text in 1.21.1 `front_text`.
- `window_bay(g, {x or z, y, start, face, w:4, h:3, glow:true})`: `glass_pane` 4x3 with a centre muntin: middle column cell(s) `dark_oak_trapdoor` open=true pressed to the glass side, plus transom row (top row replaced by `dark_oak_trapdoor` half top closed? no: keep glass) => reads as 6 panes; sill `smooth_quartz_slab` type top 1 proud at y-1; lintel `smooth_quartz_stairs` half top at y+h, facing out; `ochre_froglight` at the cell behind (inside the wall line, one in) for every pane column; panes connect (set north/south/east/west states along the wall).
- `pier_bay(g, {face, z0})`: the 2-wide pier between windows, `quartz_bricks`; on every 3rd pier a `smooth_quartz` pilaster 1 proud (x34 on the east face of C/B2) full height of the storey, with `smooth_quartz_stairs` cap.
- `cornice(g, {x, y, z0, z1, face})`: `smooth_quartz_stairs` half top facing out, 1 proud, along the eave; under it a `smooth_quartz_slab` (type top) course for depth. At the corner D: only inside the footprint.
- `string_course(g, {y, ...})`: `smooth_quartz_slab` type bottom, 1 proud, one run along the face at y34 (C).
- `shop_door(g, {x, y, z, face})`: `dark_oak_door` lower + upper, 2 wide (double, hinge left/right mirrored), facing out (east), sidelight panes, transom of `glass_pane`; lintel `smooth_quartz_stairs`.
- `du_window(g, {face, f, start})`: 3x2 `glass_pane` at y f+2..f+3 centred in the 6-bay; sill `stone_brick_slab` top, lintel `stone_brick_stairs` upside-down; `ochre_froglight` behind. Only where f+1 > ground.
- `du_course(g, {face, y})`: `stone_brick_stairs` half top, 1 proud, along the whole face at y 7, 12, 17.
- `terrace_edge(g, {...})`: `smooth_stone` deck, `stone_brick_wall` parapet on the outer edge, `smooth_stone_slab` coping optional, planters of `barrel` + `flowering_azalea_leaves`.
- `quoins(g, {x, z, y0, y1})`: `smooth_quartz` in pairs 2-on/2-off up the corner on both faces.
- `ramp(g, {x0, x1, z, from, dir})`: bottom `polished_andesite_slab` run 1..3 then level landing 2 (the aisle steps at z132/133, 188/189, 279/280), 3 wide at least, never stairs.
- `craft_table(g, {x0, z, y})`: 2 long (z, z+1), x30..32: `dark_oak_fence` legs at the 4 corners, top `dark_oak_slab` (top), wares: `flower_pot` (potted_*), `candle` lit on the slab? NO candles on slab tops are fine only on TOP slabs; `decorated_pot` on top slab; lane of 1 between pairs.
- `stack(g, {x, z, y0, ridgeY})`: 2x2 `bricks` from y0 (the eave) to ridgeY+3, one `deepslate_bricks`... use `stone_bricks` band at ridgeY+1, cap `stone_brick_slab` stepped out (no flue, dummy). Cells in roof `keep`.
- `parapet(g, {...})`: `smooth_quartz` wall y43 with `smooth_quartz_slab` coping y44 (top), skipping the MP board cells.
- `neon_sign(g, {x:37..39, y0:43, z0:279..310})`: legs at x38 z281,289,297,305: `iron_bars` y43..47 with `white_concrete` bracing at y47 (rail beam x37..39 along z 279..310); board x37..39 y48..69: back skin `white_concrete` x37, `glowstone` at x38 behind each LETTER cell only (else `white_concrete`), face x39 `white_concrete` except letters: `red_stained_glass` (letters via `plaque(g,"PUBLIC",{face:"east", at:[39,62,..], width, height:5, letter:"red_stained_glass", material:null})`), outline border one cell inside the board edge of `red_stained_glass` with `redstone_lamp` lit=true behind at x38; top rail y70 `white_concrete` + `iron_bars` finials. Letters read left to right toward -z. Lines: PUBLIC y62..66, MARKET y55..59, CENTER y48..52.
- `market_clock(g, {center, face, radius:3})`: `clock()` with `white_concrete` dial, `red_concrete` bezel replaced at 12 hour marks by `black_concrete` on 3/6/9/12, `black_concrete` hands 10:10; neon ring: second ring cell outside the bezel in `red_stained_glass` over `glowstone` (glow x40 behind, in the wall); `smooth_quartz` surround square; "PUBLIC MARKET" `bannerWord` (red on white) on a `white_concrete` strip one row under it, y35 (inside z302..308 7 wide: use 2-line "PUBLIC"/"MARKET" via plaque banner letters on y34 row if needed; else omit).
- `producer_board(g, {x:41, y:42..45, z:281..299})`: `dark_oak_planks` board, `dark_oak_stairs` frame rim, `bannerWord`/`plaque` "MEET THE PRODUCER" white on brown (banner letters in a 2-4 row band, shortened to "MEET THE PRODUCER" over 19 columns, one column per char).
- `ice_bed(g, {x0..x1, z0..z1, y})`: `dark_oak_planks` trough y24, `packed_ice` y25 heaped (one cell at y26 randomly), fish: rows of `red_wool` / `pink_wool` / `light_gray_wool` / `orange_wool` laid on the ice in diagonal rows (a salmon row, a crab row `red_concrete`), kelp `dried_kelp_block`; `lantern` standing on a post at the corners; chalk board = `dark_oak_wall_sign` "FRESH FISH".

## ROOMS

Exterior-only build; the interiors that show are open arcades and shop interiors behind glass. Room boxes are the architect's FLOORS volumes (inner air).

| room | box | purpose | ways in |
|---|---|---|---|
| North Arcade craft market | [30,20,0,32,24,132] | open covered market on posts: rows of craft tables x30..32, lantern hung from truss every 4 z, warm dusk | open east side at x33 between posts z 2+4k; north end z 0 open |
| North Arcade hall (B1) | [30,21,133,39,26,160] | wider hall with stall tables x34..38 in rows, a flower stall and a baker; hung lanterns centre line | open x40 between posts (z133..160); ramp from A at z132/133 |
| Street stall arcade, north (S, floor 20) | [34,21,161,39,24,188] | produce, flowers, honey stalls, counters x37..39, aisle x34..36 | open at x40 bays between posts; shop doors x33 at y21..22 |
| Street stall arcade, main (S, floor 22) | [34,23,189,39,26,279] | the heart of the market: produce, flower, craft stalls heaped with colour, lamps every bay, hand-painted signs | open at x40 between posts z 161+4k; ramp at z188/189 from the north arcade; doors x33 y23..24 |
| Pike Place Fish corner | [35,24,284,40,28,310] | iconic fish market: ice beds x35..40 z296..309, chalk signs, lanterns, orange/red fish rows | open at x41 between posts z280..308 and south face z311 x34..41 |
| Shopfronts behind the arcade (C ground) | [15,23,190,32,27,278] | lit shops seen only through glass: shelves, lamp glow, counters near the x33 glass | doors x33 z start+2..start+3 (y23..24) |

Stairs: none inside the plot; floor steps are slab ramps at z132/133, 188/189, 279/280 (x34..39).

**entrance** (just outside the main door, the arcade bay at the hero corner): (41, 23, 285), a cell in the open arcade storey of D; **street** (Pike Place, off footprint): (43, 23, 285). The street edge is level with the arcade floor (floor 23 at D), so the way in is level; where the street meets floors 20/22 the ground is graded to match (slab ramps 2 wide, half steps only). All of x 42.. is outside the plot; place the ramp inside x34..41 if the street is lower.

## PARTS

1. **South shell: Down Under, main building, corner block** (parts/shell-south.mjs). Footings to ground-2 (use the GROUND map, per 7x7 cell: each outer wall column down to its ground-2), `cobbled_deepslate` plinth to ground+1, `stone_bricks` DU walls with levels 2, 7, 12, 17 (floor `smooth_stone`/`polished_andesite`), C walls x14/x33 z189..279 with floors 22/28/34 (walls to y39), D walls x14..41 z280..311 floors 23/29/35, roof deck y42, terraces T. Leave every opening of OPENINGS as air (windows, doors). Vocab: `terrace_edge`, `du_course`, `pier_bay`.
2. **North shell, shed frame and arcade floor** (parts/shell-north.mjs). Masses A (footing, floor y19, west wall x29, posts, head beam), B1, B2 (walls x22/x33 to y31, floors 20/26), S frame (posts x40 each 4, head beam y floor+5, arcade floor `polished_andesite` with `smooth_stone` edge, ramps), D open storey posts. Vocab: `post_bay`, `ramp`, `pier_bay`.
3. **Roofs and chimneys** (parts/roofs.mjs): write roof.json per ROOFS table (R-A, R-B1, R-S, R-B2, R-C each as `footprint` rect with `keep` for stacks; `dark-slate`), then by hand: R-D deck + parapet y43, stepped north gable of D to y45, the slab flashing along x33/34, `stack` x3. Run `$MCD roof ... --dry-run` and fix warnings. Vocab: `parapet`, `stack`.
4. **Facades: windows, doors, trim, awnings, lighting** (parts/facades.mjs). All `window_bay` on C, B2, D, A west, DU windows with glow, `shop_door`s + panes at x33, `string_course`, `cornice`, `quoins`, `awning`, `hang_lamp` per bay, `stall_sign`s, DU doors and ramps. Vocab: `window_bay`, `du_window`, `shop_door`, `cornice`, `string_course`, `quoins`, `awning`, `hang_lamp`, `stall_sign`.
5. **Corner landmarks: sign, clock, board, fish market** (parts/landmarks.mjs): `neon_sign` (SG), both `market_clock`s, `producer_board`, `ice_bed`s with fish. Check letters render left to right from the east. Vocab: `neon_sign`, `market_clock`, `producer_board`, `ice_bed`.
6. **Stalls, craft tables, grounds** (parts/stalls.mjs): S counters x37..39 with produce, B1 tables, North Arcade craft tables x30..32, `flower_bucket`s, crates, barrels, lanterns standing on posts, dusk props. Vocab: `stall`, `produce_row`, `craft_table`, `flower_bucket`.

Checklist: [ ] 1 south shell  [ ] 2 north shell  [ ] 3 roofs  [ ] 4 facades  [ ] 5 landmarks  [ ] 6 stalls

## NOTES FOR WORKERS

- Build in the site orientation, no turning: street = east (+x). y 0 = lowest ground; floors per FLOORS table. Build only on footprint cells; check each cell against the footprint table before writing (x ranges per z row).
- Footing: every outer wall column down to ground-2 of its 7x7 cell, never floating (`$MCD check`).
- Hanging chain is `chain` on 1.21.1; ignore `$MCD blocks` warning for it only. No pale oak, no `iron_chain`, no 1.21.4+ blocks (no `resin`, `creaking_heart`).
- Letters: only through `plaque`/`bannerWord` with face east; never a hand loop.
- Part order matters: shells, then roofs, facades, landmarks, stalls. Later parts write only into air or their own cells; reserved cells (post line gaps, aisle x34..36, sign, clock, MP board, ice beds, stacks) stay clear in earlier parts.
- Openings left air by shells; the facade part glazes.
- Dusk: every window pane column has `ochre_froglight` behind; every bay a lantern; sign letters glow (glowstone behind red glass). Keep lights above counters and signs; nothing in the 2 cells in front of the aisle.
- Wool for awnings is non-flammable concern: ignore. Never use sand, gravel or powder.
```

### elements.md

```markdown
# Required elements: Main Arcade + North Arcade (plot 0, east face = Pike Place)

All coordinates from plan.md (inclusive). "V:" = vocabulary helper in plan.md. 1.21.1 only: hanging chain is `chain` (not iron_chain; `$MCD blocks` knows only the newer name, ignore that one warning).

| # | element | construction, block by block | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Green-painted arcade posts | `green_concrete` column y floor+1..floor+4, cap `dark_oak_stairs` upside-down both sides under head beam | A x33 z1+4k y20..24; B1 x40 z133+4k y21..26; S x40 z161+4k; D x41 z280+4k | 2 shell-north | post_bay |
| 2 | Head beam / fascia | `dark_oak_planks` run, `dark_oak_stairs` (top half) lip on street side | A x33 y25; B1 x40 y27; S x40..41 y floor+5; D x41 y29 | 2 | post_bay |
| 3 | Low shed roof (street arcade) | `dark-slate` palette shed falling east, dark_oak fascia, slab flashing at x33/34 | S x34..41 | 3 roofs | shed_roof |
| 4 | Market stalls with produce | top `dark_oak_slab` counter on `dark_oak_planks` base x37..39; crates = `barrel` (up) and `dark_oak_trapdoor` lids; melon, pumpkin, `hay_block`, `red_wool` apples-heaps, `potted_*` buckets as flowers (`flower_pot` w/ tulips, poppy, cornflower, allium), `flowering_azalea_leaves` bunches, `dried_kelp_block` for fish; each stall a different mix | S z161..279 floor+1; B1 x34..38 | 6 stalls | stall, produce_row |
| 5 | Canvas awnings | `red_wool`/`white_wool` alternating per cell at x41, one below fascia, y floor+4; `*_stairs` valance scallop optional | S x41; A x34 over head beam | 4 facades | awning |
| 6 | Hanging lamps | `chain` + `lantern hanging=true`, one per bay at x39 y floor+4 (under beam; chain from beam) | S/B1/A/D bays | 6 stalls | hang_lamp |
| 7 | Hand-painted wooden signs | `dark_oak_hanging_sign` on `dark_oak_fence` bracket at post, text via `signboard(..., mode:"hanging")` (FRESH PRODUCE, FLOWERS, FISH, HONEY, BAKERY, CRAFTS) | S x41 every 3rd bay y floor+3 | 4 facades | stall_sign |
| 8 | Upper market building, white brick | `quartz_bricks` walls, `smooth_quartz` pilasters x34 every 3rd pier, string course slab y34, cornice stairs upside-down y39/31 | C, B2, D | 1 shell-south / 4 | pier_bay, cornice |
| 9 | Multi-pane windows with glow | 4x3 `glass_pane` panes divided by `dark_oak_trapdoor` open muntin column in middle; sill `smooth_quartz_slab`(top)/lintel `smooth_quartz_stairs` upside-down; `ochre_froglight` one cell behind | per OPENINGS | 4 facades | window_bay |
| 10 | Shopfront doors + glazed panes behind arcade | x33 `dark_oak_door` pairs every 2nd bay; panes y23..25 | C, B2 east | 4 | shop_door |
| 11 | Down Under tiers over the bay | `stone_bricks` w/ cracked/mossy 1 in 10 near ground; `cobbled_deepslate` plinth; upside-down `stone_brick_stairs` string course y7,12,17; 3x2 windows w/ glow; arched doors | west faces | 1 / 4 | du_window, du_course |
| 12 | West terraces | `smooth_stone` deck y22/23, `stone_brick_wall` parapet y23/24 | T | 1 | terrace_edge |
| 13 | North Arcade open shed | posts x33 AND x29 wall; slate gable roof, dark oak verge, ridge `stone_brick_slab`; craft tables | A x28..34 z0..132 | 2,3,6 | post_bay, craft_table |
| 14 | Craft-stall tables | `dark_oak_trapdoor`/`spruce_slab` top on `dark_oak_fence` legs, rows of 2, with `flower_pot`, `candle`, `decorated_pot` wares | x30..32 y20 z2..130 | 6 | craft_table |
| 15 | PUBLIC MARKET CENTER neon sign | frame `white_concrete` rails y47 & y70, `iron_bars` lattice legs x38 z281,289,297,305 y43..47; board plane `white_concrete` x38 y48..69; letters via `plaque(face:"east")` in `red_stained_glass` at x39, `glowstone` behind at x38, back skin x37; red neon outline `redstone_lamp` lit=true behind a `red_stained_glass` border | x37..39 y43..70 z279..310 | 5 | neon_sign |
| 16 | Round clock (E + S faces) | `clock(g,{radius:3})`: `white_concrete` dial, `red_concrete` ring (neon: `red_stained_glass` over `glowstone` ring cells), `black_concrete` hands 10:10; "PUBLIC MARKET" banner letters (bannerWord) above dial, quartz surround | E x41 y35..41 z302..308; S z311 y35..41 x33..39 | 5 | market_clock |
| 17 | MEET THE PRODUCER board | `dark_oak_planks` board, `bannerWord` white on brown; frame `dark_oak_stairs` | x41 y42..45 z281..299 | 5 | producer_board |
| 18 | Pike Place Fish ice beds | `packed_ice` bed 1 high on `dark_oak_planks` trough x35..40 y24..25 z296..309; fish = `dried_kelp_block`, fish shapes in `red_wool`, `pink_wool`, `light_gray_wool`, `orange_wool` rows (never sand, gravel or powder); lobster `red_concrete`; `lantern` above, scale `iron_bars` rack | corner D | 5 | ice_bed |
| 19 | Corner entrance | open arcade storey: posts x34 & x41 at z311; `smooth_quartz` quoins paired 2-on/2-off x41 z280,311 | D | 2 / 4 | quoins |
| 20 | Dark brick chimney stacks | `bricks` 2x2, `stone_brick_slab` cap, 3 above ridge, passes through roof (keep) | (23..24,214..215),(23..24,254..255),(27..28,174..175) | 3 | stack |
| 21 | Flat parapet corner roof | `smooth_stone` deck y42, `smooth_quartz` parapet y43 + slab coping, stepped north gable `quartz_bricks` to y45 | D | 3 | parapet |
| 22 | Dusk lighting | `ochre_froglight` behind glass, hung lanterns each bay, `redstone_lamp` lit signs, `glowstone` neon; `lantern` on posts of A every 3rd bay | everywhere | 6 | hang_lamp |
| 23 | Street surface | `polished_andesite` arcade floor w/ `smooth_stone` edge; slab ramps at floor changes (z132/133, 188/189, 279/280) | S, B1, A | 2 | ramp |
| 24 | Planters and flower buckets | `barrel` w/ `potted_*`... buckets: `cauldron` + flowers above on posts; `flower_pot` rows | post bases | 6 | flower_bucket |
```

### rooms.json

```json
{"entrance":[41,23,285],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{"roles":{"white_brick":["quartz_bricks"],"trim":["smooth_quartz","smooth_quartz_stairs","smooth_quartz_slab"],"down_under":["stone_bricks","cracked_stone_bricks","mossy_stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall"],"plinth":["cobbled_deepslate","cobbled_deepslate_stairs"],"posts":["green_concrete"],"timber":["dark_oak_planks","dark_oak_stairs","dark_oak_slab","dark_oak_fence","dark_oak_trapdoor","dark_oak_door","stripped_dark_oak_log"],"awning":["red_wool","white_wool"],"roofs":["deepslate_tiles","deepslate_tile_stairs","deepslate_tile_slab","stone_brick_slab"],"deck":["smooth_stone","smooth_stone_slab","polished_andesite","polished_andesite_slab"],"glass":["glass_pane","ochre_froglight"],"chimney":["bricks","stone_brick_slab"],"Upper walls and sign frame":["white_concrete","calcite"],"Foundation, piers and stepped base":["stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall"],"Roofs and eaves":["deepslate_tiles","deepslate_tile_stairs","deepslate_tile_slab"],"Wood trim, counters, tables and crates":["dark_oak_planks","dark_oak_stairs","dark_oak_slab","dark_oak_fence","dark_oak_trapdoor","dark_oak_sign"],"Green posts and window trim":["green_terracotta"],"Windows":["glass_pane"],"Striped awnings":["white_wool","green_wool","red_wool"],"Neon sign and clock":["red_concrete","red_stained_glass","glowstone","white_concrete","black_concrete"],"Lighting":["lantern","glowstone"],"Stall storage and produce":["barrel","chest","melon","pumpkin","red_concrete"],"Flowers and trailing greenery":["flower_pot","poppy","dandelion","cornflower","oxeye_daisy","vine"],"Fish counters":["blue_ice","snow_block","gray_concrete","orange_concrete","item_frame"]},"objects":["white_concrete","iron_bars","red_stained_glass","red_stained_glass_pane","glowstone","redstone_lamp","red_concrete","black_concrete","packed_ice","dried_kelp_block","red_wool","pink_wool","light_gray_wool","orange_wool","barrel","melon","pumpkin","hay_block","yellow_wool","green_wool","flowering_azalea_leaves","moss_block","flower_pot","potted_red_tulip","potted_poppy","potted_cornflower","potted_allium","potted_orange_tulip","cauldron","composter","candle","lantern","chain","dark_oak_hanging_sign","dark_oak_wall_sign","red_banner","white_banner","brown_banner"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which is moved into place only if the build succeeds.
set -e
cd "$(dirname "$0")"
node build.mjs ./build.tmp.nbt
mv ./build.tmp.nbt build.nbt
```

### build.mjs

```js
// Builds the whole Pike Place Main Arcade and North Arcade (plot 0): the ground, then every part in order, into the path given as argv[2].
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, FOOTPRINT, groundY, COBBLED_DEEPSLATE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// the parts in plan.md's order; the roof (roof.json) is laid right after the first one
const PARTS = [
  ["South shell: Down Under, main building, corner block", "parts/shell-south.mjs"],
  ["North shell, shed frame, arcade floor", "parts/shell-north.mjs"],
  ["Roofs and chimneys", "parts/roofs.mjs"],
  ["Facades: windows, doors, trim, awnings, lamps", "parts/facades.mjs"],
  ["Corner landmarks: neon sign, clocks, board, fish market", "parts/landmarks.mjs"],
  ["Stalls, craft tables, flower buckets, dusk props", "parts/stalls.mjs"],
];
// a part whose file is not there yet builds nothing, so the build never fails on a missing part
const load = async (file) => (existsSync(file) ? import(`./${file}`) : { build() {} });
const mods = await Promise.all(PARTS.map(([, file]) => load(file)));

// the server is 1.21.1 (DataVersion 3955): every id in the palette is a 1.21.1 block
const g = new Grid([SITE.x, SITE.y, SITE.z], { dataVersion: DATA_VERSIONS["1.21.1"] });
// the ground: each footprint column solid up to its ground y (groundY is a placeholder until the GROUND map arrives)
for (const [z0, z1, x0, x1] of FOOTPRINT)
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) g.fill([x, 0, z], [x, groundY(x, z), z], COBBLED_DEEPSLATE);

runParts(g, PARTS.map(([name], i) => [name, mods[i].build]), { palette: "palette.json", roof: "roof.json" });
g.save(out);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette ids (palette.json only), site coordinates from plan.md, and a seeded rng.

// ---- palette (palette.json ids only; the comment names the palette role) -----------------------------------------

// ---- palette (palette.json ids only; the comment names the palette role) -----------------------------------------
export const QUARTZ_BRICKS = "quartz_bricks"; // white_brick

export const SMOOTH_QUARTZ = "smooth_quartz"; // trim

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs"; // trim

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // trim

export const STONE_BRICKS = "stone_bricks"; // down_under

export const CRACKED_STONE_BRICKS = "cracked_stone_bricks"; // down_under

export const MOSSY_STONE_BRICKS = "mossy_stone_bricks"; // down_under

export const STONE_BRICK_STAIRS = "stone_brick_stairs"; // down_under

export const STONE_BRICK_SLAB = "stone_brick_slab"; // down_under

export const STONE_BRICK_WALL = "stone_brick_wall"; // down_under

export const COBBLED_DEEPSLATE = "cobbled_deepslate"; // plinth

export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs"; // plinth

export const GREEN_CONCRETE = "green_concrete"; // posts

export const DARK_OAK_PLANKS = "dark_oak_planks"; // timber

export const DARK_OAK_STAIRS = "dark_oak_stairs"; // timber

export const DARK_OAK_SLAB = "dark_oak_slab"; // timber

export const DARK_OAK_FENCE = "dark_oak_fence"; // timber

export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor"; // timber

export const DARK_OAK_DOOR = "dark_oak_door"; // timber

export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log"; // timber

export const RED_WOOL = "red_wool"; // awning

export const WHITE_WOOL = "white_wool"; // awning

export const DEEPSLATE_TILES = "deepslate_tiles"; // roofs

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs"; // roofs

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab"; // roofs

export const SMOOTH_STONE = "smooth_stone"; // deck

export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // deck

export const POLISHED_ANDESITE = "polished_andesite"; // deck

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab"; // deck

export const GLASS_PANE = "glass_pane"; // glass

export const OCHRE_FROGLIGHT = "ochre_froglight"; // glass

export const BRICKS = "bricks"; // chimney

export const WHITE_CONCRETE = "white_concrete"; // objects

export const IRON_BARS = "iron_bars"; // objects

export const RED_STAINED_GLASS = "red_stained_glass"; // objects

export const RED_STAINED_GLASS_PANE = "red_stained_glass_pane"; // objects

export const GLOWSTONE = "glowstone"; // objects

export const REDSTONE_LAMP = "redstone_lamp"; // objects

export const RED_CONCRETE = "red_concrete"; // objects

export const BLACK_CONCRETE = "black_concrete"; // objects

export const PACKED_ICE = "packed_ice"; // objects

export const DRIED_KELP_BLOCK = "dried_kelp_block"; // objects

export const PINK_WOOL = "pink_wool"; // objects

export const LIGHT_GRAY_WOOL = "light_gray_wool"; // objects

export const ORANGE_WOOL = "orange_wool"; // objects

export const BARREL = "barrel"; // objects

export const MELON = "melon"; // objects

export const PUMPKIN = "pumpkin"; // objects

export const HAY_BLOCK = "hay_block"; // objects

export const YELLOW_WOOL = "yellow_wool"; // objects

export const GREEN_WOOL = "green_wool"; // objects

export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves"; // objects

export const MOSS_BLOCK = "moss_block"; // objects

export const FLOWER_POT = "flower_pot"; // objects

export const POTTED_RED_TULIP = "potted_red_tulip"; // objects

export const POTTED_POPPY = "potted_poppy"; // objects

export const POTTED_CORNFLOWER = "potted_cornflower"; // objects

export const POTTED_ALLIUM = "potted_allium"; // objects

export const POTTED_ORANGE_TULIP = "potted_orange_tulip"; // objects

export const CAULDRON = "cauldron"; // objects

export const COMPOSTER = "composter"; // objects

export const CANDLE = "candle"; // objects

export const LANTERN = "lantern"; // objects

export const CHAIN = "chain"; // objects

export const DARK_OAK_HANGING_SIGN = "dark_oak_hanging_sign"; // objects

export const DARK_OAK_WALL_SIGN = "dark_oak_wall_sign"; // objects

export const RED_BANNER = "red_banner"; // objects

export const WHITE_BANNER = "white_banner"; // objects

export const BROWN_BANNER = "brown_banner"; // objects

// ---- site (plan.md SITE, FOOTPRINT, MASSES, FLOORS, ROOMS; y 0 = the lowest ground) ------------------------------
/** Plot 0 in cells: x 0..42, y 0..82, z 0..311. Column x 42 is never built (outside the footprint). */
export const SITE = { x: 43, y: 83, z: 312 };

/** The footprint, one row per z band: [z0, z1, x0, x1] inclusive (plan.md footprint table). */
export const FOOTPRINT = [[0, 132, 28, 34], [133, 160, 28, 41], [161, 188, 21, 41], [189, 223, 14, 41], [224, 251, 7, 41], [252, 307, 0, 41], [308, 311, 7, 41]];

/** True when (x, z) is a footprint cell: the only columns a part may build in. */
export const inFootprint = (x, z) => ...

/** Ground top y of column (x, z). PLACEHOLDER: plan.md names a GROUND map per 7x7 cell but gives no values; this is a
 *  linear fit to its two stated edges (y 4 at x 0, y 20..23 at the street x 41). Replace with the real per-cell map. */
export const groundY = (x, z) => ...

/** Masses as [x0, y0, z0, x1, y1, z1] inclusive (plan.md masses table). S's floor is 20 (z 161..188) or 22 (z 189..279). */
export const MASSES = {
  A: [28, 19, 0, 34, 28, 132], B1: [28, 20, 133, 41, 31, 160], B2: [21, 20, 161, 33, 36, 188],
  C: [14, 22, 189, 33, 45, 279], S: [34, 20, 161, 41, 29, 279], D: [14, 23, 280, 41, 43, 311],
  SG: [37, 43, 279, 39, 70, 310], MP: [41, 42, 281, 41, 45, 299],
};

/** Floor block y per mass (plan.md FLOORS). A person stands at floor + 1. */
export const FLOORS = { A: [19], B1: [20], B2: [20, 26], C: [22, 28, 34], D: [23, 29, 35], S_NORTH: [20], S_MAIN: [22] };

/** Down Under level floors; the walk is at f + 1 and each level is 5 tall (plan.md DU). */
export const DU_LEVELS = [2, 7, 12, 17];

/** Eave, wall-top, deck and parapet lines (plan.md ROOFS and FACADES). */
export const HEIGHTS = { B2_WALL_TOP: 31, B2_EAVE: 32, C_WALL_TOP: 39, C_EAVE: 40, D_WALL_TOP: 41, DECK_Y: 42, PARAPET_Y: 43, R_C_RIDGE: 45 };

/** Aisle slab-ramp lines where the street floor steps: [z before, z after]; the ramp sits at x 34..39. */
export const RAMP_Z = [[132, 133], [188, 189], [279, 280]];

/** Aisle columns that stay clear of counters, stalls and posts. */
export const AISLE_X = { x0: 34, x1: 36 };

/** Chimney stack corners (2x2, x and z of the low corner) on the roof keep cells; R-C twice, R-B2 once. */
export const STACKS = [[23, 214], [23, 254], [27, 174]];

/** The PUBLIC MARKET CENTER sign SG: letters at x 39, board y 48..69, legs at x 38 on these z (plan.md SG). */
export const SIGN = { x0: 37, x1: 39, y0: 43, y1: 70, z0: 279, z1: 310, legZ: [281, 289, 297, 305] };

/** Market clocks: east face at x 41 (y 35..41, z 302..308); south face at z 311 (y 35..41, x 33..39). */
export const CLOCK = { east: { x: 41, y0: 35, y1: 41, z0: 302, z1: 308 }, south: { z: 311, y0: 35, y1: 41, x0: 33, x1: 39 } };

/** MEET THE PRODUCER board: x 41, y 42..45, z 281..299 (raised parapet). */
export const PRODUCER_BOARD = { x: 41, y0: 42, y1: 45, z0: 281, z1: 299 };

/** Fish ice beds: x 35..40, z 296..309; trough y 24, ice y 25 (plan.md RESERVED). */
export const ICE_BED = { x0: 35, x1: 40, z0: 296, z1: 309 };

/** The main entrance (inside the open arcade storey of D) and the street point just outside the plot (plan.md ROOMS). */
export const ENTRANCE = { door: [41, 23, 285], street: [43, 23, 285] };

/** A seeded random source: rng(seed)() gives the next float in [0, 1). */
export function rng(seed)
```

### vocab/h1.mjs

```js
// H1 vocabulary (plan.md VOCABULARY): post_bay, stall, stall_sign, cornice, du_window, quoins, stack, market_clock.
// Every helper takes its own position (and facing) as arguments, writes only the cells it computes, only into air
// (ground, walls and earlier parts are left alone), and returns how many blocks it placed.
// Stairs `facing` = the side of the full-height back, so a bracket or cornice faces INTO the wall it sits on.
// 1.21.1 ids: `chain`, not `iron_chain` (B.chain defaults to the newer name, so it is not used here).

/**
 * One arcade post: green_concrete column y0..y0+h-1, two upside-down dark_oak_stairs brackets either side along z at
 * beamY-1 (lips point away from the post), dark_oak_planks beam at beamY over beamZ = [z0, z1] (default: this post).
 * The footing is not written (the ground belongs to an earlier part).
 */
export function post_bay(g, { x, z, y0, h, beamY, beamZ = [z, z] })

/**
 * Market counter x0..x1 by z0..z1: dark_oak_planks base at y, the front column x1 a top dark_oak_slab lip at y+1,
 * goods on the other columns at y+1 (caps at y+2). kind: produce | flowers | fish | honey | crates.
 */
export function stall(g, { x0, x1, z0, z1, y, kind })

/**
 * Hand-painted hanging sign: dark_oak_fence bracket at (x, y+1, z) under the beam at (x, y+2, z), dark_oak_hanging_sign
 * at (x, y, z) reading toward `face`. text: lines split on "\n" or "|" (up to 4). Returns 0 if nothing is above it.
 */
export function stall_sign(g, { x, y, z, text, face = "east" })

/**
 * Cornice along z on an east or west face at plane x: smooth_quartz_stairs (half top, facing into the wall) at y over
 * z0..z1, with a smooth_quartz_slab (top) course under it at y-1. Proud of the wall by one, so x is the outer column.
 */
export function cornice(g, { x, y, z0, z1, face })

/**
 * Down Under window on the wall plane `at` of an outward `face` (west, east, north or south). Panes (3 wide, 2 tall,
 * y f+2..f+3) in the 6-bay starting at `start` along the face; stone_brick sill and lintel proud of the wall;
 * one ochre_froglight behind each pane column. Writes nothing (returns 0) where f+1 <= ground: the window is underground.
 */
export function du_window(g, { at, face, f, start, ground = -Infinity })

/** Corner quoins: smooth_quartz at column (x, z) in pairs, 2 on then 2 off, from y0 up to y1. */
export function quoins(g, { x, z, y0, y1 })

/**
 * Dummy chimney (no flue): 2x2 bricks from y0 to ridgeY+3, a stone_bricks band at ridgeY+1, a 4x4 stone_brick_slab cap
 * stepped out at ridgeY+4. Pass through: true when the stack must pass through a roof already laid (the cap stays air-only).
 */
export function stack(g, { x, z, y0, ridgeY, through = false })

/**
 * Round clock on the wall plane through `center` (the dial's middle cell), seen from outside `face` (east, west, south,
 * north). Radius R: white_concrete dial, red_concrete bezel ring (red_stained_glass with glowstone one cell in when neon,
 * the glow written into the wall on purpose), black_concrete marks at 12/3/6/9 and hands at 10:10.
 * The square surround and the PUBLIC MARKET banner lie outside the reserved box and are not written.
 */
export function market_clock(g, { center: [cx, cy, cz], face, radius: R = 3, neon = false })
```

### vocab/h2.mjs

```js
// h2 vocabulary (plan.md VOCABULARY): awning, produce_row, window_bay, string_course, du_course, ramp, parapet, producer_board.
// Every helper takes the grid first and its position as arguments. It writes only inside the footprint it returns, only
// into air (replace: true overwrites), and never below its footprint: the ground and floors belong to earlier parts.
// Blocks are [id, state] pairs from the build library's B helpers (1.21.1 states).

// A valance of wool on one plane (x), along z from z0 to z1: red and white alternate per cell. scallop: a closed
// trapdoor hangs under every second (white) cell, leaving the rest open.
export function awning(g, { x, y, z0, z1, scallop = false, face = "east", replace = false })

// Goods on a counter run along z at column x and height y (the goods layer), z0..z1. Every 4th cell is a barrel crate
// (facing up) with a closed trapdoor lid on it at y+1; the rest cycle through block (an id or a list of ids).
// Fits the smallest ROOMS box that holds it with 2 clear cells above, and never enters that room's lane.
export function produce_row(g, { x, y, z0, z1, block = ["melon", "pumpkin", "hay_block", "red_wool", "green_wool"], replace = false })

// A 4 x 3 (w x h) window on a wall face: glass panes with a dark oak trapdoor muntin (open, in the middle column), a
// quartz slab sill 1 proud below, a quartz stair lintel 1 proud above (lip out, back into the wall), and an
// ochre_froglight one cell inside the glass behind every pane column. start = the first along-wall cell; the wall
// plane is x (east/west face) or z (north/south face).
export function window_bay(g, { face, x, z, start, y, w = 4, h = 3, glow = true, replace = false })

// A one-block-proud course along a wall face at height y, from..to along the wall (plane x or z): a bottom slab.
export function string_course(g, { face, x, z, from, to, y, replace = false })

// The Down Under course: upside-down stone brick stairs (lip out, back into the wall), 1 proud, along the face at y.
export function du_course(g, { face, x, z, from, to, y, replace = false })

// A half-step slab ramp in the aisle: from the floor block at y = from up to the floor block at from + rise, climbing
// along z from z (the lower end) in direction dir (+1 or -1), across x0..x1 (at least 3 wide). Each half step is a
// polished_andesite_slab on odd levels, with full polished_andesite below it; runs of 3 half steps, then a level
// landing of 2 cells. The upper floor's own cell is not written.
export function ramp(g, { x0, x1, z, from, rise = 1, dir = 1, replace = false })

// The roof parapet: a smooth_quartz wall on the rectangle's edge at y, a smooth_quartz_slab coping (top) at y+1.
// skip: boxes [[x0,y0,z0],[x1,y1,z1]] whose cells are left out (the MEET THE PRODUCER board).
export function parapet(g, { x0, z0, x1, z1, y = 43, skip = [], replace = false })

// The MEET THE PRODUCER board: a dark oak planks panel on the plane x (facing east), z0..z1 by y0..y1, with a
// dark oak stair lip on top (lip out, back into the board). The lettering is not placed: plaque's banner-style letters
// hang on the wall in front of the board, at x 42, which is off-plot, so they are reported in notes instead.
export function producer_board(g, { x = 41, y0 = 42, y1 = 45, z0 = 281, z1 = 299, replace = false })
```

### vocab/h3.mjs

```js
// Vocabulary helpers from plan.md VOCABULARY: hang_lamp, flower_bucket, pier_bay, shop_door, terrace_edge,
// craft_table, neon_sign, ice_bed. Each takes the grid first, then its position (and face, where it has one) as
// arguments, and writes only its own footprint. Writes go into air only: a built cell is refused and listed, never
// overwritten. Pieces that read as one object (lamp, table, door, sign, bed) are all-or-nothing; walls and decks run
// cell by cell. Returns { placed, refused: [[x, y, z, block]] }. Leaves are persistent=true, as on 1.21.1.

/** Hanging lantern: chain at y+1 from the built block at y+2 (the beam), lantern hanging at y. Refused if y+2 is air. */
export function hang_lamp(g, { x, y, z })

/** Cauldron at (x, y, z) with a persistent azalea bunch on top at y+1. Stands against a post base. */
export function flower_bucket(g, { x, y, z })

/** The 2-wide pier between windows on a wall at x = `x` (face east or west), cells z0..z0+1, y0..y1, in quartz_bricks.
 *  pilaster: a smooth_quartz pilaster 1 proud on its first column (z0), capped by an upper stair; the caller picks
 *  every third pier. */
export function pier_bay(g, { face, x, z0, y0, y1, pilaster = false })

/** Shop door pair in a wall at x (face east or west): two dark_oak_door leaves at z and z+1 (hinges left and right,
 *  lower and upper halves), glass sidelights at z-1 and z+2, a glass transom at y+2, and a smooth_quartz_stairs lintel
 *  at y+3 projecting one out from the wall. Needs the opening (y..y+2, z-1..z+2) to be air; all-or-nothing. */
export function shop_door(g, { x, y, z, face = "east" })

/** Terrace deck (smooth_stone) over x0..x1, z0..z1 at y, with a stone_brick_wall parapet on its `edge`
 *  (west | east | north | south) at y+1. planters: barrels at y+1 with azalea bunches at y+2, one step in from the
 *  edge every 4 cells along it. */
export function terrace_edge(g, { x0, x1, z0, z1, y, edge, planters = true })

/** Two-deep craft table, 3 wide: dark_oak_fence legs at the corners from y, a top dark_oak_slab (type top) at y+1 over
 *  x0..x0+2, z..z+1, and wares on the top face at y+2 (pots, a decorated pot, a lit candle). Footprint x0..x0+2,
 *  y..y+2, z..z+1; the z+2 row stays clear as the lane between pairs. */
export function craft_table(g, { x0, z, y })

/** PUBLIC MARKET CENTER neon sign on a roof deck, facing east. Back skin at x, board x..x+2 over y+5..y+26 and z0..z1,
 *  letters on the face x+2 (plaque, red_stained_glass, read left to right toward -z), glowstone behind each letter at
 *  x+1, a red neon border one cell in from the board edge with lit redstone_lamps behind it. Legs are iron_bars at x+1
 *  every 8 cells along z from z0+2, y..y+3; rails of white_concrete at y+4 and y+27; finials on the legs at y+28.
 *  The frame and board are all-or-nothing; the letters go on the board they were drawn on. */
export function neon_sign(g, { x, y, z0, z1 })

/** Fish-market ice bed: dark_oak_planks trough at y over x0..x1, z0..z1, packed_ice at y+1, and fish / kelp / lobster
 *  pieces on the ice at y+2 in a diagonal pattern (wool fish, dried_kelp_block, red_concrete lobster). A standing lantern
 *  on each corner. All-or-nothing. */
export function ice_bed(g, { x0, x1, z0, z1, y })
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
