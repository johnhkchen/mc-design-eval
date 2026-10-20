# plan.md — Taipei Nan Shan Plaza + Taipei Sky Tower (Xinyi, 1.21.1)

All coordinates are PLOT-LOCAL (each plot's x0,z0 = 0; y 0 = the plot's lowest ground). North = low z, south = high z,
east = high x. Exterior only. Camera: SE, 200 up, looking NW → priority order: crowns/roofs, SOUTH faces, EAST faces,
street fronts. Built in site orientation, no turning. Nothing outside the `#` cells; Nan Shan ≤ y 390, Sky Tower ≤ y 400.
Only 1.21.1 blocks (no pale oak; no chain of any kind; no `iron_chain`: hang lanterns straight from blocks).

## SITE

### Plot 0 — Taipei Nan Shan Plaza (248 × 90, ground y 1–3; tower half y 3 everywhere)
Ground: plinth/floor slab = the ground cell's y (3 over almost all of the plot; 2 at x 0..29; 1 at x 0..11, z 48..83).
Every mass lays its plinth from its floor down to the ground y of its cells (no floating, no burying).
Street floor (walking level) = y 4 everywhere (west edge: slab ramps x 0..11 make up 1–2 blocks, half steps only).
Streets: Xinyi Road N (z 0 side), Songren Road W of the plot / Taipei 101 beyond, Songgao-side lane E (x 247), lane S (z 89).

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| P-A Breeze podium, lower gold box | 0..101 | 3..18 | 16..83 | street storey y4..8 lit shopfronts set back 2 (glass plane x2 / z81 / z18); gold screen y9..18 |
| P-B middle gold box (shifted N + E) | 6..101 | 19..32 | 12..71 | cantilevers 4 north over the entry plaza z12..15; leaves W terrace x0..5 and S terrace z72..83 on P-A roof |
| P-C top dark-glass box (shifted S + W) | 0..83 | 33..45 | 24..79 | cantilevers 8 south over P-A's terrace (z72..79); leaves B-roof terraces x84..101 and z12..23 |
| P-K south kiosk / entry pavilion | 18..29 | 3..10 | 84..89 | glass box, flat slab roof y10, lit |
| L link atrium (podium → tower) | 102..155 | 3..22 | 24..59 | glass atrium, roof terrace y22 |
| W covered walk north (to Xinyi Rd) | 102..107 | 3..10 | 12..23 | open colonnade: piers at x102,x107 every 6 z; canopy slab y9..10 |
| T-L tower lobby base | 156..239 | 3..18 | 6..77 | plus x240..245 at z24..59; low glass base around the shaft; roof terrace y18 |
| T tower shaft | 166..229 | 19..352 | 12..75 | 64 × 64, chamfered corners (below), sheer, flat roof slab y352 |
| T-X crown frame (wheat ear) | 166..229 | 353..381 | 12..75 | open fin frame, peaked: centre fins to y381, corner fins to y366 |
| T-N north porte-cochère canopies | 168..185 and 210..221 | 3..12 | 0..5 | 4 round piers each (quartz_pillar), canopy slab y11..12 |
| T-S south porte-cochère canopies | 168..185 and 210..221 | 3..12 | 78..83 | same as T-N, the main entrances (camera side) |

Tower chamfer: at each of the 4 shaft corners remove the triangle of cells with (dx + dz) < 6 measured from the corner
(dx,dz = 0..5). The chamfer face is a 45° sawtooth of 1-cell steps, each step one fin + one glass cell.
Centre reveal ("split" of the wheat ear): on every face a vertical slot 6 wide, 3 deep, full height y19..381:
N/S faces x 195..200 (cut back to z15 on N, z72 on S); E/W faces z 41..46 (cut back to x169 on W, x226 on E).

