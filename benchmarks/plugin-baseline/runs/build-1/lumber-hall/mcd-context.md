# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# Required elements: Lumber Hall (all coordinates from plan.md; north face, south = mirror z -> 37 - z)

Legend: part = P1 shell, P2 frame, P3 roof, P4 shopfronts, P5 fittings, P6 grounds. Vocab in plan.md VOCABULARY.

- [ ] **Long through-block burgage warehouse, north street to south street**: podium y0..4 x0..42 z0..37; shell x2..40, z3..34 (upper), twin gable. P1+P2. `frameBay`, `gableFrame`.
- [ ] **Two meshed shop rows, back to back** (12 sockets, A north z6..18, B south z19..31): left to runParts + sockets.json; P1 cuts nothing in boxes. Keeper pockets at the A/B stagger (plan RESERVED). P1 (shell around), engineer rules.
- [ ] **Six Folio wood merchants, each its own wood** (OAK A1 x30..32, SPRUCE A3 x22..24, BIRCH A5 x14..16 north; JUNGLE B1 x10..12, ACACIA B3 x18..20, DK OAK B5 x26..28 south): `wood` and `display` set in sockets.json; fascia board, awning stairs, valance trapdoors, pier log-end panel, hanging sign, door-colour lantern all in that wood. Real blocks: `<wood>_planks` fascia band behind banner letters, `<wood>_stairs` awning, `<wood>_trapdoor` open valance, `<wood>_log` axis z end panel. P4. `shopFront`, `fasciaBoard`, `awning`, `pierPanel`, `hangSign`.
- [ ] **Shop names**: BIRCH SPRUCE OAK / JUNGLE ACACIA "DK OAK" as banner letters (plaque, material null) on fascia z5/z32 y9..11, x10..16, 18..24, 26..32. P4.
- [ ] **Timber store (first floor)** y12 slab, y13..17 walls: frame posts, braces, calcite infill, windows, loading doors. P2, P5.
- [ ] **Loft** y18 slab, y19..23 walls, head plate y23 cornice. P2, P5.
- [ ] **Jetties x2**: first floor +1 (z4/z33), loft +1 more (z3/z34); upside-down dark_oak_stairs bracket under every post (y11 z4, y17 z3). P2. `jettyBracket`.
- [ ] **Two slate gables with timber-framed triangles**, king post pairs x11..12, x30..31, diagonal braces, calcite infill y24..34 z3/z34. P2 (`gableFrame`) + P3 roof around via `keep`.
- [ ] **Roof** `granary` preset slate, ridges x11..12 and x30..31, valley x21, eaves 1, verge board dark oak. P3. Louvred monitor along each ridge: `monitorVent`.
- [ ] **Hoist beam, 4 (2 per street) with hood and chain**: twin dark_oak logs axis z x11..12 / x30..31, y30, z0..3 (south z34..37); iron_chain y26..29 hanging at z1 x11, x30; dark_oak_stairs hood y31. P2 `hoistBeam`, `hoistHood`.
- [ ] **Loading doors, stacked**: gable y25..27, loft y19..20+transom 21, first floor y13..14+transom 15, x11..12 and x30..31, both streets. dark_oak_door pairs facing out, glass_pane transom. P5 `loadingDoors`.
- [ ] **Keepers' gallery over the meshed backs**: z15..22, y13..17, partitions z14 and z23 (dark_oak_planks with dark_oak_fence light bays), doorways x20..21; hatches (trapdoors) y12 at (11,16) (19,16) (27,16) (15,21) (23,21) (31,21) with ladders y5..11 below. P1 (partitions, hatches, ladders) + room designers.
- [ ] **Stair lobby (west)**: lobby z6..12, stair 1 x3..4 z13..21 y5..12, counting room z22..31; stair 2 x3..4 store to loft. P1 `stairFlight`.
- [ ] **Cart passage (east)**: x35..39 z5..32 y5..9 open both ends, cobblestone floor, 5x5 arches with upside-down stair corners at y9 and beam y10..11. P1 `cartArch`.
- [ ] **Plinth, piers, cornice**: cobbled_deepslate y5 on end bays; stripped_dark_oak_log piers x9,17,25,33 y9..11 (P4); cornice y23 (P2).
- [ ] **Lamp posts and lanterns** x1/x41, y5..8, z1/z36 (fence posts + lantern); hanging lanterns under awnings; gallery and store lanterns. P6 `lampPost`.
- [ ] **Pavement, gutters, alleys**: polished_andesite with andesite 1 in 6, cobblestone gutter z0 / z37, alleys x0..1, x41..42. P1/P6.
- [ ] **Stacked timber stock** (woodpile against walls, never in clear zones): log stacks of the six woods on the pavements' flanks and in the cart passage edges. P6 `woodPile`; interior racks by room designers.
- [ ] **Reskinnable roles**: frame / infill / trim / roof used consistently; shop woods separate. All parts.
- [ ] Not present on purpose: chimney (fire rule), torches.
```

### rooms.json

```json
{"entrance":[5,5,3],"rooms":[{"name":"Lobby","box":[3,5,6,7,11,12]},{"name":"Stair hall","box":[3,5,13,7,11,21]},{"name":"Counting room","box":[3,5,22,7,11,31]},{"name":"Pocket A1","box":[10,5,16,12,11,17]},{"name":"Pocket A2","box":[18,5,16,20,11,17]},{"name":"Pocket A3","box":[26,5,16,28,11,17]},{"name":"Pocket B1","box":[14,5,20,16,11,21]},{"name":"Pocket B2","box":[22,5,20,24,11,21]},{"name":"Pocket B3","box":[30,5,20,32,11,21]},{"name":"Cart passage","box":[35,5,5,39,9,32]},{"name":"North store","box":[3,13,5,39,17,13]},{"name":"Keepers' gallery","box":[3,13,15,39,17,22]},{"name":"South store","box":[3,13,24,39,17,32]},{"name":"Loft","box":[3,19,4,39,23,33]}]}
```

### palette.json

```json
{"roles":{"frame":["stripped_dark_oak_log","stripped_dark_oak_wood"],"infill":["calcite"],"trim":["dark_oak_planks","dark_oak_stairs","dark_oak_slab","dark_oak_trapdoor","dark_oak_door","dark_oak_fence","dark_oak_fence_gate"],"base":["cobbled_deepslate","cobbled_deepslate_stairs","cobbled_deepslate_slab","deepslate_bricks","deepslate_brick_stairs","deepslate_brick_slab","cobbled_deepslate_wall"],"roof":["cobbled_deepslate","deepslate_tiles","polished_deepslate","deepslate_tile_stairs","polished_deepslate_stairs","deepslate_tile_slab","polished_deepslate_slab","deepslate_bricks","deepslate_brick_stairs","deepslate_brick_slab"],"glass":["glass_pane"],"ground":["polished_andesite","andesite","cobblestone","polished_andesite_slab","stone_bricks","stone_brick_slab"],"metal":["iron_chain","lantern"],"shop":["oak_log","stripped_oak_log","oak_planks","oak_stairs","oak_trapdoor","oak_leaves","spruce_log","stripped_spruce_log","spruce_planks","spruce_stairs","spruce_trapdoor","spruce_leaves","birch_log","stripped_birch_log","birch_planks","birch_stairs","birch_trapdoor","birch_leaves","jungle_log","stripped_jungle_log","jungle_planks","jungle_stairs","jungle_trapdoor","jungle_leaves","acacia_log","stripped_acacia_log","acacia_planks","acacia_stairs","acacia_trapdoor","acacia_leaves","dark_oak_log","stripped_dark_oak_log","dark_oak_leaves","oak_slab","spruce_slab","birch_slab","jungle_slab","acacia_slab"],"functional":["ladder","barrel","candle","chest"],"signage":["white_banner","black_banner","brown_banner","orange_banner","oak_wall_hanging_sign","spruce_wall_hanging_sign","birch_wall_hanging_sign","jungle_wall_hanging_sign","acacia_wall_hanging_sign","dark_oak_wall_hanging_sign"]},"objects":["lantern","iron_chain","barrel","chest","ladder","dark_oak_door","dark_oak_trapdoor","dark_oak_fence","glass_pane","oak_trapdoor","spruce_trapdoor","birch_trapdoor","jungle_trapdoor","acacia_trapdoor","oak_leaves","spruce_leaves","birch_leaves","jungle_leaves","acacia_leaves","dark_oak_leaves","oak_log","stripped_oak_log","spruce_log","stripped_spruce_log","birch_log","stripped_birch_log","jungle_log","stripped_jungle_log","acacia_log","stripped_acacia_log","dark_oak_log","stripped_dark_oak_log","white_banner","black_banner","brown_banner","orange_banner","oak_wall_hanging_sign","spruce_wall_hanging_sign","birch_wall_hanging_sign","jungle_wall_hanging_sign","acacia_wall_hanging_sign","dark_oak_wall_hanging_sign","item_frame"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which is moved into place only when the build succeeds.
cd "$(dirname "$0")" || exit 1
tmp=$(mktemp ./build.XXXXXX) || exit 1
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp" && mv -f "$tmp" build.nbt
```

### build.mjs

```js
// Lumber Hall: the scaffold. Lays the podium, then runs every part in plan order (runParts locks what each part built).
// Usage: node build.mjs <out.nbt>   (make.sh calls it with a temp file)
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE, COBBLESTONE } from "./vocab/base.mjs";
import * as shell from "./parts/shell.mjs";
import * as stairs from "./parts/stairs.mjs";
import * as frame from "./parts/frame.mjs";
import * as roof from "./parts/roof.mjs";
import * as shops from "./parts/shops.mjs";
import * as fittings from "./parts/fittings.mjs";
import * as grounds from "./parts/grounds.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";
import * as room6 from "./parts/room-6.mjs";
import * as room7 from "./parts/room-7.mjs";
import * as room8 from "./parts/room-8.mjs";
import * as room9 from "./parts/room-9.mjs";
import * as room10 from "./parts/room-10.mjs";
import * as room11 from "./parts/room-11.mjs";
import * as room12 from "./parts/room-12.mjs";
import * as room13 from "./parts/room-13.mjs";
import * as room14 from "./parts/room-14.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

const g = new Grid(SITE.size);
// the podium: solid ground y 0..4 over the whole plot (sockets' boxes and pits are dug out by runParts)
g.fill([SITE.x0, 0, SITE.z0], [SITE.x1, 4, SITE.z1], COBBLESTONE);

runParts(g, [
  ["Shell and floors", shell.build],
  ["Stairs and ladders", stairs.build, { carve: true }],
  ["Timber frame", frame.build],
  ["Slate roof", roof.build],
  ["Shopfronts", shops.build],
  ["Windows, doors and fittings", fittings.build],
  ["Grounds and lights", grounds.build],
  ["room: Lobby", room1.build],
  ["room: Stair hall", room2.build],
  ["room: Counting room", room3.build],
  ["room: Pocket A1", room4.build],
  ["room: Pocket A2", room5.build],
  ["room: Pocket A3", room6.build],
  ["room: Pocket B1", room7.build],
  ["room: Pocket B2", room8.build],
  ["room: Pocket B3", room9.build],
  ["room: Cart passage", room10.build],
  ["room: North store", room11.build],
  ["room: Keepers' gallery", room12.build],
  ["room: South store", room13.build],
  ["room: Loft", room14.build],
], { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Lumber Hall: palette as named constants (palette.json's ids only), plan.md's site constants, and a seeded rng.

// frame: stripped dark oak log (posts, beams, piers; set its axis per placement)

// frame: stripped dark oak log (posts, beams, piers; set its axis per placement)
export const FRAME_LOG = "stripped_dark_oak_log";

// frame: stripped dark oak wood (cut ends of the frame logs)
export const FRAME_WOOD = "stripped_dark_oak_wood";

// infill: calcite (the daub between the timbers)
export const INFILL = "calcite";

// trim: dark oak planks (fascia frames, flooring of the stores)
export const TRIM_PLANKS = "dark_oak_planks";

// trim: dark oak stairs (brackets, braces, awnings' upside-down lips; set facing and half)
export const TRIM_STAIRS = "dark_oak_stairs";

// trim: dark oak slab (sills, window sills, door sills; set type)
export const TRIM_SLAB = "dark_oak_slab";

// trim: dark oak trapdoor (shutters, hatches, valances; set facing, half, open)
export const TRIM_TRAPDOOR = "dark_oak_trapdoor";

// trim: dark oak door (loading doors and the double doors; set facing, half, hinge)
export const TRIM_DOOR = "dark_oak_door";

// trim: dark oak fence (lamp posts, hoist arms, rails)
export const TRIM_FENCE = "dark_oak_fence";

// trim: dark oak fence gate
export const TRIM_FENCE_GATE = "dark_oak_fence_gate";

// base: cobbled deepslate (the plinth course)
export const BASE = "cobbled_deepslate";

// base: cobbled deepslate stairs (plinth steps)
export const BASE_STAIRS = "cobbled_deepslate_stairs";

// base: cobbled deepslate slab (plinth caps)
export const BASE_SLAB = "cobbled_deepslate_slab";

// roof: the slate mix (cobbled deepslate, deepslate tiles, polished deepslate)
export const ROOF_COBBLE = "cobbled_deepslate";

// roof: deepslate tiles
export const ROOF_TILES = "deepslate_tiles";

// roof: polished deepslate
export const ROOF_POLISHED = "polished_deepslate";

// glass: glass pane (windows, loading-door transoms, lobby windows)
export const GLASS_PANE = "glass_pane";

// ground: polished andesite (pavement)
export const POLISHED_ANDESITE = "polished_andesite";

// ground: andesite (one in six of the pavement)
export const ANDESITE = "andesite";

// ground: cobblestone (gutters, cart-passage floor, podium fill)
export const COBBLESTONE = "cobblestone";

// metal: iron chain (hoist chains; set axis y)
export const IRON_CHAIN = "iron_chain";

// metal: lantern (the only light; set hanging)
export const LANTERN = "lantern";

// functional: ladder (keeper ladders; set facing)
export const LADDER = "ladder";

// functional: barrel (stock in the stores; set facing)
export const BARREL = "barrel";

// functional: candle (counting-room and office light)
export const CANDLE = "candle";

// shop woods: the six Folio woods, one per business (the shop accents stay with their wood)
export const WOODS = ["oak", "spruce", "birch", "jungle", "acacia", "dark_oak"];

// shop: the blocks of one wood: { log, strippedLog, planks, stairs, trapdoor, leaves } (ids as palette.json's "shop" role)
export const woodBlocks = (wood) => ...

// site: plot extent and grid size (x 0..42, z 0..37, y 0..39), from plan.md SITE
export const SITE = { x0: 0, x1: 42, z0: 0, z1: 37, size: [43, 40, 38] };

// site: the podium's top course; the pavement top is y 4 and people stand in y 5
export const PAVEMENT_Y = 4;

// site: the shop storey's floor (people stand here) and its top course
export const SHOP_FLOOR_Y = 5, SHOP_TOP_Y = 11;

// site: the first floor's floor block (timber store air y 13..17)
export const FIRST_FLOOR_Y = 12;

// site: the loft's floor block (loft air y 19..23)
export const LOFT_FLOOR_Y = 18;

// site: the roof's start course (eave of the granary roof)
export const ROOF_Y = 24;

// site: the top of the gable triangles
export const GABLE_TOP_Y = 34;

// site: the north face's shopfront and fascia plane (z); the south face is mirrorZ(NORTH_FACE_Z)
export const NORTH_FACE_Z = 5;

// site: the north first-floor and loft front planes (z); the jetties project toward the street
export const NORTH_FIRST_Z = 4, NORTH_LOFT_Z = 3;

// site: the entrance cell (pavement top y 4, so stand in y 5)
export const ENTRANCE = [5, 5, 3];

// site: the cart passage lane (clear x 35..39, y 5..9, through the block)
export const CART_LANE_X = 37;

// site: the hoist beams' x positions (twin logs at x and x+1, two beams)
export const HOIST_X = [11, 30];

// site: the side walls' x positions (west and east end bays)
export const WEST_WALL_X = [2, 8], EAST_WALL_X = [34, 40];

// site: mirror a z across the building's centre line (north <-> south face; facings flip n <-> s)
export const mirrorZ = (z) => ...

// rng(seed): a seeded random function returning floats in [0, 1) (mulberry32), so a rebuild is identical
export function rng(seed)
```

### vocab/h1.mjs

```js
// Lumber Hall vocabulary, set 1 (plan.md VOCABULARY: post, jettyBracket, gableFrame, monitorVent, hatchLadder,
// pierPanel, lampPost, pavingPatch). Every helper takes its position as arguments and returns { placed, refused }.
// Each one writes only inside its own footprint box, and only into air, unless opts.replace is true; a write it
// refuses is listed as "x,y,z" so the caller can report it. Facings are the toolkit's: stairs face their back side,
// trapdoors face the side they hinge from, ladders face the way they face (away from their wall).
// North form only: pass the south z (37 - z) and flip facings yourself, as the plan's mirror rule says.

/** Stripped dark oak post, axis y, from y0 to y1 (either order) at (x, z). */
export function post(g, x, y0, y1, z, opts = {})

/**
 * One dark oak stair bracket under a first-floor or loft post: half top, facing = the stairs' back (toward the wall),
 * so its lip stands out toward the street.
 */
export function jettyBracket(g, x, y, z, facing, opts = {})

/**
 * Timber-framed gable triangle over the wall at z, spanning x0..x1 (a 45-degree roof, eave y24, ridge at the middle).
 * Stepped rafters on the roof line (cut ends at the eaves), a king post pair at the middle, two diagonal dark oak
 * braces per side, and calcite infill under the rafters. Framing lies in the wall plane, so face only names the side
 * the gable looks out of (2D geometry is the same for north and south).
 */
export function gableFrame(g, x0, x1, z, face, opts = {})

/**
 * Ridge louvre: a box x0..x1 by z0..z1, three high. Dark oak slab caps at y and y+2, and open dark oak trapdoors at
 * y+1 on both long sides, one per row along z (the vent's louvres).
 */
export function monitorVent(g, x0, x1, y, z0, z1, opts = {})

/**
 * Keeper's ladder up a pocket's back wall: ladder y5..11 at (x, z) facing `facing` (away from its wall), and a closed
 * dark oak trapdoor in the store floor at y12. The clear lane in front of it (y5..6, the cells the ladder faces) is never
 * written, so it stays open. The pocket must be three wide and the hatch cell must be air (the shell leaves it open).
 */
export function hatchLadder(g, x, z, facing, opts = {})

/**
 * Pier panel on a shop face: stripped dark oak pier y9..11 at the fascia plane (north z5, south z32), and two
 * <wood>_log logs axis z at y9..10 on the face in front of it (z4 / z33), log ends toward the street.
 */
export function pierPanel(g, x, face, wood, opts = {})

/** Lamp post: dark oak fence y5..7 with a standing lantern on top at y8, at (x, z). */
export function lampPost(g, x, z, opts = {})

/**
 * Paving on the pavement top (y4) over x0..x1, z0..z1: polished andesite with andesite in 1 of 6 cells (a fixed
 * pattern, so repeat builds match), and cobblestone gutters on the street edge rows z0 and z37. The podium below is
 * ground, so this writes over it only with opts.replace (the pavement is laid over the podium).
 */
export function pavingPatch(g, x0, x1, z0, z1, opts = {})
```

### vocab/h2.mjs

```js
// Lumber Hall vocabulary, set 2 (plan.md VOCABULARY: beam, windowUnit, hoistBeam, cartArch, shopFront, awning,
// woodPile). Every helper takes its position (and facing) as arguments and returns { placed, refused }. Each one writes
// only inside its own footprint box, and only into air, unless opts.replace is true; a refused write is listed as
// "x,y,z" so the caller can report it. Facings are the toolkit's: stairs face their back side (so an awning that
// rises out to the street faces out), trapdoors face the side they hinge from.
// Streets: north = z 5 (fascia plane), south = z 32 (the mirror of 5 about 18.5). Pass opts.z to put a front elsewhere.
// Helpers that run along a wall (awning, shopFront) take north or south only; windowUnit takes all four faces.

// Horizontal run of stripped dark oak along x (fixed y, z) or along z (fixed y, and x = the z argument).
// Its two end cells are stripped_dark_oak_wood, the rest stripped_dark_oak_log, both with the run's axis.
/** beam(g, x0, x1, y, z, axis): axis "x": cells x0..x1 at (y, z). axis "z": cells z0..z1 (x0, x1) at x = z, y. */
export function beam(g, x0, x1, y, z, axis = "x", opts = {})

/**
 * windowUnit(g, x, y, z, face): a 1 x 2 glass pane in the wall at (x, y, z) (lower cell), a dark oak slab sill below it,
 * and an open dark oak trapdoor shutter each side of the pane, two high. The wall is one thick: nothing is set behind.
 */
export function windowUnit(g, x, y, z, fc, opts = {})

/**
 * hoistBeam(g, x, z0, z1, face): the hoist beam of one street. Two logs (x and x + 1) at y 30 running from z0 to z1,
 * stripped_dark_oak_wood on the outer end (z0 north, z1 south). An iron chain hangs from the beam at (x, 26..29) one
 * cell in from the outer end.
 */
export function hoistBeam(g, x, z0, z1, fc, opts = {})

/**
 * cartArch(g, xc, z, face): the cart passage opening in the street wall at plane z, centred on x = xc. The 5 x 5 opening
 * (x xc-2..xc+2, y 5..9) is cut to air whatever the wall holds, then the two top corners get upside-down dark oak stairs
 * (back to the wall) and the lintel y 10..11 is laid where it is air. The cobbled jambs are the plinth and end-bay walls
 * the shell already owns, so this helper writes none.
 */
export function cartArch(g, xc, z, fc, opts = {})

/**
 * awning(g, x0, x1, face, wood, opts): the sloping awning over a shop frontage from x0 to x1 (inclusive). Per column:
 * <wood>_stairs at (x, 9, P+o) and (x, 10, P+2o), facing out, with an open <wood>_trapdoor valance at (x, 9, P+2o), where
 * P is the street plane (opts.z) and o the step out of the building. Nothing is written below y 9 in the cells next to the wall.
 */
export function awning(g, x0, x1, fc, wood, opts = {})

/** shopFront(g, biz, x0, face, opts): one business's awning over its 7-wide frontage from x0 (biz is a plan name, e.g. "OAK"). */
export function shopFront(g, biz, x0, fc, opts = {})

/**
 * woodPile(g, x, y, z, len, wood, opts): a stack of one wood, len long (opts.axis "x": along x, two cells across z;
 * "z": along z, two cells across x). A <wood>_planks layer at y, then two layers of <wood>_log at y+1 and y+2 (3 high).
 * Footprint: len x 2 x 3. The pile does not reach past its two cells across, so a lane one cell beyond it stays clear
 * (the cart passage pile sits at x 35..36 and leaves the x 37 lane open).
 */
export function woodPile(g, x, y, z, len, wood, opts = {})
```

### vocab/h3.mjs

```js
// Helpers for the lumber hall (plan.md VOCABULARY items 3, 6, 9, 12, 15, 18, 21): frameBay, loadingDoors, hoistHood,
// stairFlight, fasciaBoard, hangSign, plinthCourse. Each takes the grid (a runParts view or a Grid) first, then the plan's
// arguments, then an optional opts object. Coordinates are absolute, x east, y up, z south. The plan's north face is the
// one drawn here; for the south street pass the mirrored z (37 - z) and the mirrored facing.
// A helper writes only inside the footprint it works out from its arguments, and only into air: a cell that is not air
// (an earlier part's wall, floor or ground) is skipped and counted, never overwritten. Units that must not be half there
// (a door pair) are all-or-nothing. Each returns { placed, skipped, box }: box is the footprint, skipped a count.

// ---- frame bay (item 3) ----------------------------------------------------------------------------------------------
/**
 * A timber bay between two posts (plan FACADES, bays): stripped_dark_oak_log posts at x0 and x1 from y0 to y1, and inside:
 *   brace   solid: a rail at y0+1 across the bay; each half has a lower diagonal of dark_oak_stairs (bottom halves, rising
 *           to the middle) and an upper one (upside down, descending), calcite between
 *   mann    solid: as brace, but each half is one brace rising to a centre post at the middle column
 *   window  posts and calcite; the middle column stays air for windowUnit
 *   door    posts and calcite; x0+1..x0+2 stay air for loadingDoors
 * Needs x1 - x0 >= 2 and y1 - y0 >= 2. The split for an odd span puts the middle one column toward x0.
 */
export function frameBay(g, x0, x1, y0, y1, z, { fill = "brace" } = {})

// ---- loading doors (item 6) ------------------------------------------------------------------------------------------
/**
 * A pair of loading doors (plan item 6): two dark_oak_door leaves side by side, each 2 tall, hinged on opposite sides and
 * facing `face` (out of the wall), with a glass_pane transom across the top (y + 2) and a dark_oak_slab sill under them
 * (y - 1, where that cell is air). x, y, z is the lower left cell as seen from outside. A north or south wall runs the pair
 * along x; an east or west wall runs it along z. The leaves are all-or-nothing; the transom and sill fill what is air.
 */
export function loadingDoors(g, x, y, z, face)

// ---- hoist hood (item 9) ---------------------------------------------------------------------------------------------
/**
 * The hoist hood over a beam (plan item 9): a small gable of dark_oak_stairs at y 31, across x0..x0+3 and rows z0..z0+2
 * (north: x 10..13, z 1..3, over the beam at x 11..12). The slopes run across the beam, so the hood is the same for either
 * street; face names the street and is checked only. Pass z0 = 34 for the south street.
 */
export function hoistHood(g, x0, z0, face)

// ---- stair flight (item 12) ------------------------------------------------------------------------------------------
/**
 * A straight stair flight (plan item 12): `steps` treads of dark_oak_stairs rising in `dir`. The first tread is the cell
 * (x, y0, z0); the flight is two treads wide across its run (x..x+1 for north or south, z0..z0+1 for east or west).
 * Under each tread an upside-down dark_oak_stairs is the stringer; a 2x2 dark_oak_planks landing sits at the top, at
 * y0 + steps. `rail` (optional) is a dark_oak_fence on the open side, one per tread: east or west for a north/south flight,
 * north or south for an east/west one. Stair 1 of the plan: stairFlight(g, 3, 5, 13, "south", 7, { rail: "east" }).
 * The stringer and landing are skipped where the cell is not air, so the floor and the ground under the flight stay.
 */
export function stairFlight(g, x, y0, z0, dir, steps, { rail = null } = {})

// ---- fascia board (item 15) ------------------------------------------------------------------------------------------
/**
 * A shop fascia (plan item 15): `<wood>_planks` across x0..x1 for three rows (y..y+2, plan 9..11) on the wall plane z (plan
 * 5 for the north street, 32 for the south: opts.z), with dark_oak_planks at both ends. The business name goes on it as
 * banner letters (style banner, no board: the letters hang on the band, out to the street). Only north and south streets.
 */
export function fasciaBoard(g, x0, x1, face, wood, name, { y = 9, z = face === "south" ? 32 : 5 } = {})

// ---- hanging sign (item 18) ------------------------------------------------------------------------------------------
/**
 * A hanging shop sign on a pier (plan item 18): a dark_oak_fence arm out from the wall at (x, y, z) (z 5 north, 32 south:
 * opts.z), a `<wood>_planks` blade hung under the arm's end (two rows, top at y-1, text on both faces), and a hanging
 * lantern beside the arm at (x+1, y, arm cell). The lantern is written only when the cell above it is solid. Plan default
 * y 11: the blade sits at y 9..10.
 */
export function hangSign(g, x, face, wood, name, { y = 11, z = face === "south" ? 32 : 5 } = {})

// ---- plinth course (item 21) -----------------------------------------------------------------------------------------
/** The plinth course (plan item 21): cobbled_deepslate along the wall line z from x0 to x1, at y (plan 5). */
export function plinthCourse(g, x0, x1, z, { y = 5 } = {})
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
