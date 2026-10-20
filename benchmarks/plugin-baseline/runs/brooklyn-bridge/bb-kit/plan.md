# Brooklyn Bridge kit: architect's plan (form, exact)

Frame: bridge along z (Manhattan low z, Brooklyn high z), east = +x. y0 = river surface: nothing built at y0 matters; no ground course. All coords are each plot's LOCAL coords (x0 = plot's west edge). Exterior only. No villagers, no torches (lanterns only).

## SITE

| Plot | Module | Local box | Max y |
|---|---|---|---|
| 0 | Tower (both towers) | x0..33, z0..19 | 62 |
| 1 | Deck section (repeat along z) | x0..17, z0..15 | 36 |
| 2 | Main-span cables (half span, placed twice) | x0..17, z0..159 | 58 |
| 3 | Side-span cables (placed twice) | x0..17, z0..175 | 58 |
| 4 | Anchorage (both ends) | x0..33, z0..29 | 30 |
| 5 | Approach section (repeat along z) | x0..17, z0..15 | 22 (see blocker B2) |

### Plot 0: tower masses
| Mass | x | y | z |
|---|---|---|---|
| Caisson (rough granite) | 0..33 | 1..3 | 0..19 |
| Base stage (solid) | 2..31 | 4..26 | 3..16 |
| Arch stage | 2..31 | 27..48 | 4..15 |
| Top stage | 2..31 | 49..54 | 5..14 |
| Cornice (projects 1) | 1..32 | 55..57 | 4..15 |
| Roof slab (top face y57, walk at y58) | 2..31 | 57 | 5..14 |
| Parapet (low, 1 high) | ring of x2..31 / z5..14 | 58 | |
| Saddle housings (4) | 7..9, 13..15, 18..20, 24..26 | 58 (+slab y59 on centre x) | 6..13 |
| Overlook pedestals (masonry) | 14..19 | 27..29 | 3 and 16 |
| Promenade lane pedestals | 14 and 19 | 27..29 | 4..15 |
z0..2 and z17..19 stay EMPTY above y3, except the four cables.

Arch openings, through the full depth z4..15 (arch A; arch B = same with x+11, so A x8..14, B x19..25):
| y | open x (A) |
|---|---|
| 27..42 | 8..14 |
| 43..44 | 9..13 |
| 45..46 | 10..12 |
| 47..48 | 11 (crown) |
Piers: outer x2..7 and x26..31, central x15..18.

Deck through the tower (z3..16): road surface y27 on x9..13 and x20..24 (laid on the solid base), curbs x8 and x25 y27..28. Promenade boards at y30: overlooks x13..20 on z3 and on z16; lanes x13..14 and x19..20 on z4..15 (x13/x20 cantilever over the curb lane on upside-down spruce stair brackets at y29). Railings y31 on x13 and x20, z3..16. Walk cells: x14 and x19 (y31), overlooks x14..19 on z3/z16.

Main cables (one block, smooth quartz) on x8, 14, 19, 25, by z:
| z | 0 | 1 | 2 | 3 | 4 | 5..14 | 15 | 16 | 17 | 18 | 19 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| cable y | 54 | 54 | 55 | 55 | 56 | 57 (saddle, in the roof slab) | 56 | 55 | 55 | 54 | 54 |
Bottom smooth-quartz slab above the cable at z1, z3 (y55, y56) and at z16, z18 to soften the steps. At z4/z15 the cable takes the cornice cell (it comes out through the cornice). The parapet has a gap at the cable x on z5/z14.