### Plot 1 — Taipei Sky Tower (57 × 127, ground y 0 everywhere)
Floor slab y 0, street floor y 1. Songgao Road W (x 0 side), Xinyi Road S of the tower is Taipei 101's side.

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| S-P podium | footprint cells z 0..50 (rounded N end per map; x 0..56 at z18..50) | 0..41 | 0..50 | 8 storeys, roof slab y40, parapet y41 |
| S-W waist link | 9..47 | 0..30 | 51..65 | glass atrium link, roof terrace y30 |
| S-T tower shaft | 1..55 | 0..343 | 66..121 | rounded corners radius 9 (quarter-circle cut, centres at (10,75),(46,75),(10,112),(46,112)) |
| S-T taper | steps in 1 at y 316, 330, 344 | 316..371 | → x4..52, z69..118 at y344+ | the rib plane steps in each time (3 setbacks of 1) |
| S-O observatory (The Sky Taipei) | 4..52 | 344..371 | 69..118 | two decks (floors y344, y358), glass behind ribs, lit warm |
| S-R glass roof | 6..50 → 18..38 | 372..384 | 71..116 → 83..104 | stepped glass hip, in 1 per course on all sides |
| S-M mast | 27..29 base, 28 above | 385..396 | 92..94 base, 93 above | base 3×3 y385..388, then 1×1 to y396 |
| S-A aircraft light | 27..29 | 397..398 | 92..94 | lit redstone lamp in red glass (see MATERIALS) |
| S-E lobby canopy (Songgao Rd) | 0..2 | 9..10 | 18..50 | lobby glass set back to x3; canopy over the 3-cell walk |

## ROOFS
All roofs here are flat (modern/commercial) or open frames: no pitched roofs. Use `$MCD roof` preset `modern`
(`flat-parapet-modern`) only for the podium boxes (P-A, P-B, P-C, L, T-L, S-P, S-W); the crowns, glass roof and
canopies are built BY HAND in their own parts.

