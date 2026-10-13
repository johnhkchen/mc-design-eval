# Lumber Hall: a timber wholesaler's market hall, through the block

Identity: a twin-gabled half-timbered burgage warehouse (Hanseatic Speicher type) running from the north street to
the south street. Each street sees the same face: two great slate gables, each with stacked loading doors and a
hoist beam at the apex, jettied twice over a ground-floor row of three wood merchants (a Folio plus its door
stalls each). One wood per business, shown in its own logs, planks and leaves. Stair lobby at the west end and a
cart passage through the block at the east end.

## SITE

Plot x 0..42, z 0..37. Front = NORTH (-z), x runs along the street. Mirror rule: the south face is the north face
reflected about z = 18.5 (z -> 37 - z).
Levels: a block at y N is walked on at y N+1. Ground podium y 0..4 solid; pavement top = y 4; people stand in y 5.

| mass | x | y | z | notes |
|---|---|---|---|---|
| ground podium (solid) | 0..42 | 0..4 | 0..37 | sockets' boxes and pits cut into it (runParts) |
| north pavement | 0..42 | 4 | 0..3 | cobblestone gutter row z 0 |
| south pavement | 0..42 | 4 | 34..37 | cobblestone gutter row z 37 |
| side alleys | 0..1 and 41..42 | 4 | 4..33 | paving |
| shop storey shell | 2..40 | 5..11 | 5..32 | front lines = fascia planes z 5 / z 32 |
| socket band (12 sockets) | 9..33 | 1..11 | 6..31 | sockets.json, never touched |
| west bay (lobby, stair, counting room) | 2..8 | 5..11 | 5..32 | walls x 2 and x 8 (x 8 backs the glass wall line x 9) |
| east bay (cart passage) | 34..40 | 5..11 | 5..32 | walls x 34 and x 40; clear passage x 35..39, y 5..9 |
| floor slab over shops | 2..40 | 12 | 4..33 | sill of first jetty |
| first floor (timber store) | 2..40 | 12..17 | 4..33 | jettied 1: front walls z 4 and z 33 |
| floor slab | 2..40 | 18 | 3..34 | sill of second jetty |
| loft | 2..40 | 18..23 | 3..34 | jettied 1 more: front walls z 3 and z 34; head plate y 23 |
| west gable roof | 2..21 | 24..~34 | 3..34 | ridge along z |
| east gable roof | 21..40 | 24..~34 | 3..34 | ridge along z; valley with west roof on x 21 |
| hoist beams (4) | 11..12 / 30..31 | 30 | 0..3 north, 34..37 south | twin logs, project 3 over the pavement |
| lamp posts (4) | 1 and 41 | 5..8 | 1 and 36 | fence posts + lantern, outside every counter's clear zone |

Sockets (sockets.json, layout --face north --at 33,5,6 --units "DS DS DS" --rows 2):

| business | wood | Folio | stalls | street | business frontage x | fascia |
|---|---|---|---|---|---|---|
| OAK | oak | A1 32..30 | A2 28..26 | north | 26..32 | z 5, y 9..11 |
| SPRUCE | spruce | A3 24..22 | A4 20..18 | north | 18..24 | z 5 |
| BIRCH | birch | A5 16..14 | A6 12..10 | north | 10..16 | z 5 |
| JUNGLE | jungle | B1 10..12 | B2 14..16 | south | 10..16 | z 32, y 9..11 |
| ACACIA | acacia | B3 18..20 | B4 22..24 | south | 18..24 | z 32 |
| DARK OAK ("DK OAK") | dark_oak | B5 26..28 | B6 30..32 | south | 26..32 | z 32 |

Counters at z 6 (north) and z 31 (south), y 5. Clear zone: z 4..5 and z 32..33, x 9..33, y 6..8: nothing ever.
Glass wall lines x 9, 13, 17, 21, 25, 29, 33. Business boundaries (piers) x 9, 17, 25, 33; x 13, 21, 29 are the
Folio/stalls split inside one business (fascia runs across it).
sockets.json carries `wood` (each machine in its own wood) and `display` (Folio: its log; stalls: planks,
stripped log, leaves).

