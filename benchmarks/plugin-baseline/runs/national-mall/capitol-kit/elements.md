# US Capitol — REQUIRED ELEMENTS (checklist)

Coordinates are plot-local from plan.md (x west→east, z north→south, symmetric about z 47.5; "mirror" = z → 95−z). Vocabulary names are defined in plan.md VOCABULARY. Parts: P1 shell, P2 colonnades+pediments, P3 dome lower, P4 dome upper, P5 fittings, P6 light+grounds edge.

- [x] **1 Raised rusticated basement / podium** (P1, `podium`): `quartz_bricks` solid y g..4 under every mass; a top course of `smooth_quartz_slab`(top) at y4 where a cornice is free; five courses visible on the west, fewer east. Sill band `smooth_quartz_slab` at y5 proud 1 on west faces. Steps down to the ground g, never floating.
- [x] **2 Senate wing (north), x3..34 z2..18** (P1 `wingBody`): `smooth_quartz` 2-thick walls y5..11 (west x5, east x33, north z2, south z18), core `smooth_stone` y g..11 behind, deck `smooth_stone_slab`(bottom) y12.
- [x] **3 House wing (south), mirror** z77..93 (P1 `wingBody` mirrored).
- [x] **4 Connectors** N x15..27 z19..25, S z70..76 (P1 `wingBody`, same courses).
- [x] **5 Central block** x10..29 z26..69 (P1), plus east antae x30..31 z37..40 / 55..58.
- [x] **6 Wing west colonnades** (P2 `colonnade`): 8 `quartz_pillar`(axis y) on x3 at z 3,5,…,17 y5..10 (House 78..92); corner piers x3..4 z2 & z18 (77, 93) y5..10; entablature `smooth_quartz` x3..5 y11; podium strip x2 y g..4 with arched openings (`archOpening`) at z 4,6,…,16 (House 79..91).
- [x] **7 Wing east pedimented porticoes** (P2 `portico`+`pediment`): 5 columns x35 at z 6,8,…,14 (House 81..89) y5..10; floor x34 bottom slab y5; pediment y11 cornice, y12 z6..14, y13 z8..12, y14 z10 (stairs rakes, quartz tympanum).
- [ ] **8 West Front** (centre z41..54): arcade podium x0..9 y0..4 face x0 `quartz_bricks` with 7 arches (P5 `archOpening`); upper terrace deck y5 x0..7 + `diorite_wall` balustrade x0 y5 (P6); loggia 8 columns x8 z 41,43,45,47,48,50,52,54 y5..10 (P2); entablature x8..10 y11; balustrade x8 y12.
- [x] **9 Inaugural west steps N z37..40 / S z55..58** (P1 `westSteps`): `smooth_quartz_stairs` facing east on solid `smooth_quartz`, per plan OPENINGS; cheek `diorite_wall`.
- [x] **10 East Portico + broad steps' podium** (P2 `portico`): outer columns x32 z 41,43,45,47,48,50,52,54, inner x30 z 42,44,46,49,51,53, y5..10; floor x30..32 slab y5; pediment y11..15 over x29..32 z41..54 with `chiseled_quartz_block` tympanum centre; bronze `dark_oak_door` double at x29 z47..48. (Steps themselves are the plaza kit's.)
- [x] **11 Balustrade along EVERY roofline** (P2 `balustrade`): `diorite_wall` y12 on the outer wall line of every mass, `smooth_quartz` posts at corners and every 6th cell; low grey `smooth_stone_slab` roof behind.
- [ ] **12 Entablature + cornice** (P1/P2): y11 `smooth_quartz` band, `smooth_quartz_slab`(top) cornice proud 1 where free.
- [ ] **13 Pilasters + corner piers + tall windows** (P5 `windowBay`, `pilaster`): `quartz_pillar` flush y5..10; windows 1 wide, recess + `gray_stained_glass_pane`, upside-down `polished_diorite_stairs` lintel on tall ones, per OPENINGS.
- [x] **14 Chamber skylights** (P2/P5): Senate x13..25 z6..14, House z81..89: curb `polished_andesite` y12, `glass` y13, `glowstone` y11.
- [x] **15 Copper cupolas N/S** (P2 `cupola`): x18..21 z29..32 / 63..66, drum calcite y12..13, `oxidized_cut_copper_stairs` ring y14, slab 2x2 y15.
- [x] **16 DOME square base** x11..28 z39..56 y12..14 (P3 `domeBase`): `smooth_quartz`, slab cornice y14.
- [x] **17 DOME peristyle** (P3 `peristyle`): d16 ring ~24 `quartz_pillar` y15..20 every other ring cell, `calcite` drum wall d12 with 4-tall lit windows, entablature disc d16 y21, `diorite_wall` balustrade ring y22, standing `lanterns` on the y15 ring behind every 4th column.
- [x] **18 DOME attic** (P3 `attic`): d14 ring y22..24 `smooth_quartz` with a window y23 every 3rd cell; cornice disc y25 (outer ring upside-down stairs).
- [x] **19 DOME ribbed bell shell** (P4 `domeShell`): d12 y26..28, d10 y29..30, d8 y31, d6 y32, d4 y33; stepped edges as upright stairs facing out; 8 `polished_diorite` ribs; 8 small windows y27.
- [x] **20 Tholos / lantern** (P4 `tholos`): d4 ring `diorite_wall` posts y34..35, `glowstone` core x19..20 z47..48, cap y36 stairs ring + core, y37 d2.
- [x] **21 Statue of Freedom** (P4 `statue`): pedestal `polished_diorite` (19,38,47), `polished_blackstone` y39..40, `polished_blackstone_wall` y41.
- [x] **22 Doors**: West Front double door x10 z47..48 y5..6 + transom y7; wing east doors z10 / z85; East door x29 z47..48 (P5 `bronzeDoor`).
- [ ] **23 Lit windows / warm floodlight at the base** (P6 `baseGlow`, `lanternRow`): glowstone behind every third pane, `shroomlight` behind arcade panes, lanterns on podium ledges, west steps landings and balustrade posts: no dark cell outside (spawn-proof; all open tops are slabs/stairs and lit).
- [x] **24 Terrace edge / north+south terraces** (P6): x10..25 z0..1 and z94..95 plinth bottom slab y g+1 with `diorite_wall` balustrade and lamp line.
