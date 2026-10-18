# Palace of Fine Arts — kit of four modules (architect's form)

1 block = 1/1.4 m. Minecraft 1.21.1 blocks only: no pale oak, and no `iron_chain` (it is `chain` in 1.21.1, but the plan needs neither). Every module stands on its own plot, front to NORTH (-z), x along the street. Nothing is placed outside its plot box.

## SITE

| plot | module | x | z | y max |
|---|---|---|---|---|
| 0 | Rotunda | 0..63 | 0..63 | 70 |
| 1 | Peristyle bay (tiles along x, period 16) | 64..79 | 0..23 | 32 |
| 2 | Peristyle end (west end joins a bay) | 80..95 | 0..23 | 32 |
| 3 | Exhibition-hall bay (tiles along x, period 16) | 96..111 | 0..23 | 34 |

Ground: every plot has a full 1-block layer of `smooth_stone` at y 0 over its whole x/z box. Walking level is the top of y 0. No street steps: the monument is level with the paving.

### Plot 0 — Rotunda. Centre (31.5, 31.5). For cell (x,z) let dx = x−31.5, dz = z−31.5.
Tangential coordinate t on each face: N/S faces t = dx; E/W faces t = dz; NE/SW diagonal faces t = (dx+dz)/1.414; NW/SE diagonal faces t = (dx−dz)/1.414.

