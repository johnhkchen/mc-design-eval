# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# REQUIRED ELEMENTS (coordinates from plan.md; part numbers refer to PARTS in plan.md)

| # | element | construction | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Paving ground | `smooth_stone` y 0, all four plots | plots 0..3 | P1 | ground |
| 2 | Rotunda arch ring + 8 piers | `smooth_sandstone` ring (outer/inner octagon), `sandstone` plinth y1..2, carve arches by not placing | plot 0 y1..33 | P1 | octRing, archCut |
| 3 | 8 giant arches | 12 wide, springline y19, r6.5, archivolt `cut_sandstone`, keystone `chiseled_sandstone` y26, impost | 8 faces | P2 | archivolt |
| 4 | 16 giant Corinthian columns | `sandstone`/`smooth_sandstone` base, `granite` 2x2 shaft y3..27, `chiseled_sandstone` capital y28, `smooth_sandstone` abacus y29 | listed centres | P2 | corinthianCol |
| 5 | Entablature + cornice | architrave `cut_sandstone` y30, frieze `smooth_sandstone` 31..32 with tablets, cornice stairs y33 | plot 0 | P2 | cornice |
| 6 | Attic/drum with relief frieze | hollow octagon y34..45, sunken panels, white_terracotta figures, corner statue piers | plot 0 | P3 | reliefPanel, statuePier |
| 7 | Salmon-ochre ribbed dome | terracotta outer shell, brown_terracotta middle, 8 `polished_granite` ribs, step rings, crown disc | y46..68 | P3 | domeShell |
| 8 | Coffered underside + glowstone | inner coffer grid `smooth_sandstone`, glowstone in middle layer per coffer | dome | P3 | coffers |
| 9 | Floor medallion, walk-through interior | paving + granite ring + chiseled centre + glowstone | y 0 | P1 | medallion |
| 10 | Inner pilasters, entablature band | `cut_sandstone` | inner face | P2 | archivolt |
| 11 | Peristyle bay columns (paired, 2 rows) | `white_terracotta` 2x2 shafts y3..18, plinths, capitals | plot 1 | P4 | peristyleCol |
| 12 | Entablature (architrave, frieze, cornice) | per plan | plots 1,2 | P4 | cornice |
| 13 | Planter box with planting + vines | hollow `smooth_sandstone` box, dirt, leaves, vine | plots 1,2 y25..32 | P5 | planterBox |
| 14 | Weeping figures | pedestal, white_terracotta drapery, calcite head, sandstone_wall arm | box corners | P5 | weepingFigure |
| 15 | Closing pier with niches | plot 2, carved by not placing, lantern on sill | x89..94 | P5 | niche |
| 16 | Exhibition hall bay | wall, pilasters, blind arch, frieze, cornice, parapet | plot 3 | P6 | blindArch |
| 17 | Hall shed roof | granite stairs/slabs by hand | plot 3 | P6 | shedRoof |
| 18 | Lighting, no mob spawn | lanterns, glowstone, bottom slabs on ledges | all | P6 + P3 | lamp helpers |
| 19 | Corner lamp standards | pedestal, sandstone_wall, lantern | (6,6),(57,6),(6,57),(57,57) | P6 | lampStandard |
```

### rooms.json

```json
{"entrance":[31,1,-1],"street":null,"entrances":null,"rooms":[{"name":"Rotunda interior","box":[11,1,11,52,45,52]},{"name":"Peristyle walkway","box":[64,1,7,95,21,10]}]}
```

### palette.json

```json
{
  "roles": {
    "ground": ["smooth_stone"],
    "wall": ["smooth_sandstone", "smooth_sandstone_stairs", "smooth_sandstone_slab"],
    "base": ["sandstone", "sandstone_stairs", "sandstone_slab", "sandstone_wall"],
    "trim": ["cut_sandstone", "cut_sandstone_slab"],
    "carved": ["chiseled_sandstone"],
    "granite": ["granite", "granite_stairs", "granite_slab", "polished_granite"],
    "figure": ["white_terracotta", "calcite"],
    "dome": ["terracotta", "brown_terracotta"],
    "light": ["glowstone", "lantern"],
    "planting": ["oak_leaves", "flowering_azalea_leaves", "vine", "dirt"]
  },
  "objects": ["glowstone", "lantern", "oak_leaves", "flowering_azalea_leaves", "vine", "dirt"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: node build.mjs writes a temp file, which then replaces build.nbt.
set -e
cd "$(dirname "$0")"
tmp=$(mktemp ./build.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Palace of Fine Arts: the site grid, the paving, then every part in plan.md order. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, PLOTS, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order: the two rooms last, as the walk-through spaces inside the finished monument.
const PARTS = [
  ["Rotunda ring and ground", "parts/ring.mjs"],
  ["Rotunda columns and entablature", "parts/columns.mjs"],
  ["Attic and dome", "parts/dome.mjs"],
  ["Peristyle bay and end columns", "parts/peristyle.mjs"],
  ["Planters, figures, niches", "parts/planters.mjs"],
  ["Exhibition hall and lamps", "parts/hall.mjs"],
  ["room: Rotunda interior", "parts/room-1.mjs"],
  ["room: Peristyle walkway", "parts/room-2.mjs"],
];

const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
for (const p of Object.values(PLOTS)) g.fill([p.x0, 0, p.z0], [p.x1, 0, p.z1], SMOOTH_STONE);

// A part whose file is not there yet is skipped (its worker hasn't written it); a part that exists must build.
const list = [];
for (const [name, module] of PARTS) {
  if (!existsSync(module)) { console.log(`part ${name}: ${module} not written yet, skipped`); continue; }
  list.push([name, (await import(`./${module}`)).build]);
}

runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Palace of Fine Arts: palette ids as named constants (palette.json's ids only), site coordinates, and a seeded rng.
// SITE: full grid size [x, y, z] for the four plots (x 0..111, y 0..70, z 0..63).

// Palace of Fine Arts: palette ids as named constants (palette.json's ids only), site coordinates, and a seeded rng.
// SITE: full grid size [x, y, z] for the four plots (x 0..111, y 0..70, z 0..63).
export const SITE = [112, 71, 64];

// PLOTS: each module's inclusive x/z box and its top y (plan.md SITE table).
export const PLOTS = {
  rotunda: { x0: 0, x1: 63, z0: 0, z1: 63, yMax: 70 },
  peristyleBay: { x0: 64, x1: 79, z0: 0, z1: 23, yMax: 32 },
  peristyleEnd: { x0: 80, x1: 95, z0: 0, z1: 23, yMax: 32 },
  hall: { x0: 96, x1: 111, z0: 0, z1: 23, yMax: 34 },
};

// ROTUNDA_CENTRE: the rotunda's centre on x and z (dx = x - 31.5, dz = z - 31.5 in plan.md).
export const ROTUNDA_CENTRE = 31.5;

// rng(seed): a seeded random function returning floats in [0, 1); the same seed gives the same sequence.
export function rng(seed)

// Ground and paving
export const SMOOTH_STONE = "smooth_stone";

// Wall body, piers, attic, planter boxes, hall wall
export const SMOOTH_SANDSTONE = "smooth_sandstone";

export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";

export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";

// Plinths, base courses, recess backs
export const SANDSTONE = "sandstone";

export const SANDSTONE_STAIRS = "sandstone_stairs";

export const SANDSTONE_SLAB = "sandstone_slab";

export const SANDSTONE_WALL = "sandstone_wall";

// Architraves, archivolts, bands, pilasters, quoins
export const CUT_SANDSTONE = "cut_sandstone";

export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";

// Capitals, keystones, tablets, relief panels
export const CHISELED_SANDSTONE = "chiseled_sandstone";

// Rotunda giant column shafts; hall roof
export const GRANITE = "granite";

export const GRANITE_STAIRS = "granite_stairs";

export const GRANITE_SLAB = "granite_slab";

// Dome ribs; floor medallion
export const POLISHED_GRANITE = "polished_granite";

// Peristyle column shafts; statues, relief and weeping figures
export const WHITE_TERRACOTTA = "white_terracotta";

export const CALCITE = "calcite";

// Dome outer shell; coffer backs
export const TERRACOTTA = "terracotta";

export const BROWN_TERRACOTTA = "brown_terracotta";

// Hidden light
export const GLOWSTONE = "glowstone";

export const LANTERN = "lantern";

// Planting and decor
export const OAK_LEAVES = "oak_leaves";

export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";

export const VINE = "vine";

export const DIRT = "dirt";
```

### vocab/h1.mjs

```js
// Palace of Fine Arts: plan.md VOCABULARY helpers, part 1 (octRing, archivolt, peristyleCol, reliefPanel, domeShell,
// medallion, weepingFigure, blindArch, lampStandard). Each takes its position (and face or armDir where it has one)
// as arguments. A helper writes only its own footprint, and only into air: a cell an earlier part already filled is
// refused and counted, unless opts.over names the block ids it may replace (the medallion over the paving).
// Centres are cell-index centres as plan.md uses them: the rotunda is [31.5, 31.5], so a cell at x has dx = x - 31.5.
// Every helper returns { placed, refused }.

/**
 * Octagonal ring (rotunda arch ring and piers): cells inside the outer octagon (flat rOut) and outside the inner one
 * (flat rIn), y0..y1. Arch openings and archivolt cells are left for their own parts through opts.skip(x, y, z) -> true.
 */
export function octRing(g, [cx, cz], rIn, rOut, y0, y1, block, opts = {})

/**
 * Giant arch on one rotunda face: archivolt ring, keystone and jambs (side "out") or the inner ring and pilasters
 * (side "in"). s is the octagon flat it stands on (27 outer ring, 21 inner). The ring sits one layer proud of the face
 * for "out" and one layer inside it for "in", so the ring part keeps its face line exact.
 */
export function archivolt(g, [cx, cz], face, side, s, opts = {})

/**
 * Peristyle column (plots 1 and 2): 4x4 pedestal y1..2 (sandstone, smooth_sandstone), 2x2 white_terracotta shaft y3..18
 * with its origin at (x, z), 4x4 chiseled capital y19, 4x4 smooth_sandstone abacus y20. Two of these share one plinth.
 */
export function peristyleCol(g, x, z, opts = {})

/**
 * Attic relief panel on one face (plan.md ROOFS/FACADES attic row): a sunken panel |t| <= 7, y 36..42, one layer deep
 * in the attic's outer surface (flat s, 25); back of the recess alternates chiseled and cut columns; a cut_sandstone
 * frame 1 wide; three 1x3 white_terracotta figures at t = -4, 0, 4, y 37..39, in the recess layer.
 */
export function reliefPanel(g, [cx, cz], face, s = 25, opts = {})

/**
 * Dome shell over the attic (plan.md DOME): spheroid on base y, rx = rz = 23.5, ry = 22. Outer layer (normalised
 * radius 0.957..1.0) terracotta, middle layer brown_terracotta (coffer backs; the coffers helper owns the inner layer).
 * Also the Pantheon step rings at base and base+1, the crown disc (terracotta, our choice: plan gives no block), and
 * 8 polished_granite ribs one layer outside the shell at azimuths 0, 45 ... 315, y base+2..base+20.
 */
export function domeShell(g, [cx, cz], opts = {})

/**
 * Floor medallion flush in the ground layer (y, default 0), centre [cx, cz]: a 4x4 chiseled_sandstone centre with
 * glowstone at its middle 2x2; a polished_granite ring 8 < r <= 9 with 8 glowstone at the axes and diagonals; the
 * rest of r <= 9 smooth_stone. It replaces paving only when called with opts.over: ["smooth_stone"].
 */
export function medallion(g, [cx, cz], opts = {})

/**
 * Weeping figure at a box corner (plan.md Plot 1): cut_sandstone pedestal y25..26, white_terracotta drapery y27..29,
 * calcite head y30, and a sandstone_wall arm at y29 in the diagonal armDir (ne|nw|se|sw: toward the box corner).
 */
export function weepingFigure(g, x, z, armDir, opts = {})

/**
 * Exhibition-hall blind arch on the front wall plane zFace, centred on xc (plan.md Hall): the archivolt ring
 * 4.5 < r <= 5.5 above the springline y12, jambs at xc +- 4.5 for y 3..12, and the chiseled keystone at y17 over
 * xc +- 0.5. The recess itself (x xc+-4, z zFace..zFace+1) is carved by not placing, so this helper leaves it alone.
 */
export function blindArch(g, xc, zFace, opts = {})

/** Corner lamp standard (plan.md PARTS 6): chiseled_sandstone pedestal y1, sandstone_wall posts y2..3, lantern y4. */
export function lampStandard(g, x, z, opts = {})
```

### vocab/h2.mjs

```js
// Palace of Fine Arts helpers (plan.md VOCABULARY): archCut, corinthianCol, cornice, statuePier, coffers,
// planterBox, niche, shedRoof. Block ids are plan.md's PALETTE literals; states come from the build library.
// Every helper takes its position as arguments and writes only into air inside the footprint it is given,
// unless an option says otherwise (over: true, or carve: true for archCut and niche). Each returns how many
// blocks it placed (archCut returns the opening cell count; niche returns its carved cells too).

/** A round-headed opening: |t| ≤ 6 up to the springline y 19, then t² + (y−19)² ≤ 6.5² up to the crown (y 25). */
export function isArchOpening(t, y)

/**
 * Arch openings on one rotunda face inside box [x0, y0, z0, x1, y1, z1]. Carving is by not placing, so by default
 * this writes nothing and returns the number of opening cells; { carve: true } clears those cells to air.
 */
export function archCut(g, box, face, { centre = [31.5, 31.5], carve = false } = {})

/**
 * A giant Corinthian column on the 2×2 shaft whose centre is [cx, cz] (half-integers, e.g. 39.5: cells 39..40).
 * Base 4×4 sandstone at y 1 and smooth_sandstone at y 2; shaft granite to y 27, or white_terracotta to y 18 for the
 * peristyle; capital 4×4 chiseled_sandstone one above the shaft, abacus 4×4 smooth_sandstone above that.
 */
export function corinthianCol(g, cx, cz, shaft = "granite", { top = shaft === "granite" ? 27 : 18, over = false } = {})

/**
 * A cornice course on row box[1]. Cells of the box outside shape(x, z) that touch the shape get an upside-down
 * smooth_sandstone stair facing the shape; shape cells get infill (smooth_sandstone, or false). ledge (true = shape
 * cells, or a predicate (x, z)) gets a bottom smooth_sandstone_slab one row up. Default shape: the box inset by one.
 */
export function cornice(g, box,

/**
 * Attic corner statue pier: a 2×2 cut_sandstone strip from vertex {x, z} (its min corner) over y0..y1, with a
 * white_terracotta body (statueY..statueY+3) and calcite head (statueY+4) on the diagonal corner cell that
 * faces outward: ox, oz = -1 or 1.
 */
export function statuePier(g, { x, z, ox, oz }, { y0 = 34, y1 = 45, statueY = 37, over = false } = {})

/**
 * Coffered underside of a dome centred at [cx, cy, cz] (cell coordinates; dome rises from cy). Middle band: brown_terracotta
 * coffer backs with a glowstone at each coffer centre. Inner band: smooth_sandstone ribs on the sector lines and every
 * `every` courses; the rest stays air (the coffers). Outer shell is domeShell's job.
 */
export function coffers(g, [cx, cy, cz], { rx = 23.5, ry = 22, sectors = 32, every = 3, over = false } = {})

/**
 * Hollow planter box on the outer cells x0..x1, z0..z1 (walls 1 thick), floor y, rim y+6. Walls: cut_sandstone base
 * band and rim, smooth_sandstone between, a 6-cell sandstone recess on each face at y+2..y+4. Soil dirt y..y+4 inside.
 * Leaves heap over the inner 8×8 at y+5..y+7 (persistent), spill over the rim corners at y+7, vines down the outside
 * faces y+1..y+6.
 */
export function planterBox(g, x0, x1, z0, z1, { y = 25, over = false } = {})

/**
 * A niche carved into a pier: box = [x0, y0, z0, x1, y1, z1], opening on the `face` side (north = min z, south = max z,
 * east = max x, west = min x). The bottom row y0 is a chiseled sill; the rows above are carved (air) except the head:
 * the top row y1 keeps only its centre cells. A lantern stands on the sill at the opening. Returns { carved, placed }:
 * carved lists the air cells so the pier body can skip them; carve: true clears them.
 */
export function niche(g, face, box, { carve = false, lantern = true, over = false } = {})

/**
 * The hall's shed roof over x0..x1, rows z0..z1 (z1 is the eave row), high edge at yHigh. Rows by parity of (z − z0):
 * even → granite_stairs facing north at the surface course; odd → granite_slab one course down. The eave row z1 is
 * granite_stairs facing north one course below the last slope row. Returns the placed count.
 */
export function shedRoof(g, [x0, z0, x1, z1], yHigh = 24, { material = "granite", over = false } = {})
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