## ROOFS

| roof | form | detail |
|---|---|---|
| west + east | `mcd roof` preset `granary` (warehouse/granary type): two parallel 45-degree gables, `ridgeAxis: "z"`, footprint `2,3,21,34;21,3,40,34`, `y: 24` | slate palette; ridges x 11..12 and x 30..31 at about y 33..34; louvred monitor along each ridge (drying vent for the timber store) |
| overhang | eaves 1 at x 1 and x 41; verges 1 at z 2 and z 35 | dark oak verge board |
| valley | x 21, y 24, z 3..34 | the tool's valley; no wall rises above y 23 there |
| gable triangles | the wall's job (timber framer), not the roof's | `keep`: x 2..40, y 24..34, z 3 and z 34 |
| hoist hoods | by hand: a small gable of dark_oak_stairs over each beam, y 31, x 10..13, z 1..3 (mirror south z 34..36) | |

No chimney: a timber store (fire rule). Light is lanterns only.

## FACADES

North face (south identical by the mirror rule; the shop names differ).

| band | y | plane z | content |
|---|---|---|---|
| plinth | 5 | 5 | cobbled_deepslate course on the end bays x 2..8 and 34..40 (not across doors/passage) |
| shop storey, end bays | 6..11 | 5 | timber frame: corner posts x 2, 8, 34, 40; head beam y 11; calcite infill |
| shopfront | 5..8 | counters z 6 | six open counters, no columns, nothing in z 4..5 |
| fascia | 9..11 | 5 | three name boards, one per business, 7 wide (x 10..16, 18..24, 26..32), framed by dark oak; banner letters (3 rows): BIRCH, SPRUCE, OAK / JUNGLE, ACACIA, DK OAK |
| piers | 9..11 | 5 | stripped_dark_oak_log posts at x 9, 17, 25, 33 (business boundaries), each with a log-end product panel of its business's wood on the pier face z 4 at y 9..10 (decorator) |
| awnings | 9..10 | 3..4 | per business x 10..16 etc.: stairs of that wood's planks sloping out, open trapdoors of the wood as valance at y 9 z 3 |
| hanging signs | 10 | 3 | under the jetty bracket on pier x 9 (BIRCH), 17 (SPRUCE), 25 (OAK); south x 17 (JUNGLE), 25 (ACACIA), 33 (DK OAK) |
| jetty brackets | 11 | 4 | dark_oak_stairs upside down, one under every first-floor post |
| first floor | 12..17 | 4 | sill beam y 12 (stripped_dark_oak_log axis x), head plate y 17, rail y 14 in solid bays only |
| brackets | 17 | 3 | dark_oak_stairs upside down under every loft post |
| loft | 18..23 | 3 | sill y 18, head plate y 23 (the cornice line, stripped_dark_oak_log axis x, ends as stripped_dark_oak_wood) |
| gables | 24..34 | 3 | timber framed: king post pair x 11..12 / 30..31, two diagonal braces each side, calcite infill |
| hoist beam | 30 | 0..3 | two stripped_dark_oak_log axis z (x 11..12, x 30..31), iron_chain hanging at z 1 y 26..29 from x 11 and x 30, a hood above |

Post rhythm on both upper storeys (stripped_dark_oak_log axis y): x 2, 5, 9, 13, 17, 21, 25, 29, 33, 37, 40, plus
door posts x 10 and x 32. Bays and their fill (same on loft):

| bay x | first floor y 13..16 | loft y 19..22 |
|---|---|---|
| 3..4 | Mann brace (dark_oak_stairs) on calcite | same |
| 6..8 | window x 7 | window x 7 |
| 10..12 | loading doors x 11..12; x 10 is a post | loading doors x 11..12 |
| 14..16 | braces | braces |
| 18..20 | window x 19 | window x 19 |
| 22..24 | window x 23 | window x 23 |
| 26..28 | braces | braces |
| 30..32 | loading doors x 30..31; x 32 is a post | loading doors x 30..31 |
| 34..36 | window x 35 | window x 35 |
| 38..39 | braces | braces |