| mass | cells | y |
|---|---|---|
| Arch ring (8 piers + spandrels) | inside OUTER octagon \|dx\|≤27, \|dz\|≤27, \|dx\|+\|dz\|≤38 AND outside INNER octagon \|dx\|≤21, \|dz\|≤21, \|dx\|+\|dz\|≤30 (ring 6 thick, x/z 5..58) | 1..33 |
| 8 arch openings (carved out of the ring by the ring's own part) | on each face, cells with \|t\|≤6 (12 wide) through the full ring thickness; from y 1 to the springline y 19, above it where t² + (y−19)² ≤ 6.5² (crown at y 25) | 1..25 |
| 16 giant columns (free-standing, 2×2 shafts outside the ring, one each side of every pier) | shaft centres (dx,dz) = (±8,±28), (±28,±8), (±14,±26), (±26,±14); cell span = centre ±0.5. As x/z: N face x 23..24 & 39..40 at z 3..4; S face same x at z 59..60; W face z 23..24 & 39..40 at x 3..4; E face same z at x 59..60; NE diagonal x 45..46 z 5..6 and x 57..58 z 17..18; NW x 17..18 z 5..6 and x 5..6 z 17..18; SE x 57..58 z 45..46 and x 45..46 z 57..58; SW x 5..6 z 45..46 and x 17..18 z 57..58 | base 1..2, shaft 3..27, capital 28..29 |
| Column bases | 4×4 centred on each shaft (shaft ±1), merging into the ring plinth where they touch it | 1..2 |
| Column capitals | y 28: 4×4 `chiseled_sandstone`; y 29: 4×4 abacus `smooth_sandstone` | 28..29 |
| Entablature | the outer octagon (same cells as the ring, full, no openings) y 30..33, plus break-outs: the 4×4 over every column at y 30..33 (its front sits over the column) | 30..33 |
| Attic / drum (hollow) | inside \|dx\|≤25, \|dz\|≤25, \|dx\|+\|dz\|≤35.5 AND outside \|dx\|≤21, \|dz\|≤21, \|dx\|+\|dz\|≤29.5 (4 thick; the inner face is flush with the ring's inner face) | 34..45 |
| Attic corner piers (statue piers) | at each of the 8 attic vertices a 2×2 proud strip 1 out from both faces, e.g. N face ends x 20..21 & 42..43 at z 5..6 (by symmetry for all eight) | 34..45 |
| Attic top deck (dome seat) | every cell inside the attic outer octagon whose radius r = √(dx²+dz²) > 21.5 | 46 |
| Dome steps (Pantheon rings) | y 46: ring 23.5 < r ≤ 25 (inside the attic outline); y 47: ring 23.5 < r ≤ 24.5 | 46..47 |
| Dome shell | spheroid centre (31.5, 46, 31.5), rx = rz = 23.5, ry = 22 (47 across, peak y 68). Shell 3 thick: outer layer (normalized radius from 0.957 to 1.0) `terracotta`; middle layer `brown_terracotta` (coffer backs); inner layer the coffer grid (see FACADES) | 46..68 |
| Dome crown disc | r ≤ 3 | 68 |
| Dome ribs | 8 meridians at azimuth 0°, 45°, …, 315° (on the axes and diagonals): cells within 0.75 of the meridian plane, ONE layer outside the shell surface, `polished_granite`, from y 48 to y 66 | 48..66 |
| Interior floor | the walking floor is the plot's y 0 paving; inside the inner octagon lay the medallion (see FACADES) flush in y 0 | 0 |
| Corner lamp standards (ground outside the ring) | 4 posts at (6,6), (57,6), (6,57), (57,57): y 1 `chiseled_sandstone` pedestal, y 2..3 `sandstone_wall`, y 4 `lantern` | 1..4 |

Interior: one open space inside the inner octagon (42 across), open from the floor to the dome's coffers (about 66 high at the centre), reached through all eight arches.

### Plot 1 — Peristyle bay (x 64..79). Bay centre x 71.5. Tiles: x 64 and x 79 are open (no end walls).

| mass | cells | y |
|---|---|---|
| Front row: paired columns, shafts 2×2 | x 69..70 and 73..74, z 4..5 | 3..18 |
| Back row: paired columns, shafts 2×2 | x 69..70 and 73..74, z 12..13 | 3..18 |
| Shared pedestal under each pair (one plinth carries both columns) | front x 68..75, z 3..6; back x 68..75, z 11..14 | 1..2 |
| Capitals | y 19: 4×4 `chiseled_sandstone` per shaft (shaft ±1; a pair's two capitals meet over x 71..72); y 20: abacus `smooth_sandstone` x 68..75 over each row | 19..20 |
| Architrave beams (one per row, full bay length) | x 64..79, z 3..6 (front) and z 11..14 (back) | 21 |
| Frieze block (ties both rows; roof deck of the walkway) | x 64..79, z 3..14 | 22..23 |
| Cornice | y 24: x 64..79, z 2..15 (proud 1 on north and south) | 24 |
| Planter box (hollow, open top) | outer x 67..76, z 4..13; walls 1 thick; soil `dirt` inside y 25..29 | 25..31 |
| Planting | leaves mounded over the inner 8×8 at y 30..32 (higher in the middle, ragged edge), spilling 1 over the rim at the corners; `vine` hanging down the four outer faces from y 31 to y 26 | 30..32 |
| Weeping figures (4, one per top corner) | standing on the cornice deck just off each box corner: x 66 z 3; x 77 z 3; x 66 z 14; x 77 z 14. y 25..26 `cut_sandstone` pedestal, y 27..29 `white_terracotta` body (drapery), y 30 `calcite` head, plus one `sandstone_wall` arm cell at y 29 reaching diagonally toward the box corner (the figure leaning on the box, face turned in) | 25..30 |
| Walkway | z 7..10 between the pedestals, paving at y 0, clear to the frieze soffit (y 1..21 air, so 20 high under the frieze) | 0 |
| Behind the colonnade | z 16..23: plain paving | 0 |

### Plot 2 — Peristyle end (x 80..95)

| mass | cells | y |
|---|---|---|
| Paired columns (same section, pedestal, capitals as plot 1) | shafts x 82..83 and 86..87 at z 4..5 and z 12..13; pedestals x 81..88, z 3..6 and z 11..14 | 1..20 |
| Closing pier (solid) | x 89..94, z 2..15 (plinth y 1..2 runs out to x 95) | 1..23 |
| Architrave beams | x 80..88, z 3..6 and z 11..14 | 21 |
| Frieze block | x 80..95, z 3..14 (runs onto the pier) | 22..23 |
| Cornice, returned round the corner | y 24: x 80..95, z 2..15 (proud 1 on north and south). The east face is the plot edge x 95, so the pier face itself is set back to x 94 from y 1..23 and the cornice at x 95 is the 1-proud return (upside-down `smooth_sandstone_stairs` facing west) | 24 |
| Planter box (same as plot 1) | x 80..89, z 4..13 | 25..31 |
| Planting | as plot 1 | 30..32 |
| Weeping figures | as plot 1, at x 90 z 3 and x 90 z 14 (east, off the box corners); the west two on the box line x 80 at z 3 and z 14 (x 79 would leave the plot) | 25..30 |
| Pier parapet east of the box | x 91..94, z 3..14 | 25..26 |
| North niche in the pier | x 91..93, y 3..12, carved 2 deep (z 2..3 air); semicircular head: y 11 full width, y 12 only x 92 | 3..12 |
| East niche in the pier | z 7..9, y 3..12, carved 2 deep (x 93..94 air), head as the north niche | 3..12 |

### Plot 3 — Exhibition-hall bay (x 96..111). Tiles along x; x 96 and x 111 end on pilasters, so two bays meet as a double pilaster.

| mass | cells | y |
|---|---|---|
| Front wall (3 thick) | x 96..111, z 4..6 | 1..22 |
| Plinth (proud 1) | x 96..111, z 3 | 1..2 |
| Pilasters (proud 1 from the wall face) | x 96..97 and x 110..111, z 3 | 3..17 |
| Frieze band + cornice | frieze y 18..20 on the wall face; cornice y 21..22 proud 1 at z 3 | 18..22 |
| Parapet | x 96..111, z 4..5 | 23..26 |
| Parapet coping | `cut_sandstone_slab` (bottom) on x 96..111, z 4..5 | 27 |
| Blind arch (recessed 2) | x 100..107 (8 wide), carved 2 deep (z 4..5 air, back at z 6 stays wall); from y 1 to springline y 12, above it where (x−103.5)² + (y−12)² ≤ 4.5² (crown y 16) | 1..16 |
| Back wall | x 96..111, z 22 | 1..16 |
| Hall interior (open both x ends, tiles into the next bay) | x 96..111, z 7..21 | 1..16 under the roof |
| Shed roof (by hand) | x 96..111, z 7..23; surface course y = 24 − floor((z−7)/2): y 24 at z 7..8 stepping down to y 17 at z 21..22, eave overhang z 23 at y 16 | 16..24 |

## ROOFS

| roof | form | how |
|---|---|---|
| Rotunda dome | spheroidal dome, rx 23.5, ry 22, base y 46, peak y 68, on two Pantheon step rings (y 46, 47); 8 proud ribs; no lantern, no finial (the real dome has none) | **by hand** (geometry above); the `$MCD roof` `dome` style is too small-scaled for a 47-wide coffered shell and adds a drum we already have |
| Peristyle top | flat: the cornice deck y 24 and the planter boxes; no pitched roof | by hand (it is the entablature) |
| Pier top | flat, low parapet y 25..26 | by hand |
| Hall | shed (lean-to) falling south, pitch 1:2, high edge hidden behind the north parapet (top of parapet y 27 > roof y 24), eave at z 23 overhanging the back wall by 1 | **by hand**, NOT the roof tool: the tool adds verges and gable trim at the x ends, which would break the tiling. Rows by parity of (z−7): even → `granite_stairs` facing north (half bottom), odd → `granite_slab` (bottom) one course down from the stair; eave row z 23 `granite_stairs` facing north. No verge boards; both x ends are cut square |

## FACADES

### Rotunda (all eight faces alike; read from the north)
| level | y | element | depth | material |
|---|---|---|---|---|
| plinth | 1..2 | ring base course and column pedestals | flush; pedestals proud with the columns | `sandstone`, top edge a ring of `sandstone_stairs` (upright, facing out) at y 2 on the outer face only where no column stands |
| piers | 3..29 | wall of the ring between arches | face line | `smooth_sandstone` |
| arch | 1..25 | 12-wide round arch; archivolt ring 1 thick round the opening on the OUTER and INNER faces (cells 6.5 < √(t²+(y−19)²) ≤ 7.5, y ≥ 19, and the jamb cells \|t\| = 7 for y 3..19) | flush | archivolt `cut_sandstone`; keystone at t = 0, y 26 `chiseled_sandstone`; impost at the springline y 19, \|t\| = 7..8, `cut_sandstone` |
| spandrels | 20..29 | wall above the arch | flush | `smooth_sandstone` with one `chiseled_sandstone` roundel (2×2) centred over each haunch at \|t\| = 9.5, y 25..26 |
| giant columns | 1..29 | 16 columns, 2 per pier, free-standing 1 cell clear of the pier face | proud 1..3 from the face | bases `sandstone` (y 1) + `smooth_sandstone` (y 2), shafts `granite` (the salmon-red shafts of the photograph), capitals `chiseled_sandstone` + `smooth_sandstone` abacus |
| architrave | 30 | | flush, broken forward over each column | `cut_sandstone` |
| frieze | 31..32 | plain band, `chiseled_sandstone` tablet over each column break-out | flush | `smooth_sandstone` |
| cornice | 33 | upside-down `smooth_sandstone_stairs` round the outer edge, proud 1 (the cell just outside the outer octagon and the break-outs), `smooth_sandstone_slab` (bottom) on the ledge top at y 34 between cornice and attic | proud 1 | `smooth_sandstone_stairs`, `smooth_sandstone_slab` |
| attic base | 34 | moulding | flush | `sandstone` |
| attic relief panels | 36..42 | one sunken panel per face, \|t\| ≤ 7 (15 wide), 1 deep; panel back alternates `chiseled_sandstone` and `cut_sandstone` columns; 3 figure groups in each, each a 1×3 `white_terracotta` standing figure at t = −4, 0, +4 (y 37..39) | recessed 1 | frame `cut_sandstone` 1 wide around the panel |
| attic corner piers | 34..45 | 2×2 strips at the 8 vertices; a draped statue: `white_terracotta` y 37..40 on the strip's outer face (1 proud), `calcite` head y 41 | proud 1 (statue proud 2) | strip `cut_sandstone` |
| attic cornice | 44..45 | y 44 `cut_sandstone` band; y 45 upside-down `smooth_sandstone_stairs`, proud 1 | proud 1 | |
| attic top | 46 | deck; `smooth_sandstone_slab` (bottom) on any exposed tread at y 47 outside the step rings | | `cut_sandstone` |
| dome steps | 46..47 | two receding rings | | `cut_sandstone` (y 46), `smooth_sandstone` (y 47) |
| dome | 46..68 | salmon-ochre shell, 8 ribs proud 1 | ribs proud 1 | `terracotta`, ribs `polished_granite` |

Inside the rotunda:
| element | where | material |
|---|---|---|
| inner arch faces and piers | as outside (archivolt `cut_sandstone`, wall `smooth_sandstone`) | |
| inner pilasters | 2 wide, proud 1, either side of every arch on the INNER face (\|t\| = 7..8), y 1..29, capital y 28..29 `chiseled_sandstone` | `cut_sandstone` |
| inner entablature band | y 30..33 on the inner face, flush | `cut_sandstone` (y 30), `smooth_sandstone` (31..32), `chiseled_sandstone` (33) |
| attic inner face | y 34..45 plain | `smooth_sandstone` |
| coffered dome underside | inner layer of the shell: a grid of `smooth_sandstone` ribs along 32 azimuth sectors (every 11.25°) and every 3 courses of y; each coffer's inner-layer cells are left as AIR so the coffer reads 1 deep with the `brown_terracotta` middle layer as its shadowed back; a `glowstone` in the middle layer at the centre of every coffer | |
| floor medallion (flush in y 0) | ring r 8..9 `polished_granite`; centre 3×3 `chiseled_sandstone` with `glowstone` at its centre; 8 `glowstone` set in the ring at the axes and diagonals; the rest `smooth_stone` | |

### Peristyle bay / end (front, north; the back face is the same)
| level | y | element | depth | material |
|---|---|---|---|---|
| pedestal | 1..2 | shared plinth under each pair | proud 1 from the shafts | `sandstone` (y 1), `smooth_sandstone` (y 2) |
| shafts | 3..18 | 2×2, paired 2 apart | | `white_terracotta` (lighter, warm plaster) |
| capitals | 19..20 | y 19 `chiseled_sandstone`, y 20 `smooth_sandstone` abacus | proud 1 | |
| architrave | 21 | | flush with the abacus | `cut_sandstone` |
| frieze | 22..23 | plain; `chiseled_sandstone` tablet 2 wide over each column (x 69..70, 73..74 and the end plot's shafts) | flush | `smooth_sandstone` |
| cornice | 24 | upside-down `smooth_sandstone_stairs` on the z 2 and z 15 edges, `smooth_sandstone` between; bottom `smooth_sandstone_slab` on every exposed cornice-deck cell at y 25 not under the box or a figure | proud 1 | |
| planter box | 25..31 | y 25 base band `cut_sandstone`; y 26..30 walls `smooth_sandstone` with a recessed panel on each face (inner 6 of the face, y 27..29, 1 deep, back `sandstone`); y 31 rim `cut_sandstone` | panel recessed 1 | |
| planting | 30..32 | `oak_leaves` + `flowering_azalea_leaves` (all `persistent: true`) heaped, `vine` down the faces | | |
| figures | 25..31 | draped weeping women at the 4 box corners | | `white_terracotta`, `calcite` |
| soffit | 21 (underside of frieze over walkway) | between the architraves, x 64..79 z 7..10: `smooth_sandstone` with `cut_sandstone` cross-beam over each pair (x 69..74) | | |
| end pier (plot 2) | 1..26 | plinth y 1..2 `sandstone`; body `smooth_sandstone`; quoins `cut_sandstone` (alternating 2 and 1 long) at its NE and SE corners; niches lined `cut_sandstone`, a `chiseled_sandstone` sill block at y 3; parapet y 25..26 `smooth_sandstone` capped `cut_sandstone_slab` at y 27 | niches recessed 2 | |

### Exhibition-hall bay (north face)
| level | y | element | depth | material |
|---|---|---|---|---|
| plinth | 1..2 | z 3 | proud 1 | `sandstone` |
| wall | 3..17 | | face z 4 | `smooth_sandstone` |
| pilasters | 3..17 | x 96..97, 110..111; capital y 17 `chiseled_sandstone` | proud 1 | `cut_sandstone` |
| blind arch | 1..16 | 8 wide, 2 deep; archivolt 1 wide round it (ring 4.5 < √((x−103.5)²+(y−12)²) ≤ 5.5, y ≥ 12, and jambs x 99 and 108, y 3..12) `cut_sandstone`; keystone x 103..104, y 17 `chiseled_sandstone`; back of the recess `sandstone` | recessed 2 | |
| frieze band | 18..20 | `cut_sandstone` with a `chiseled_sandstone` tablet every 4 (x 98, 102, 105, 109 at y 19) | flush | |
| cornice | 21..22 | y 21 `cut_sandstone` (proud 1, z 3), y 22 upside-down `smooth_sandstone_stairs` (proud 1, z 3) | proud 1 | |
| parapet | 23..27 | `smooth_sandstone`, sunk panel x 100..107, y 24..25, 1 deep (back `sandstone`), coping `cut_sandstone_slab` | | |
| back wall (south) | 1..16 | plain `sandstone` | | |

## MATERIALS

| role | block |
|---|---|
| ground / paving (all plots, y 0) | `smooth_stone` |
| wall body, piers, attic, planter boxes, hall wall | `smooth_sandstone` |
| plinths, base courses, recess backs | `sandstone` (+ `sandstone_stairs`) |
| architraves, archivolts, bands, pilasters, quoins | `cut_sandstone` (+ `cut_sandstone_slab`) |
| cornices, ledge caps | `smooth_sandstone_stairs` (upside down), `smooth_sandstone_slab` |
| capitals, keystones, tablets, relief panels | `chiseled_sandstone` |
| rotunda giant column shafts | `granite` |
| peristyle column shafts | `white_terracotta` |
| statues, relief figures, weeping figures | `white_terracotta`, `calcite` |
| dome outer shell | `terracotta` (salmon-ochre) |
| dome ribs | `polished_granite` |
| coffer backs | `brown_terracotta` |
| hidden light | `glowstone` (coffers, floor medallion), `lantern` |
| hall roof | `granite_stairs`, `granite_slab` |
| planting | `oak_leaves`, `flowering_azalea_leaves` (persistent), `vine`, `dirt` (hidden) |
| floor medallion | `polished_granite`, `chiseled_sandstone` |

All checked with `$MCD blocks --check`: all known, all pre-1.21.4. Do not substitute: the buff/salmon contrast between body, granite shafts and terracotta dome is the identity.

## OPENINGS

No doors, no windows, no glass anywhere.

| opening | where | size |
|---|---|---|
| Rotunda arches ×8 | one per face, \|t\| ≤ 6, y 1..25 (round head, springline y 19, r 6.5), through the full 6-thick ring | 12 wide × 25 high |
| Peristyle | open between all columns and at both x ends (plots 1, 2 west); walkway z 7..10 | |
| Hall bay interior | open at both x ends (tiling) | x 96..111, z 7..21, y 1..16 |
| Hall blind arch | NOT an opening: recess only, back at z 6 | 8 × 16 |
| End-pier niches | north x 91..93 y 3..12 (2 deep); east z 7..9 y 3..12 (2 deep) | 3 × 10 |

## RESERVED

| cells | for |
|---|---|
| Rotunda arch openings (\|t\| ≤ 6 below the arch curve, every face) | stay air; the ring's part carves them by not placing; nothing ever fills them (walk-through) |
| Rotunda column positions: shaft 2×2 and base 4×4 at every listed centre, y 1..29, plus the 1-cell clear gap between shaft and ring face | columns part; the ring part does not build its plinth into the 4×4 bases (bases belong to the columns part) |
| Rotunda archivolt ring cells, inner pilaster cells (\|t\| = 7..8 on the inner face, 1 proud) | ornament part (it adds into air in front of the face) — the ring part keeps its face line exact |
| Attic relief panel recess (\|t\| ≤ 7, y 36..42, outer 1 layer of each face) | relief part |
| Dome: middle and inner shell layers, rib layer, coffer voids | dome part; the coffer voids stay air |
| Rotunda floor medallion r ≤ 9 in y 0 | floor part replaces the paving there (it is the ground layer, built by the same part as the ground) |
| Peristyle: pedestal + shaft + capital cells of every column; planter interior x 68..75 (z 5..12 in plot 1; x 81..88 in plot 2), y 25..32 | columns part; planting part |
| Figure cells at the four box corners (y 25..31) | figures part — leave the cornice deck bare there (no cap slab) |
| End-pier niches | carved by not placing |
| Hall blind arch recess x 100..107, z 4..5, y 1..16 | air (not placed by the wall part); archivolt/keystone/jamb cells are the ornament part's |
| Hall parapet top (y 24..27) above z 6..: the roof's high edge must stay below y 25 so it is hidden | |

## FLOORS

| mass | floor y | interior volume |
|---|---|---|
| Rotunda | 0 (paving top; walk at y 1) | inner octagon \|dx\|≤21, \|dz\|≤21, \|dx\|+\|dz\|≤30, y 1..45, then the dome void up to y 65 at the centre |
| Peristyle walkway (plots 1, 2) | 0 | x 64..88, z 7..10, y 1..21 (clear to the frieze soffit) |
| Hall bay | 0 | x 96..111, z 7..21, y 1..16 (to the roof at the back), one open hall |

### Lighting (monument, no mob spawn: block light ≥ 1 everywhere walkable, ledges capped with bottom slabs)
| where | light |
|---|---|
| Rotunda interior | `glowstone` in every coffer (middle shell layer); floor medallion glowstones (9) light the centre; a hanging `lantern` under the crown of each arch at t = 0, y 24, on the inner and outer faces of the archway; a `lantern` on each inner pier face at y 8, standing on a `cut_sandstone` bracket (1 proud) |
| Rotunda outside | `lantern` on each outer pier face behind the columns at y 6 (on a bracket); the 4 corner lamp standards; the entablature ledge (y 34) and the attic top capped with bottom slabs; dome treads: a standing `lantern` on the tread beside each rib every 6 courses (y 50, 56, 62) |
| Peristyle | hanging `lantern` under the soffit at y 20 over the walkway centre (x 71..72, z 8) and at the bay seam (x 64, z 9 hanging from the soffit; plot 2 at x 80); a `lantern` in each end-pier niche (on its sill); cornice deck capped with bottom slabs |
| Hall | hanging `lantern` in the blind arch head (x 103, y 15, z 5); one on each pilaster face at y 6 on a bracket; inside, hanging lanterns under the roof every 5 along x at z 10 and z 17 |


---
# DESIGNER SECTIONS

## PALETTE
Architect's MATERIALS kept verbatim. Variants: `sandstone`(+`_stairs`,`_slab`,`_wall`), `smooth_sandstone`(+`_stairs`,`_slab`), `cut_sandstone`(+`_slab`), `chiseled_sandstone`, `granite`(+`_stairs`,`_slab`), `polished_granite`, `white_terracotta`, `calcite`, `terracotta`, `brown_terracotta`, `smooth_stone`. Decor/function: `glowstone`, `lantern` (hanging true/false), `oak_leaves` & `flowering_azalea_leaves` (persistent true), `vine` (facing states), `dirt`. All verified with `$MCD blocks --check` (none unknown).

## VOCABULARY
- `octRing(g, rIn, rOut, y0, y1, block)`: fill cells inside outer octagon and outside inner octagon (|dx|,|dz|,|dx|+|dz| tests about centre 31.5).
- `archCut(g, face, t0..t1, y)`: skip cells with |t|<=6 below y19 or t²+(y-19)²<=6.5² (carve by not placing).
- `archivolt(g, face, side)`: cut_sandstone ring 6.5<√(t²+(y-19)²)<=7.5, jambs |t|=7 y3..19, impost, chiseled keystone.
- `corinthianCol(g, cx, cz, shaft)`: 4x4 base sandstone y1 + smooth_sandstone y2, 2x2 shaft y3..27 (granite, or white_terracotta y3..18 for the peristyle), capital chiseled_sandstone 4x4, abacus smooth_sandstone.
- `peristyleCol(g, x, z)`: pedestals, shaft, capitals per Plot 1 table.
- `cornice(g, box)`: upside-down smooth_sandstone_stairs on the outer edge, bottom slabs on ledge.
- `reliefPanel(g, face)`: sunken 15-wide panel, alternating chiseled/cut columns, three 1x3 white_terracotta figures.
- `statuePier(g, vertex)`: 2x2 cut_sandstone strip, white_terracotta body, calcite head.
- `domeShell(g)`: spheroid shells by normalized radius, ribs, step rings, crown disc.
- `coffers(g)`: 32 sectors, every 3 courses; inner-layer cells left air; glowstone in middle layer.
- `medallion(g)`: floor pattern at y 0.
- `planterBox(g, x0,x1,z0,z1)`: hollow box with recessed panels, dirt, heaped leaves, vines.
- `weepingFigure(g, x, z, armDir)`: per Plot 1 table.
- `niche(g, face)`: carve by not placing, chiseled sill, lantern on sill.
- `blindArch(g)`: carve + archivolt + keystone for hall.
- `shedRoof(g)`: stair/slab rows per ROOFS table.
- `lampStandard(g, x, z)`: pedestal, wall posts, lantern.

## ROOMS
No enclosed rooms; two walk-through spaces for lighting/mob-proofing checks.

## PARTS (6)
1. Rotunda ring + ground + medallion (parts/ring.mjs)
2. Rotunda columns, arch ornament, entablature (parts/columns.mjs)
3. Attic, relief, dome, coffers (parts/dome.mjs)
4. Peristyle bay + end columns/entablature (parts/peristyle.mjs)
5. Planter boxes, figures, end pier niches (parts/planters.mjs)
6. Exhibition hall bay, roof, lamps (parts/hall.mjs)

## Notes
Stay in plots; carve by not placing; use stairs facing outward; leaves persistent.

- ring.mjs: ring built y1..33 incl. y30 cut_sandstone architrave band and y31..33 smooth (no cornice stairs, no archivolt); column base 4x4 cells left clear at y1..2; own local face/arch test (B imported from build library, not vocab.mjs). Part 1 done: elements 1,2,9.