### Plot 1: deck section (x0..17 = the shared cross-section, z0..15, y22..36)
| Element | x | y | z |
|---|---|---|---|
| Trusses (4) | 0, 6, 11, 17 | 22 bottom chord, 29 top chord, lattice 23..28 | all |
| Lattice cells | the 4 truss lines | 23..28 where (z−y) mod 8 = 0 or (z+y) mod 8 = 0 | (period 8, seamless) |
| Suspender anchors (top chord cell) | 0, 6, 11, 17 | 29 | 0,3,6,9,12,15 |
| Floor beams (transverse) | 0..17 | 25..26 | 1, 5, 9, 13 |
| Bottom struts | 0..17 | 22 | 1, 9 |
| Stringers (along z) | 2, 4, 13, 15 | 26 | all |
| Road surface | 1..5, 12..16 | 27 | all |
| Lane dashes (in the road surface) | 3, 14 | 27 | 0..2, 8..10 |
| Promenade cross girders | 7..10 | 29 | 1, 5, 9, 13 |
| Promenade boards | 7..10 | 30 | all |
| Railings | 7, 10 | 31 | all (walk x8..9) |
| Lamp posts | 7, 10 | posts 31..33, lantern 34 | 8 |
| Road lamps (on the outer chord) | 0, 17 | lantern 30 | 8 |
Middle bay x7..10 under y29 open (the old rail bay). Cars at y28 are not built.

### Plot 2: main-span cables (x0..17, z0..159). Cables, suspenders and stays ONLY.
- Main cables on x0, 6, 11, 17: u = z+0.5, y = 33 + 24(u/170)^2. Block at floor(y); add a bottom smooth-quartz slab at floor(y)+1 where frac(y) ≥ 0.5. The slope never passes 1 per z, so this is 8-connected. Cable bands: at z ≡ 0 (mod 6) the cable block is light grey concrete.
- Suspenders: z = 0, 3, 6, ... 159 on all four lines, a diorite wall column from y29 up to floor(y)−1 (touching the cable).
- Stays: 16 per cable plane. Stay i (i = 0..15) runs from (z159, ys) to (z153−6i, y29), with ys = 50,50,51,51,51,52,52,52,53,53,53,54,54,54,55,55. The longest stay (to z63) starts highest. Rasterize a straight line along its major axis, one cell per step (8-connected); diorite wall. Where it meets a cable block, the cable wins.

### Plot 3: side-span cables (x0..17, z0..175). Cables, suspenders and stays ONLY.
- Cables on x0, 6, 11, 17: t = (z+11)/186.5, y = 57 − 33t − 16t(1−t), rounded and slabbed as in plot 2, bands every 6.
- Truss top T(z): 0..15 → 29; 16..31 → 28; 32..63 → 27; 64..79 → 26; 80..111 → 25; 112..143 → 24; 144..159 → 23; 160..175 → 22.
- Suspenders at z = 0, 3, ... 174: diorite wall from T(z) up to the cable minus 1.
- Stays: 12 per plane, from (z0, ys) to (z = 6k, T(6k)) for k = 1..12, with ys = 50,50,51,51,52,52,53,53,54,54,55,55. Landing y: 29,29,28,28,28,27,27,27,27,27,26,26.

### Plot 4: anchorage masses
| Mass | x | y | z |
|---|---|---|---|
| Plinth (battered foot) | 2..31 | 0..6 | 2..29 |
| Water table (stairs stepping in) | ring x2/x31/z2 | 7 | |
| Body (faces set back 1) | 3..30 | 8..16 | 3..29 (z29 joins the approach, full x2..31) |
| Corbel course | x2, x31, z2 | 17 | |
| Cornice | 2..31 | 18..19 | 2..29 |
| Bridge-face buttresses (4) | 6..8, 14..15, 18..19, 25..27 | 1..19 | 0..1 |
| Road shelf between buttresses (corbels at y17) | 8..25 | 18..19 | 0..1 |
| Parapets (solid, 2 high) | 2..7 and 26..31 | 20..21 | 0..29 (z0..1 only on buttress cells) |
| Road surface | 9..13, 20..24 | 20 | 0..29 |
| Curbs (cable lines) | 8, 14, 19, 25 | 20..21 | 4..29 |
| Promenade base (masonry) | 15..18 | 20..22 | 4..29 |
| Promenade boards / railings | 15..18 / 15 and 18 | 23 / 24 | 4..29 (walk x16..17) |
| Cable housings, outer | 6..8, 25..27 | 20..25 | 0..3 |
| Cable housings, inner | 14..15, 18..19 | 20..25 | 0..3 (see B1) |
| Promenade between the inner housings | 16..17 base y20..22, boards 23 | | 0..3 |
Cable ends: at x8, 14, 19, 25, y24, z0, the housing cell is smooth quartz (the cable going in). Housing tops: polished andesite slab course at y25.