| Roof | Form | Height | Detail |
|---|---|---|---|
| P-A terraces (exposed W x0..5, S z72..83) | flat deck, smooth_stone_slab texture over smooth_stone | deck y19, parapet y19..20 glass rail (glass_pane) | planters (moss_block + flowering_azalea) every 8, sea_lantern flush in deck every 6×6 |
| P-B terraces (E x84..101, N z12..23) | flat deck | deck y33, rail y34 | as above; one café pergola (birch trapdoors on quartz posts) x88..99 z14..21 y34..37 |
| P-C top | flat roof, parapet | deck y46, parapet y46..47 smooth_stone coping | mechanical box x30..49 z40..59 y46..50 gray_concrete; deck lights every 6×6 |
| L atrium | flat glass-and-steel roof | y22, rail y23 | grid of light_gray_stained_glass in iron frame (iron_block ribs every 6) |
| T-L lobby base | flat terrace | y18, rail y19 | planted ring round the shaft, lights every 6 |
| Tower roof slab | flat, hidden inside crown | y352 | gray_concrete slab; plant box x180..215 z26..61 y353..364 gray_concrete |
| T-X crown | OPEN FIN FRAME (wheat ear) | y353..381 | fins continue the facade fins upward, no glass; heights peak to the reveal: fin top y = 381 − (distance of the fin from the face's reveal edge)/2, minimum 366 at the chamfers; the reveal slot itself rises open to y381 between its two edge fins; fin tops capped with end_rod (up) |
| S-P podium | flat, parapet | slab y40, parapet y41 | rooftop garden: lights every 6, moss/azalea planters, rail glass_pane |
| S-W link | flat | y30, rail y31 | lights every 6 |
| S-O / S-R observatory | ribs rise past the observatory as a parapet to y376; glass roof stepped hip y372..384 | | glass roof = white_stained_glass with iron_block hip ribs on the 4 diagonals; mast at the centre |

## FACADES

### Nan Shan tower shaft (T) — all four faces alike; S and E most visible
- Base: lobby y4..18 = full-height clear glass (glass) between quartz_pillar piers every 6, piers 1 proud; lit inside.
- Shaft y19..352: face plane = FINS. Fins on the outer plane (x166/x229/z12/z75) at every SECOND cell (even local
  offsets from the corner), 1 cell deep; glass 1 back (x167/x228/z13/z74) behind and between the fins.
  Fins = smooth_quartz (white) on the shaft; glass = gray_stained_glass, with every 4th floor's band in black_stained_glass
  for depth.
- Floor lines: every 7 (y 19, 26, … 345): a flush light_gray_concrete spandrel course in the glass plane (fins pass in front,
  unbroken: the fins read as continuous verticals, the floors as faint lines).
- Centre reveal: slot back wall = light_gray_stained_glass with orange_terracotta spandrels at each floor line (the warm
  copper strip of the photo); slot side walls = smooth_quartz. Reads as the vertical gold slit.
- Chamfers: sawtooth of fin + glass cells (same materials), each tooth 1 proud of the next.
- Crown y353..381: fins only (smooth_quartz to y365, quartz_pillar above), lit from inside: a ring of pearlescent_froglight
  in the roof slab y352 one cell inside every fin, ochre_froglight at every 3rd fin's base (y353) — white-gold glow.
- Red aircraft lights: 4, at the top of the two reveal-edge fins of the S and N faces (x195, x200; z12 and z75), y382.

### Breeze Nan Shan podium (P-A, P-B, P-C)
- P-A: street storey y4..8 = lit shopfronts: glass set back 2 behind a quartz_pillar colonnade on the face line every 6;
  fascia y8 = smooth_quartz band with shop names (plaques, banner letters) every 12. Gold screen y9..18 flush on the face
  line: perforated pattern = yellow_terracotta field with a diamond lattice of birch_trapdoor (open, lying on the face) and
  gold_block studs at lattice nodes every 4; behind it glass (lit windows at random 1 in 4 bays show through as glow).
  Plinth course y3 polished_andesite. Top edge y18 smooth_stone coping 1 proud.
- P-B: same gold screen (y19..32) but the lattice offset by 2 (so the two boxes read as separate). Underside of the
  north cantilever (y19, z12..15) = smooth_quartz soffit with sea_lantern downlights every 4. Coping y32 smooth_stone.
- P-C: dark glass box: black_stained_glass field, gray_concrete mullions every 3 (flush), smooth_stone floor bands y37, y41;
  coping y45..46 smooth_stone. South cantilever soffit (y33, z72..79) quartz with downlights. ~1 in 5 bays lit warm (ochre).
- L atrium: tall glass (light_gray_stained_glass) between iron_block mullions every 6, lit interior (sea lanterns at y21
  ceiling every 6). W covered walk: quartz_pillar piers, smooth_quartz canopy, lanterns hung under it every 6.

### Sky Tower (S-T)
- Lobby y1..14: clear glass between smooth_quartz piers every 3 (lit, double height). Main entrance on the W face
  (Songgao Rd) x0..2 z84..103 canopy y14..15; secondary S entrance z121 x20..36.
- Shaft y15..343: RIBS = white_concrete on the outer plane every 2nd cell (on the corner curves every cell, as the curve
  steps), continuous floor to crown, NO horizontal bands on the outside (sleek). Glass 1 back = cyan_stained_glass; floor
  lines every 7 (y15, 22, … 337) as light_gray_stained_glass courses behind the ribs (faint). Rib tops at each taper step
  capped with smooth_quartz_slab.
- Observatory y344..371: ribs continue as a cage to y376; glass behind = white_stained_glass, interior lit warm (shroomlight
  and ochre_froglight ceiling grid every 3 at y357 and y371), so the top reads as a glowing lantern.
- Podium S-P: glass and stone: polished_diorite piers every 6 (1 proud), light_gray_stained_glass between, smooth_stone
  floor bands every 5 (y10, 15, 20, 25, 30, 35), polished_diorite coping y40..41; plinth y0 polished_andesite. Lobby (W face,
  x3 glass plane, z18..50, y1..8) full glass, brightly lit; canopy x0..2 y9..10 smooth_quartz with sea_lantern underside.
- Waist link S-W: glass box, iron_block mullions every 3.

## MATERIALS
All checked with `$MCD blocks --check` (all valid; `chain` rejected → not used).

| Role | Block |
|---|---|
| Nan Shan fins (shaft) | smooth_quartz |
| Nan Shan fins (crown, above y365) / colonnade piers | quartz_pillar |
| Nan Shan glass | gray_stained_glass; accent floors black_stained_glass |
| Nan Shan spandrel lines | light_gray_concrete |
| Nan Shan reveal | light_gray_stained_glass + orange_terracotta |
| Gold screen field / lattice / studs | yellow_terracotta / birch_trapdoor (open) / gold_block |
| Podium top box glass / mullion | black_stained_glass / gray_concrete |
| Coping, bands, decks | smooth_stone, smooth_stone_slab |
| Plinth (both plots) | polished_andesite |
| Sky Tower ribs | white_concrete; rib caps smooth_quartz_slab |
| Sky Tower glass | cyan_stained_glass; floor lines light_gray_stained_glass |
| Observatory glass / roof glass / roof hip ribs | white_stained_glass / white_stained_glass / iron_block |
| Sky podium piers, coping | polished_diorite |
| Link/atrium glass, mullions | light_gray_stained_glass, iron_block |
| Street-level clear glass | glass, glass_pane (rails) |
| Mast | iron_block base, lightning_rod top, end_rod rungs |
| Crown light (white / gold) | pearlescent_froglight / ochre_froglight |
| Warm window light | ochre_froglight, shroomlight, glowstone (scattered, 1 in 4–5 bays, set 1 behind the glass) |
| Cool window light | sea_lantern, pearlescent_froglight (1 in 6 bays) |
| Lobby / soffit / deck light | sea_lantern |
| Aircraft light | redstone_lamp (lit:true) enclosed by red_stained_glass on 4 sides + top |
| Planters | moss_block, flowering_azalea, oak_leaves (persistent) |
| Paving (plaza cells not built) | smooth_stone, polished_andesite banding |

## OPENINGS
Exterior only; glass curtain walls are the windows. Doors (all with level thresholds at y4 plot 0 / y1 plot 1):
| Door | Where | Size |
|---|---|---|
| Nan Shan tower S main | z77 face of T-L, x190..205 (under T-S canopies) | revolving-door bays: 4 × (2 wide × 3 high) glass doors in a quartz frame |
| Nan Shan tower N | z6 face of T-L, x190..205 | same |
| Nan Shan tower E | x245, z38..45 | 2 × (2w × 3h) |
| Breeze shop entrances | P-A street storey: every 12 along z83 (S), x0 (W), z16 (N), 2w × 3h, in the recessed glass line | open fronts behind the colonnade |
| Breeze N main entry | z16 face, x40..55, under the P-B cantilever | 16w × 4h glass |
| Link atrium | z24 and z59 faces, x124..133 | 10w × 4h |
| Sky Tower lobby W | x3 glass plane, z84..103 (tower) and z26..41 (podium lobby) | 4 × (2w × 3h) each |
| Sky Tower S | z121, x20..36 | 3 × (2w × 3h) |
Approaches: all at grade; the plot-0 west edge (ground 1–2) gets slab ramps (3 slabs then 2-long landing, 3 wide)
into the shop doors along x0.

## RESERVED
- Glass plane cells behind fins/ribs: the shell builds glass; lit-window cells (1 in 4–5 bays, 1 behind the glass) are
  left AIR for the lighting part.
- Crown interior y353..381 inside T fins: air except the plant box; light cells at y352/y353 left for the lighting part.
- Aircraft-light cells: plot 0 (195,382,12) (200,382,12) (195,382,75) (200,382,75); plot 1 lamp (28,397,93), red glass
  at (27/29,397,93), (28,397,92/94) and (28,398,93); nothing above y 398.
- Shop signs: fascia band y8 on P-A faces left plain smooth_quartz for plaques.
- Deck-light grid cells (every 6×6) on every terrace left air in the deck course.
- Planters on terraces: 2×2 cells every 8 along the parapets, left air in the deck.

## FLOORS
| Mass | Floor levels (y) | Interior volume |
|---|---|---|
| P-A | 4, 9 (shop mezz), 14 | x2..99, y4..18, z18..81 |
| P-B | 19, 24, 28 | x7..100, y19..32, z13..70 |
| P-C | 33, 37, 41 | x1..82, y33..45, z25..78 |
| L atrium | 4 (open to y21) | x103..154, y4..21, z25..58 |
| T-L lobby | 4 (triple height to y18) | ring x157..238, z7..76 around the shaft |
| T shaft | 19 + 7k, k = 0..47 (19 … 348 → roof slab 352) | x167..228, z13..74 |
| S-P podium | 1 (lobby, to y9), 10, 15, 20, 25, 30, 35; roof 40 | footprint z0..50 inset 1 |
| S-W link | 1 (open to y29) | x10..46, z52..64 |
| S-T shaft | 1 (lobby to y14), 15 + 7k, k = 0..46 (15 … 337) | x2..54, z67..120 (shrinks with the taper) |
| S-O observatory | 344 (deck 1), 358 (deck 2), roof 372 | x5..51, z70..117 |

---
# DESIGNER SECTIONS

## PALETTE
Architect's MATERIALS table ids kept exactly (all checked valid, 1.21.1). Shape variants and functional blocks added:
| Role | Blocks |
|---|---|
| Fins / frames | smooth_quartz, smooth_quartz_slab, smooth_quartz_stairs, quartz_pillar (axis y), quartz_slab (canopies) |
| Glass | gray_stained_glass, black_stained_glass, light_gray_stained_glass, cyan_stained_glass, white_stained_glass, red_stained_glass, glass; panes: glass_pane, light_gray_stained_glass_pane, gray_stained_glass_pane |
| Concrete / stone | light_gray_concrete, gray_concrete, white_concrete, smooth_stone, smooth_stone_slab, polished_andesite (+_slab), polished_diorite (+_slab), stone_bricks |
| Gold screen | yellow_terracotta, orange_terracotta, gold_block, birch_trapdoor (open, facing = away from wall), birch_slab |
| Metal | iron_block, iron_bars, lightning_rod, end_rod |
| Light (functional) | sea_lantern, ochre_froglight, pearlescent_froglight, shroomlight, glowstone, redstone_lamp (lit true), lantern (hanging true, under a block; no chain) |
| Planting | moss_block, flowering_azalea, oak_leaves (persistent true) |
| Doors | iron_door? NO: use glass-door look = oak_door/birch_door both halves facing out; pillars quartz_pillar |
Rule: no air op; recess by not placing. Lit windows = leave air 1 behind glass and put a light block at the glass-plane back.

## VOCABULARY
- `finFace(g, face, {x0,x1,z0,z1,y0,y1, finMat, glassMat, accentEvery})`: outer plane every 2nd cell (even offset from corner) = finMat column y0..y1; glass plane 1 back all cells; every 4th floor band (7*4) uses black glass.
- `floorLine(g, face, y)`: light_gray_concrete in the glass plane (not the fin plane) at y = 19+7k.
- `chamferCorner(g, corner, y0, y1)`: skip cells dx+dz<6; for dx+dz=6 cells place fin outer, glass 1 inward, giving a 1-cell sawtooth.
- `revealSlot(g, face, span, depth=3, y0, y1)`: carve by not placing in the 6x3 slot; back wall light_gray_stained_glass, side walls smooth_quartz, orange_terracotta at floor lines.
- `lobbyGlass(g, box, pierEvery, pierMat)`: glass wall between pierMat pillars every n, piers 1 proud; interior cells at 1-in-3 bays get sea_lantern behind glass.
- `doorBay(g, at, face, w=2, h=3, wood)`: door both halves (lower/upper, same facing/hinge) in a quartz frame, level threshold, glass transom above to lintel.
- `canopyPier(g, at, h)`: quartz_pillar axis y, with quartz_slab canopy overhead and a lantern hanging from the canopy beside.
- `crownFin(g, x|z, face, topY)`: smooth_quartz to y365, quartz_pillar above, end_rod cap; top = 381 − dist/2 (min 366).
- `crownGlow(g, finList)`: pearlescent_froglight in y352 slab one cell inside each fin; ochre_froglight at y353 every 3rd fin.
- `aircraftLight(g, [x,y,z])`: redstone_lamp lit:true at centre; red_stained_glass on 4 sides and top; the base rests on the rail/fin top.
- `litWindows(g, face, density)`: pick pseudo-random bays (seeded), 1 in 4-5 warm (ochre_froglight/shroomlight/glowstone) and 1 in 6 cool (sea_lantern/pearlescent_froglight), placed 1 behind the glass; S and E denser.
- `goldScreen(g, box, face, latticeOffset)`: yellow_terracotta field; open birch_trapdoor diamond lattice lying on the face (diagonals of period 4); gold_block studs at nodes every 4; glass 1 behind; every ~4th bay a lit cell behind.
- `shopFront(g, face, y, setback=2, pierEvery=6)`: quartz_pillar colonnade on the face line, glass set back, warm lit interior strip (sea_lantern ceiling, candles-less) and shop door bays every 12.
- `plaqueFascia(g, text, at, face)`: plaque() with material null on the smooth_quartz band y8; banner letters (shop names e.g. BREEZE, NAN SHAN).
- `darkGlassBox(g, box)`: black_stained_glass field, gray_concrete mullions every 3, smooth_stone bands y37/y41, coping y45..46; 1-in-5 bays warm.
- `soffit(g, box, y)`: smooth_quartz underside with sea_lantern flush every 4.
- `terraceDeck(g, box, y)`: smooth_stone deck, smooth_stone_slab texture, glass_pane rail 1 high, sea_lantern flush every 6x6.
- `planter(g, at)`: 2x2 smooth_stone ring with moss_block fill and flowering_azalea / oak_leaves persistent on top.
- `pergola(g, box)`: quartz_pillar posts at the corners/every 4, birch_trapdoor roof (open, flat) y37, lanterns hung under.
- `kiosk`, `atriumRoof` (light_gray_stained_glass between iron_block ribs every 6 + sea_lantern), `coveredWalk` (pillars every 6, smooth_quartz canopy, hanging lanterns every 6).
- `slabRamp(g, from, to, width=3)`: bottom slabs on full blocks, 3 steps then 2-long landing.
- `podiumFace(g, face, ...)`: polished_diorite piers every 6 one proud, glass between, smooth_stone bands every 5, coping.
- `roundedPlan(cx,cz,r)`: quarter-circle cell list for the rounded shaft corners (radius 9; 7 for the tapered levels); ribs every cell on curves.
- `ribFace(g, face, {y0,y1})`: white_concrete column every 2nd cell outer plane, cyan_stained_glass 1 back, light_gray_stained_glass floor line every 7.
- `taperStep(g, y)`: move the outer plane in by 1 on all sides, cap old rib tops with smooth_quartz_slab.
- `observatory(g, box)`: two decks, ribs as cage to y376, white_stained_glass behind, shroomlight/ochre_froglight ceiling grid every 3 at y357 and y371.
- `glassHip(g, box0, box1, y0, y1)`: stepped hip 1 in per course; white_stained_glass; iron_block diagonal ribs.
- `mast(g, centre)`: iron_block 3x3 y385..388, 1x1 iron_block to y396, end_rod rungs, lightning_rod top y397 (within plan's reserved: lamp at y397..398 — keep rod OFF lamp cells, put rod at y396).

## ROOMS
Exterior-only: interiors are only what shows through glass. Each room gets a minimal lit fit-out.
(Coordinates plot-local; plot 0 unless named.)
- Nan Shan S lobby: x157..238 z7..76 y4..17 ring interior; sea_lantern coffers, a reception desk of quartz slabs, tall plants; seen through glass.
- Breeze shop arcade S: x2..99 z18..81? shop storey y4..8 behind glass; warm shopfront strips.
- Link atrium: x103..154 y4..21 z25..58, bright airy.
- Sky tower lobby (plot 1): x3..54 z67..120 y1..14, double-height, warm.
- Sky podium lobby (plot 1): x3..55 z18..50 y1..8.
- Sky observatory (plot 1): x5..51 z70..117 y344..371, warm lantern.

## PARTS (6, build order)
1. P1 nanshan-shell — shaft, chamfers, reveal, lobby base, doors.
2. P3 breeze-podium — boxes, gold screen, terraces, kiosk, atrium, walk.
3. P4 sky-shell — podium, link, shaft, taper, lobby.
4. P2 nanshan-crown — roof slab, crown fins, glow, aircraft lights.
5. P5 sky-crown — observatory, glass hip, mast, aircraft light.
6. P6 lights-and-grounds — lit windows, canopies, planters, ramps, street lights, signs, deck lights.

## Checklist
- [x] P1 [ ] P3 [ ] P4 [ ] P2 [ ] P5 [ ] P6

## Notes for workers
- Build in plot-local coordinates; stay on # cells; ground y 3 (plot 0; 1-2 at the west edge) / 0 (plot 1): lay plinth down to ground.
- Never exceed y390 (plot 0) / y400 (plot 1). Keep reserved cells (aircraft lights, lit-window cells) as the plan says.
- 1.21.1 only; `chain` not iron_chain; no pale oak. Hang lanterns from solid blocks.
- Light every roof/terrace (spawn proofing); lights every 6x6 in decks.
- Fins must read continuous; no horizontal banding on the Sky Tower outside.
- Mast: keep lightning_rod at y396 top, off the red-lamp cells y397..398 (plan RESERVED).
- P1 nanshan-shell: fins/glass/reveals built to y352 (roof slab y352 + crown are P2's); chamfer dx+dz=7 diagonal glazed locally; lobby roof y18 smooth_stone with deck-light cells (x-156)%6==3,(z-6)%6==3 left air for P6; lobby doors at glass plane (z76/z7/x244).
- P1 nanshan-shell: fins/glass/reveals built to y352 (roof slab y352 + crown are P2's); chamfer diagonal dx+dz=7 glazed locally; lobby roof y18 smooth_stone, deck-light cells (x-156)%6==3,(z-6)%6==3 left air for P6; lobby doors on the glass plane (z76/z7/x244).
