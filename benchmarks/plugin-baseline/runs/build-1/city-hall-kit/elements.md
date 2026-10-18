# REQUIRED ELEMENTS: San Francisco City Hall kit

Coordinates come from plan.md (the architect's tables). P1..P10 are the PARTS in plan.md. Helpers are the VOCABULARY in plan.md.
Each element is built from real blocks: columns are `quartz_pillar` shafts with a foot and a capital, balustrades are wall-block balusters under a slab rail, and the cornices are upside-down stairs. No coloured block stands in for any of them.

| # | element (brief / expected) | real construction | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Flat smooth-stone ground, every plot | `smooth_stone` y 0, whole plot | plots 0..3 | P1 | `ground` |
| 2 | Plinth course | `polished_andesite`, 1 proud of the base face, y 1 | every street face (not at the ramps) | P1, P2 | `rusticatedBase` |
| 3 | Rusticated granite base storey | `polished_diorite` courses y 2..9, channel joints at y 4 and y 7 (the face cell left out so `diorite` 1 behind it shows), `smooth_quartz` string course y 9 | wing plane z 2, forward plane z 1, plot 0 at d 2 | P1, P2 | `rusticatedBase` |
| 4 | Tall base windows | 2-wide `gray_stained_glass_pane` y 3..7 set 1 in (reveal open, the cell behind left air), `polished_diorite_slab` sill y 2 one proud, 2 `chiseled_quartz_block` keystones y 8 | plan OPENINGS | P9 glass, P4 sill and keystone | `glassRun`, `baseWindowDressing` |
| 5 | Terrace (loggia floor) | y 9 course from the base face back to the recessed wall, and on through as the floor | all fronts | P1, P2 | `terraceAndFloor` |
| 6 | GIANT ORDER of fluted Doric columns | 2x2: `polished_diorite` foot y 10, `quartz_pillar` (axis y) shaft y 11..32, `smooth_quartz` capital y 33 | wings X 3-4 and 11-12; portico 6 plus 2 flanking pairs; plot 0, 6 per face; corner pavilion 2 in antis per face | P3 | `doricColumn` |
| 7 | Recessed wall of tall windows (2 storeys) | `polished_diorite` 2 thick, y 10..33; glass 1 in, lower y 11..19 and upper y 23..30; `smooth_quartz` lintels y 20 and y 31; `calcite` spandrel y 21 | 4 cells behind the column face | P1, P2 shell; P9 glass | `recessedWall`, `glassRun` |
| 8 | Window sills in the loggia | `polished_diorite_slab` bottom slab y 10 (on the terrace) and top slab y 22, at the cell in front of the reveal | every upper window | P4 | `upperSills` |
| 9 | Loggia (open air between the columns and the wall) | left air by not placing; lanterns stand on the terrace behind the pedestals | z 4..5 (wing), z 3..4 (forward) | P1 leaves it, P10 lights it | `standingLantern` |
| 10 | Entablature: architrave, Doric triglyph frieze, cornice | `smooth_quartz` architrave y 34; `calcite` frieze y 35 with `chiseled_quartz_block` triglyphs where X mod 4 is 0 or 3; `smooth_quartz` crown y 36; upside-down `smooth_quartz_stairs` cornice y 36, 1 proud | all fronts, plot 0 ring, corner pavilion N+E | P1/P2 body, P4 triglyphs and cornice | `entablature`, `triglyphs`, `cornice` |
| 11 | Plain frieze over the portico's six columns | `smooth_quartz` y 35 | x 75..116 | P1 (no triglyphs there) | `entablature` |
| 12 | Attic with small windows | `polished_diorite` y 37..39, 2 thick; 2-wide glass at y 38 over each main window | wings, portico flanks | P1, P9 | `attic`, `glassRun` |
| 13 | Balustrade on top | `diorite_wall` balusters, `polished_diorite_slab` (bottom) rail on top, pedestals (`polished_diorite` + the rail slab) where X mod 4 is 0 or 3 | wing y 40..41 on z 3; portico central y 44..45 on z 12; pavilion y 43..44; plot 0 y 37..38 | P4 | `balustrade` |
| 14 | Flat roof decks, hidden | `smooth_stone` | wing y 39, plot 3 y 42, portico central y 43, plot 0 y 36 (with a hole of radius 18.5) | P1, P2 | `deck` |
| 15 | Pedimented central portico | the forward plane x 67..124 with 6 columns and 2 flanking pairs | plot 1 | P1, P3 | `doricColumn` |
| 16 | Triangular PEDIMENT | raking cornice z 0, rising 1 per 2 (bottom `smooth_quartz_stairs` facing the apex on the outer cell, top `smooth_quartz_slab` on the inner cell); `smooth_quartz` course behind it at z 1; `calcite` tympanum at z 2 filled solid back to z 11 | x 73..118, y 37..48 | P5 | `pediment` |
| 17 | Relief in the pediment | `chiseled_quartz_block` / `quartz_bricks` seated figure, 4 x 6, at x 94..97, y 38..43; reclining groups (`quartz_bricks`, `polished_diorite`) tapering with the rake, all at z 1 standing on the tympanum | plot 1 | P5 | `pedimentRelief` |
| 18 | Low pediment roof | `polished_tuff_stairs` and `polished_tuff_slab` on the 1:2 rake, z 1..11, ridge x 95..96 | plot 1 | P5 | `pediment` |
| 19 | Acroteria | 1 `chiseled_quartz_block` each | apex (95..96, 49, 0); ends (73, 38, 0) and (118, 38, 0) | P5 | `pediment` |
| 20 | Three tall arched doorways | 4-wide openings y 1..8; upside-down `smooth_quartz_stairs` haunches at y 7; `smooth_quartz` voussoir course y 8 with a pair of `chiseled_quartz_block` keystones | x 86..89, 94..97, 102..105, z 1..3 | P5 | `archedDoorway` |
| 21 | Doors at street level | 4 `dark_oak_door` per arch (2 pairs, both halves, facing north, hinges on the outer jambs), transom glass y 4..7 | z 3 | P5 | `archedDoorway` |
| 22 | Slab steps (accessible way in) | `polished_diorite_slab` bottom at z 0, `polished_diorite` full landing z 1..2 (2 long), threshold level with the door | y 1, each arch | P5 | `archedDoorway` |
| 23 | Great windows over the doors | one tall glass opening y 11..30 per intercolumn | x 87..88, 95..96, 103..104, glass z 6 | P1 leaves it, P9 | `glassRun` |
| 24 | Projecting corner pavilion | forward block x 147..174 x 1..30, anta piers rusticated to y 33, `smooth_quartz` pilasters 3 wide, 1 proud, y 10..33 | plot 3 | P1, P3 | `antaPilaster` |
| 25 | Taller pavilion attic with a raised panel | `polished_diorite` y 37..42; `calcite` field with a `chiseled_quartz_block` border 1 proud | N x 157..164, E z 12..19, y 38..41 | P1 attic, P4 panel | `atticPanel` |
| 26 | Plain south and west walls of the pavilion | `polished_diorite` ashlar, flush `smooth_quartz` band y 34..36 | z 30; x 144, z 24..30 | P1 | `plainWall` |
| 27 | Wing bay tiles seamlessly | ends at mid-intercolumn; 1-wide joint glass at X 0 and X 15 (both pane sides connected); hidden party walls z 8..22 | plot 2 (also at x 64, x 127, x 144) | P1, P9 | `glassRun` |
| 28 | Dome pavilion with the giant order on 4 faces | the wing section rotated to each face, 3x3 rusticated corner piers | plot 0, y 1..36 | P2, P3 | `faceFrame` + wing helpers |
| 29 | Hollow rotunda, lit | floor y 1, open up through the deck hole, the drum and the dome's inner shell | plot 0 | P2, P6, P7 | `deck`, `leadDome` |
| 30 | Drum stylobate | `polished_diorite` ring y 37..40 (r 19.5..22.5) with a `smooth_quartz` top course; inner ledge ring 17.5 < r ≤ 19.5 at y 40 | plot 0 | P6 | `ringFill` |
| 31 | Round drum ringed by paired giant columns | `polished_diorite` wall 2 thick (r 18.5..20.5), y 41..70; 16 engaged 2x2 columns, y 41..61 | plot 0 drum table | P6 | `ringFill`, `doricColumn` |
| 32 | Drum windows between the pairs | 8 windows (4 wide on the cardinals, 2 wide on the diagonals), glass y 44..57, a round head of stairs at y 58, slab sill y 43, a `smooth_quartz_stairs` hood at y 59..60 | plot 0 | P6 | `drumWindow` |
| 33 | Drum entablature and stepped attic | architrave/frieze/cornice y 62..64 (cornice at r 22.5); attic step 1 r 21.5 y 65..67 with 8 small windows at y 66 and chiseled urns at y 68 over each pair; step 2 r 20.5 y 68..70 | plot 0 | P6 | `ringFill`, `drumUrn` |
| 34 | Gilded band at the dome's base | `gold_block` ring r 20.5 at y 71 | plot 0 | P7 | `leadDome` |
| 35 | Leaden grey dome with 16 fine ribs | `dome()` hemisphere, r 20.5, height 30, hollow (2 thick), `polished_tuff` with stair edges; 16 meridians in `polished_andesite` (the stairs as `polished_andesite_stairs`, states kept) from y 72 to y 100 | plot 0 | P7 | `leadDome` |
| 36 | Gilded trim on the dome | `gold_block` cartouche at the foot of each rib (y 73); gold ring at y 100 | plot 0 | P7 | `leadDome` |
| 37 | Glowstone in the dome's inner shell | every 3rd inner-shell cell, in rings every 4 courses, staggered | plot 0 | P7 | `leadDome` |
| 38 | Columned lantern | `smooth_quartz` platform disc r 5.5 y 101; 8 `quartz_pillar` 1x1 columns y 102..107 with `gold_block` capitals y 108; open bays with a glass ring at r 4.5; entablature y 109..110; gold band y 111 | plot 0 | P8 | `lanternTemple` |
| 39 | Gilded cupola and finial | `dome()` r 3.5 height 7 in `gold_block` at y 112; finial: 2x2 `gold_block` y 119..124 with a `smooth_quartz` collar y 121; 4 `lightning_rod` y 125 | plot 0 | P8 | `lanternTemple` |
| 40 | No mob spawns: lanterns behind balustrades, in the loggias, on the drum ledge; hanging lanterns under every floor | `lantern` standing (hanging false) on decks, terrace and ledge; `lantern` hanging true on `chain` (axis y) inside; lamp standards on the rotunda floor | all plots | P10 (rotunda floor: its designer) | `standingLantern`, `hangingLantern`, `lampStandard` |
| 41 | Lantern inside the lantern (it glows at night) | hanging `lantern` on a `chain` from the y 109 ceiling | plot 0 | P8 | `hangingLantern` |
| 42 | Every module inside its plot | cornices end at z 0 / x 175; the dome is at most x 11..52 | all | every part | `faceFrame` bounds check |