### Plot 5: approach section (x0..17, z0..15)
| Mass | x | y | z |
|---|---|---|---|
| Plinth | 0..17 | 1..3 | all |
| Walls (face planes x1, x16) and core | 1..16 | 4..15 | all |
| Corbel course | 0, 17 | 16 | all |
| Cornice | 0, 17 | 17..19 | all |
| Core under the road | 0..17 | 16..19 | all |
| Pilaster strips (rusticated, proud) | 0, 17 | 4..15 | 0 and 15 |
| Parapets | 0, 17 | 20..21 | all |
| Road surface | 1..5, 12..16 | 20 | all |
| Curbs | 6, 11 | 20..21 | all |
| Promenade base | 7..10 | 20..22 | all |
| Boards / railings | 7..10 / 7, 10 | 23 / 24 | all |
| Lamp posts | 7, 10 | posts 24..25, lantern 26 | 8 |
Vault, open x0..17, round arch: y1..9 z3..12; y10 z4..11; y11 z5..10; y12 z6..9.

## ROOFS
No pitched roofs anywhere, so no `$MCD roof` preset applies (none fits a bridge). The tower has a flat masonry top (slab y57, walk y58) behind a 1-high parapet at y58, built by hand with the shell. The anchorage and the approach are road-topped. Every top is hand-built in the masonry part.

## FACADES
The towers' river faces (x2, x31) and their bridge faces (z) carry the identity. Hierarchy, bottom to top:
- **Caisson y1..3:** rough granite: cobblestone and andesite, mossy cobblestone ≤1 in 10 at y1..2, polished andesite top course y3.
- **Base stage y4..26:** a plinth y4..6 in polished andesite; the body in stone bricks (about 6% cracked; mossy only at y4..9). Rusticated quoins at all four corners: polished andesite, 2 courses long (2 cells along each face) and 2 short (1 cell). A string course at y26: smooth sandstone, the full ring, so its top makes the ledge at z3/z16.
- **Arch stage y27..48 (faces z4/z15, x2/x31):**
  - Recessed order R1 (air at z4 and z15, 1 deep) around each arch: y27..42 on x7 and x15 (A; B x18, x26); y43..44 x8, x14; y45..46 x9, x13; y47..48 x10, x12.
  - The cells behind R1 at z5/z14 are smooth sandstone (the limestone inner arch ring), and the opening's edge cells use upside-down stone-brick stairs.
  - Voussoir ring R2 in polished andesite at z4/z15, just outside R1.
  - Hood mould: smooth sandstone stairs, upside-down, facing out, at z3 (and z16), 1 proud: y41..42 x6, x16; y43..44 x7, x15; y45..46 x8, x14; y47..48 x9, x13; a gablet of stairs on the ledge at z4 y49, x10..12. B mirrors this at +11, so the two hoods meet over the central pier.
  - Tall Gothic panels, recessed 1 (the face cell left out, backed by tuff bricks): outer piers x4..5, y30..45, with a pointed head at y46 (two upside-down stairs facing each other), and x28..29 the same; central pier x16..17, y35..45, head y46.
  - Bronze-dark tablet: polished blackstone at x16..17, y31..33 on the face cell z4 (and z15), over the overlook.
  - River faces x2/x31: a panel z8..11 y30..45, head y46..47 (stairs at z8, z11 on y46; z9..10 on y47).
  - String course at y48: smooth sandstone ring; its top is the ledge at z4/z15.