Window: glass_pane 1 x 2, dark_oak_slab sill below, open dark_oak_trapdoor shutters each side, set flush (1-thick
frame wall). Loading doors: dark_oak_door pair facing out, transom glass_pane above. Side faces x 2 and x 40:
plain frame, posts every 4 on z 5, 9 .. 33, calcite infill, one window per third bay on each upper storey.

Depth: loft +2 and first floor +1 proud of the fascia; piers and awnings +1/+2; brackets +1 under each jetty;
hoist beams +3; roof verges +1 beyond the loft.

## MATERIALS

| role | block |
|---|---|
| frame (posts, beams, piers) | stripped_dark_oak_log (cut ends stripped_dark_oak_wood) |
| infill (daub) | calcite |
| trim (brackets, braces, sills, shutters, doors, verges, fascia frames) | dark_oak_stairs, dark_oak_slab, dark_oak_trapdoor, dark_oak_door, dark_oak_planks |
| base (plinth) | cobbled_deepslate |
| roof | `slate` palette (cobbled deepslate, deepslate tiles, polished deepslate) |
| glass | glass_pane |
| ground | polished_andesite pavement, andesite mix 1 in 6, cobblestone gutters and passage floor |
| metal accents | iron_chain, lantern |
| shop accents (decorator only) | each business its own wood: <wood>_log, stripped_<wood>_log, <wood>_planks, <wood>_stairs, <wood>_trapdoor, <wood>_leaves |

Reskin: swap the five neutral roles (frame, infill, trim, base, roof) only; the shop accents stay with their wood.

## OPENINGS

