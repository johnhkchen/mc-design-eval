# Required elements: Lumber Hall (all coordinates from plan.md; north face, south = mirror z -> 37 - z)

Legend: part = P1 shell, P2 frame, P3 roof, P4 shopfronts, P5 fittings, P6 grounds. Vocab in plan.md VOCABULARY.

- [ ] **Long through-block burgage warehouse, north street to south street**: podium y0..4 x0..42 z0..37; shell x2..40, z3..34 (upper), twin gable. P1+P2. `frameBay`, `gableFrame`.
- [ ] **Two meshed shop rows, back to back** (12 sockets, A north z6..18, B south z19..31): left to runParts + sockets.json; P1 cuts nothing in boxes. Keeper pockets at the A/B stagger (plan RESERVED). P1 (shell around), engineer rules.
- [x] **Six Folio wood merchants, each its own wood** (OAK A1 x30..32, SPRUCE A3 x22..24, BIRCH A5 x14..16 north; JUNGLE B1 x10..12, ACACIA B3 x18..20, DK OAK B5 x26..28 south): `wood` and `display` set in sockets.json; fascia board, awning stairs, valance trapdoors, pier log-end panel, hanging sign, door-colour lantern all in that wood. Real blocks: `<wood>_planks` fascia band behind banner letters, `<wood>_stairs` awning, `<wood>_trapdoor` open valance, `<wood>_log` axis z end panel. P4. `shopFront`, `fasciaBoard`, `awning`, `pierPanel`, `hangSign`.
- [ ] **Shop names**: BIRCH SPRUCE OAK / JUNGLE ACACIA "DK OAK" as banner letters (plaque, material null) on fascia z5/z32 y9..11, x10..16, 18..24, 26..32. P4.
- [ ] **Timber store (first floor)** y12 slab, y13..17 walls: frame posts, braces, calcite infill, windows, loading doors. P2, P5.
- [ ] **Loft** y18 slab, y19..23 walls, head plate y23 cornice. P2, P5.
- [x] **Jetties x2**: first floor +1 (z4/z33), loft +1 more (z3/z34); upside-down dark_oak_stairs bracket under every post (y11 z4, y17 z3). P2. `jettyBracket`.
- [x] **Two slate gables with timber-framed triangles**, king post pairs x11..12, x30..31, diagonal braces, calcite infill y24..34 z3/z34. P2 (`gableFrame`) + P3 roof around via `keep`.
- [x] **Roof** `granary` preset slate, ridges x11..12 and x30..31, valley x21, eaves 1, verge board dark oak. P3. Louvred monitor along each ridge: `monitorVent`.
- [x] **Hoist beam, 4 (2 per street) with hood and chain**: twin dark_oak logs axis z x11..12 / x30..31, y30, z0..3 (south z34..37); iron_chain y26..29 hanging at z1 x11, x30; dark_oak_stairs hood y31. P2 `hoistBeam`, `hoistHood`.
- [ ] **Loading doors, stacked**: gable y25..27, loft y19..20+transom 21, first floor y13..14+transom 15, x11..12 and x30..31, both streets. dark_oak_door pairs facing out, glass_pane transom. P5 `loadingDoors`.
- [ ] **Keepers' gallery over the meshed backs**: z15..22, y13..17, partitions z14 and z23 (dark_oak_planks with dark_oak_fence light bays), doorways x20..21; hatches (trapdoors) y12 at (11,16) (19,16) (27,16) (15,21) (23,21) (31,21) with ladders y5..11 below. P1 (partitions, hatches, ladders) + room designers.
- [ ] **Stair lobby (west)**: lobby z6..12, stair 1 x3..4 z13..21 y5..12, counting room z22..31; stair 2 x3..4 store to loft. P1 `stairFlight`.
- [ ] **Cart passage (east)**: x35..39 z5..32 y5..9 open both ends, cobblestone floor, 5x5 arches with upside-down stair corners at y9 and beam y10..11. P1 `cartArch`.
- [ ] **Plinth, piers, cornice**: cobbled_deepslate y5 on end bays; stripped_dark_oak_log piers x9,17,25,33 y9..11 (P4); cornice y23 (P2).
- [ ] **Lamp posts and lanterns** x1/x41, y5..8, z1/z36 (fence posts + lantern); hanging lanterns under awnings; gallery and store lanterns. P6 `lampPost`.
- [ ] **Pavement, gutters, alleys**: polished_andesite with andesite 1 in 6, cobblestone gutter z0 / z37, alleys x0..1, x41..42. P1/P6.
- [x] **Stacked timber stock** (woodpile against walls, never in clear zones): log stacks of the six woods on the pavements' flanks and in the cart passage edges. P6 `woodPile`; interior racks by room designers.
- [ ] **Reskinnable roles**: frame / infill / trim / roof used consistently; shop woods separate. All parts.
- [ ] Not present on purpose: chimney (fire rule), torches.