- **Top stage y49..54 (faces z5/z14):** slender panels 1 wide, recessed 1, y50..53, at x4, 6, 9, 11, 13, 16, 17, 20, 22, 24, 27, 29. On x2/x31: z7, 9, 10, 12.
- **Cornice y55..57:** a corbel course of upside-down stone-brick stairs at y55 (1 proud); smooth sandstone full blocks at y56 (1 proud); a cap of smooth sandstone stairs at y57. Parapet at y58: stone brick wall.
- **Anchorage:** the plinth in polished andesite courses; the body in stone bricks with rusticated polished-andesite quoins at x3/x30 on z3, the same 2-long/2-short pattern. Three round-arched vaults on each long side, in z5..10, z13..18 and z21..26, recessed 2 (air in x2..4 at y4..6 and x3..4 at y7..15; backed by tuff bricks at x5; mirror x29..31/x28). Arch head: y4..12 the full 6 wide; y13 also 6 wide with upside-down stairs at the edges; y14 inner 4; y15 inner 2. A ring of polished andesite voussoirs on the face, with a smooth sandstone keystone over the crown. The bridge face (z2) is plain rusticated, with the four buttresses proud by 2. Cornice: smooth sandstone. Parapet coping y21: smooth sandstone.
- **Approach:** the same courses: stone-brick walls, polished andesite plinth and voussoirs, smooth sandstone impost band at y9 (only on wall cells z0..2 and z13..15 on x1/x16), keystone at z7..8 y13, cornice y17..19, coping y21.

## MATERIALS (checked with `$MCD blocks --check`)
| Role | Block |
|---|---|
| Masonry body | stone_bricks (variation: cracked_stone_bricks; mossy_stone_bricks low only) |
| Rustication, quoins, voussoirs, plinths, curbs | polished_andesite (+ polished_andesite_stairs/_slab) |
| Limestone trim: string courses, cornice, hoods, inner arch ring, copings | smooth_sandstone (+ smooth_sandstone_stairs/_slab) |
| Panel and vault backs (shadow) | tuff_bricks |
| Corbels, arch-edge stairs | stone_brick_stairs |
| Tower parapet | stone_brick_wall |
| Caisson | cobblestone, andesite, mossy_cobblestone |
| Tablet | polished_blackstone |
| Main cables | smooth_quartz, smooth_quartz_slab, smooth_quartz_stairs |
| Cable bands | light_gray_concrete |
| Suspenders and stays | diorite_wall |
| Truss chords and lattice | smooth_sandstone |
| Floor beams, stringers, struts, girders | smooth_stone |
| Road | gray_concrete; lane dashes light_gray_concrete |
| Promenade boards | spruce_planks; brackets spruce_stairs |
| Railings, lamp posts | dark_oak_fence |
| Lights | lantern |
Avoid `chain` (blocker B3).

## OPENINGS
Tower: arches A and B as tabled, open from z4 to z15. Anchorage: 6 vaults (recesses, not through). Approach: 1 vault, open through x0..17. No doors or windows anywhere.

## RESERVED (later parts add into these cells; the shell leaves them as air)
- Tower lantern niches at y4 (1 cell, cut into the face), at z3: x5, 12, 16, 21, 28; at z16 the same; on x2 and x31: z6, z13. Lantern ledges: y27 at (3,3), (30,3), (3,16), (30,16) as (x,z); y49 on z4/z15 at x3, x16, x17, x30.
- Tower overlook lamps: x13 and x20 at z3 and z16, fence y31..33, lantern y34. Railing lanterns: x13/x20, z9, y32. Top lanterns at y59 on the parapet: (2,5), (31,5), (2,14), (31,14), (16,5), (17,14) as (x,z).
- Tower cable cells: x8/14/19/25 along z0..19 at the heights tabled (no masonry there).
- Deck: lamps at z8; anchor cells as tabled.
- Anchorage: lanterns on the parapet tops at y22, at x4 and x29, z6, 16, 26. Promenade lamps at x15/x18, z12 and z24 (posts y24..25, lantern y26). Vault lanterns hanging at x3 (x30), y15, at z7 / z15 / z23.
- Approach: lanterns on the parapet tops at x0 and x17, z8, y22; hanging lanterns in the vault at x5 and x12, z7..8, y12.

## FLOORS (walk levels; no interiors)
| Plot | Walk surfaces (feet y) |
|---|---|
| Tower | caisson y4; ledges y27 and y49; roads y28; promenade y31; roof y58 |
| Deck | roads y28; promenade y31 |
| Anchorage | street y4 to 7; roads y21; promenade y24; parapets y22 |
| Approach | roads y21; promenade y24; parapets y22 |
Every walk surface is within lantern reach (block light > 0).