| opening | x | y | z | size |
|---|---|---|---|---|
| lobby door (north, customers to keeper's office) | 5..6 | 5..6 | 5 | double door, transom glass y 7 |
| keeper's door (south) | 5..6 | 5..6 | 32 | double door, transom y 7 |
| lobby windows | 3, 7 | 6..8 | 5 and 32 | 1 x 3 glass_pane |
| cart passage arches | 35..39 | 5..9 | 5 and 32 | 5 x 5; upside-down dark_oak_stairs in the corners y 9 at x 35 and x 39; beam y 10..11 |
| first-floor windows | 7, 19, 23, 35 | 14..15 | 4 / 33 | 1 x 2 |
| first-floor loading doors | 11..12, 30..31 | 13..14 + transom 15 | 4 / 33 | 2 x 3 |
| loft windows | 7, 19, 23, 35 | 20..21 | 3 / 34 | 1 x 2 |
| loft loading doors | 11..12, 30..31 | 19..20 + transom 21 | 3 / 34 | 2 x 3 |
| gable loading doors | 11..12, 30..31 | 25..27 | 3 / 34 | 2 x 3 (under the hoist beam) |
| side windows | x 2 and x 40 | 14..15 and 20..21 | 9, 21, 29 | 1 x 2 |

## RESERVED

| what | cells | for |
|---|---|---|
| all 12 sockets, wall lines, pits, fronts | sockets.json | machines (runParts reserves) |
| stair 1 (lobby to store) | x 3..4, steps z 13..19 at y 5..11 rising south, landing y 12 z 20..21; floor y 12 open over x 3..4 z 12..19 | stair joiner |
| stair 2 (store to loft) | x 3..4, steps z 24..28 at y 13..17 rising south, landing y 18 z 29..30; floor y 18 open over x 3..4 z 23..28 | stair joiner |
| keeper hatches, A pockets | trapdoor at (11,12,16), (19,12,16), (27,12,16); ladder below at the same x, z 16, y 5..11, facing south on the back wall z 15 | engineer |
| keeper hatches, B pockets | trapdoor at (15,12,21), (23,12,21), (31,12,21); ladder z 21, y 5..11, facing north on back wall z 22 | engineer |
| pockets (light them) | A: x 10..12, 18..20, 26..28, z 16..17; B: x 14..16, 22..24, 30..32, z 20..21; y 5..11 | engineer / lamplighter |
| gallery partitions | z 14 and z 23, x 3..39, y 13..17 (spruce-free: dark_oak_planks with fence lights) | designer |
| hoist beams and chains | see FACADES | framer |

## FLOORS

| storey | floor block y | air | interior volume | use |
|---|---|---|---|---|
| ground: west bay | 4 | 5..11 | x 3..7, z 6..31 | lobby z 6..12, stair z 13..21, counting room z 22..31 |
| ground: sockets | 4 (road) | 5..11 | x 9..33, z 6..31 | shops; meshed pockets behind |
| ground: cart passage | 4 (cobble) | 5..9 | x 35..39, z 5..32 | through-block wagon way, open both ends |
| first floor (timber store) | 12 | 13..17 | x 3..39, z 5..32 | north store z 5..13, keepers' gallery z 15..22 (hatches down into the pockets), south store z 24..32; log racks along x 3..39 |
| loft | 18 | 19..23 | x 3..39, z 4..33 | plank and board store, open to the roof, hoist doors at both ends |
| roof space | 23 (head plate) | 24..33 | under each gable | open, seen from the loft |

# DESIGNER SECTIONS

## PALETTE

Roles (ids exactly as MATERIALS; all verified with `mcd blocks --check`):

| role | blocks | shape variants / states |
|---|---|---|
| frame | stripped_dark_oak_log (axis y posts, x/z beams), stripped_dark_oak_wood (cut ends) | |
| infill | calcite | |
| trim | dark_oak_planks | dark_oak_stairs (half top/bottom, facing, shape), dark_oak_slab (type top/bottom), dark_oak_trapdoor (open, half, facing), dark_oak_door (half, hinge, facing), dark_oak_fence, dark_oak_fence_gate |
| base | cobbled_deepslate | stairs/slab if wanted |
| roof | slate palette: cobbled_deepslate, deepslate_tiles, polished_deepslate | stairs/slabs via roof tool |
| glass | glass_pane | connected states |
| ground | polished_andesite, andesite (1 in 6), cobblestone | |
| metal | iron_chain (axis y/z), lantern (hanging true/false) | |
| shop woods (P4 only) | oak, spruce, birch, jungle, acacia, dark_oak: `<w>_log`, `stripped_<w>_log`, `<w>_planks`, `<w>_stairs`, `<w>_trapdoor`, `<w>_leaves` (persistent true) | |
| functional | ladder, dark_oak_trapdoor (hatches), barrel (stock), candle | |

## VOCABULARY

All helpers take `(g, x, y, z, opts)` and live in `vocab.mjs` ("north" form; `mirrorZ(z)=37-z` flips the face; facings flip n<->s).

1. `post(g,x,y0,y1,z)`: stripped_dark_oak_log axis y.
2. `beam(g,x0,x1,y,z,axis)`: stripped_dark_oak_log along axis; end cells stripped_dark_oak_wood.
3. `frameBay(g,x0,x1,y0,y1,z,{fill:'brace'|'mann'|'window'|'door'})`: posts at both ends, rail at y0+1 (solid bays), calcite infill; 'brace' = two dark_oak_stairs diagonals (lower half bottom, upper upside down) mirrored; 'mann' = two braces meeting a centre post.
4. `jettyBracket(g,x,y,z,facing)`: dark_oak_stairs half top, facing away from wall, under each post.
5. `windowUnit(g,x,y,z,face)`: glass_pane 1x2, dark_oak_slab (bottom) sill below, open dark_oak_trapdoor shutters each side flat on wall.
6. `loadingDoors(g,x,y,z,face)`: two dark_oak_door pairs (lower+upper, same facing, mirrored hinge) 2 wide x 2 tall, glass_pane transom above, dark_oak_slab sill.
7. `gableFrame(g,x0,x1,z,face)`: triangle y24..34 of stripped_dark_oak_log rafters on the roof line, king post pair, 2 diagonal braces per side, calcite infill, cut ends as wood.
8. `hoistBeam(g,x,z0,z1,face)`: two logs axis z at y30 (x, x+1), iron_chain axis y at y26..29 at (x, z+1), end cap stripped_dark_oak_wood.
9. `hoistHood(g,x0,z0,face)`: dark_oak_stairs gable at y31 over the beam, x10..13 z1..3.
10. `monitorVent(g,x0,x1,y,z0,z1)`: ridge lantern louvre: dark_oak_trapdoor open rows between two dark_oak_slab caps.
11. `cartArch(g,xc,z,face)`: 5x5 opening x35..39 y5..9, corner dark_oak_stairs half top at y9 x35 and x39, beam y10..11, cobbled_deepslate jambs.
12. `stairFlight(g,x,y0,z0,dir,steps)`: dark_oak_stairs facing=up direction, half bottom, stringer of upside-down stairs beneath, landing block; fence rail on open side.
13. `hatchLadder(g,x,z,facing)`: ladder y5..11 on back wall (facing per RESERVED), dark_oak_trapdoor at y12 (open false).
14. `shopFront(g,biz)`: composes the below for one business (7 wide).
15. `fasciaBoard(g,x0,x1,face,wood,name)`: `<wood>_planks` band y9..11 framed by dark_oak at ends; `plaque` banner letters, material null, contrasting colour.
16. `pierPanel(g,x,face,wood)`: stripped_dark_oak_log pier y9..11 at z5; on face z4 y9..10 two `<wood>_log` axis z (log ends toward street).
17. `awning(g,x0,x1,face,wood)`: `<wood>_stairs` facing out, half bottom, rows y9 z4 and y10 z3 rising to the wall (starts y>=9); valance `<wood>_trapdoor` open at y9 z3; nothing below y9 in z4..5.
18. `hangSign(g,x,face,wood,name)`: iron bracket (dark_oak_fence arm), `signboard` hanging, y10 z3; lantern hanging beside.
19. `lampPost(g,x,z)`: dark_oak_fence y5..7 + lantern hanging false y8 on top.
20. `woodPile(g,x,y,z,len,wood)`: 2 high stack of `<wood>_log` axis z/x, one plank slab layer under, max 3 high.
21. `plinthCourse(g,x0,x1,z)`: cobbled_deepslate y5 on end bays.
22. `pavingPatch(g,x0,x1,z0,z1)`: polished_andesite with andesite 1 in 6, cobblestone gutters z0/z37.

## ROOMS

(inner air boxes; floor block y below the box)

| room | box | floor | purpose | ways in |
|---|---|---|---|---|
| Lobby | 3,5,6 .. 7,11,12 | polished_andesite | customers' lobby and keeper's office front: desk, ledger board, bench, price board | north double door (5..6,5..6,5); archway to stair hall at z13 x3..7 |
| Stair hall | 3,5,13 .. 7,11,21 | dark_oak_planks | stair 1 at x3..4 z13..19 up to landing y12 z20..21; hat pegs, lantern | lobby z12/13; counting room z21/22 |
| Counting room | 3,5,22 .. 7,11,31 | dark_oak_planks | wholesaler's office: counting desk, ledger shelves, strongbox, tally sticks; warm, candlelit | stair hall z21; south double door (5..6,5..6,32) |
| Pocket A1 | 10,5,16 .. 12,11,17 | stone | keeper pocket behind OAK-side machine, ladder up to hatch (11,12,16) | ladder only; link along back to service aisle |
| Pocket A2 | 18,5,16 .. 20,11,17 | stone | pocket, hatch (19,12,16) | ladder |
| Pocket A3 | 26,5,16 .. 28,11,17 | stone | pocket, hatch (27,12,16) | ladder |
| Pocket B1 | 14,5,20 .. 16,11,21 | stone | pocket, hatch (15,12,21) | ladder |
| Pocket B2 | 22,5,20 .. 24,11,21 | stone | pocket, hatch (23,12,21) | ladder |
| Pocket B3 | 30,5,20 .. 32,11,21 | stone | pocket, hatch (31,12,21) | ladder |
| Cart passage | 35,5,5 .. 39,9,32 | cobblestone | covered wagon way through the block, lanterns, log stacks and barrels at the edges, lane x37 clear | open arches (35..39,5..9,5) and (35..39,5..9,32) |
| North store | 3,13,5 .. 39,17,13 | dark_oak_planks | timber store: log racks along x walls, plank pallets, loading doors x11..12 north wall z4 | stair 1 landing via gallery; doorways in partition z14 at x20..21 |
| Keepers' gallery | 3,13,15 .. 39,17,22 | dark_oak_planks | keepers' walkway over the meshed backs: six hatches, desk, lantern chain, rail; stair 1 arrives at x3..4 z20..21 (y12 landing) | stair 1 top; partition doorways (20..21,13..15,14) and (20..21,13..15,23) |
| South store | 3,13,24 .. 39,17,32 | dark_oak_planks | mirror of north store; stair 2 starts x3..4 z24..28 | partition z23 doorway x20..21; stair 2 |
| Loft | 3,19,4 .. 39,23,33 | dark_oak_planks | plank and board store open to the roof, hoist doors both ends, beams overhead, hung lanterns | stair 2 landing (3..4,18,29..30) opening z23..28 |

Entrance cell: **[5,5,3]** (pavement top y4, standing y5).

## PARTS

1. **Shell and floors** (`parts/shell.mjs`): podium, pavements and alleys, plinth, ground end-bay walls (frame + calcite) x2..8 and x34..40, west bay partitions, cart arches, doors/windows holes, floor slabs y12 and y18 (leave stair openings and sockets' reserve), gallery partitions, hatches and ladders, stairs 1 and 2. Helpers: stairFlight, hatchLadder, cartArch, plinthCourse, pavingPatch.
2. **Timber frame** (`parts/frame.mjs`): first floor and loft storeys both faces and sides, jetty brackets, cornice, gable frames, hoist beams and hoods, loading-door bays. Helpers: post, beam, frameBay, jettyBracket, gableFrame, hoistBeam, hoistHood.
3. **Roof** (`parts/roof.mjs`): roof.json (granary, slate, footprint `2,3,21,34;21,3,40,34`, y24, keep gable cells), dry-run, monitor vents. Helper: monitorVent.
4. **Shopfronts** (`parts/shops.mjs`): six businesses on both faces: fascia boards with names, piers, product panels, awnings, valances, hanging signs; set sockets.json display/wood (already present). Helpers: shopFront, fasciaBoard, pierPanel, awning, hangSign. Run `mcd sockets check`.
5. **Windows, doors and fittings** (`parts/fittings.mjs`): window units, loading doors with transoms, lobby/keeper's double doors, shutters, hanging lanterns on gable. Helpers: windowUnit, loadingDoors.
6. **Grounds and lights** (`parts/grounds.mjs`): lamp posts, paving detail, woodpiles of the six woods on the pavement flanks and cart-passage edges (outside every clear zone), alley lanterns. Helpers: lampPost, woodPile, pavingPatch.

## Notes for workers
- Do not touch socket boxes, wall lines, or z4..5 / z32..33 x9..33 y6..8.
- South = mirror z->37-z; flip facings.
- Awnings and signs start at y9 or higher; everything in a business uses its wood only.
- Fire rule: no chimney, no torches, lanterns only.
- Run `mcd check`, `mcd sockets check` and `mcd walk` after assembly.

## Checklist
- [ ] P1 shell  - [ ] P2 frame  - [ ] P3 roof  - [ ] P4 shopfronts  - [ ] P5 fittings  - [ ] P6 grounds