## BLOCKERS (named)
- **B1:** 3-wide inner cable housings at x14/x19 can't fit without crossing the road (x9..13, x20..24) or closing the promenade, so the inner housings are 2 wide (x14..15, x18..19). The promenade passes between them, 2 wide.
- **B2:** plot 5's height cap (y22) is below its own promenade (boards y23 by the brief, to match the anchorage). The plan keeps the boards at y23, the railings at y24 and the lanterns at y26, so plot 5 needs a cap of y26.
- **B3:** the toolkit's block list rejects `chain` (it knows only `iron_chain`, which is 1.21.4+), so the kit uses no chain at all.

---
# DESIGNER'S SECTIONS

## PALETTE
Keeps the architect's MATERIALS exactly (all ids verified with `$MCD blocks --check`). Shape variants: stone_brick_stairs/slab/wall, polished_andesite_stairs/slab, smooth_sandstone_stairs/slab, smooth_quartz_stairs/slab, spruce_stairs/slab (brackets), dark_oak_fence, diorite_wall (stays), gray_concrete road, light_gray_concrete dashes/bands, polished_blackstone tablet, tuff_bricks backs, lantern (hanging "false" on posts, "true" under slabs), cracked_stone_bricks/mossy_stone_bricks sparingly, cobblestone/andesite/mossy_cobblestone caisson. No chain, no torches. Birch/mushroom not used.

## VOCABULARY
- gothic_arch(g,{x0,x1,z,face}): pointed arch per FACADES table: opening air with width narrowing 7,7..(y27..42), 5 (y43-44), 3 (45-46), 1(47-48); R1 recess air at z4/z15; smooth_sandstone ring behind; polished_andesite voussoirs; upside-down stone_brick_stairs on opening edges; hood stairs facing out.
- gothic_panel(g,{x,y0,y1,z,face}): remove face cell (recess 1), back tuff_bricks, head of two upside-down stone_brick_stairs facing each other.
- quoin_corner(g,{x,z,y0,y1}): alternating polished_andesite 2-long/1-short per course.
- cornice_ring(g,box): y55 upside-down stone_brick_stairs facing out, y56 smooth_sandstone, y57 smooth_sandstone_stairs, y58 stone_brick_wall parapet.
- cable_line(g,{x,zs,yfn}): block at floor(y) smooth_quartz, bottom smooth_quartz_slab at floor(y)+1 when frac>=.5, light_gray_concrete band every 6 in z; fill vertically so 8-connected.
- suspender(g,{x,z,y0,y1}): diorite_wall column.
- stay_line(g,{x,from:[z,y],to:[z,y]}): Bresenham along major axis, diorite_wall, cable wins.
- truss_bay(g,{z0..z15}): chords smooth_sandstone y22 and y29 on x0,6,11,17, verticals every 3 and X-diagonals per bay (smooth_sandstone), smooth_stone floor beams y25..26 at z1,5,9,13, stringers, road gray_concrete y27 x1..5/12..16, dashes light_gray_concrete x3/x14 z0..2,8..10, promenade spruce_planks y30 x7..10 with spruce_stairs brackets, dark_oak_fence y31 on x7,x10.
- lamp_post(g,{x,y,z,h}): dark_oak_fence h tall + lantern on top (hanging false).
- round_vault(g,{...}): arch of air with polished_andesite voussoir ring and smooth_sandstone keystone, tuff_bricks back.
- coursed_wall(g,box): stone_bricks with polished_andesite plinth, ~6% cracked.

## ROOMS
None: exterior-only bridge kit, no interior rooms.

## PARTS
1. Tower masonry shell (parts/tower_shell.mjs): caisson, stages, arches opened, cable cells left empty. 2. Tower facade & cables (parts/tower_facade.mjs): arch rings, hoods, panels, cornice, parapet, saddle cables, lanterns. 3. Deck section (parts/deck.mjs). 4. Cable spans (parts/spans.mjs): plots 2 and 3. 5. Anchorage (parts/anchorage.mjs). 6. Approach (parts/approach.mjs).

## Notes
Build nothing at y0. Stay in plot bounds and height caps (plot 5 cap 26 per B2). Lamps everywhere walkable.
