# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
- [ ] P1 [ ] P3 [ ] P4 [ ] P2 [ ] P5 [ ] P6

## Notes for workers
- Build in plot-local coordinates; stay on # cells; ground y 3 (plot 0; 1-2 at the west edge) / 0 (plot 1): lay plinth down to ground.
- Never exceed y390 (plot 0) / y400 (plot 1). Keep reserved cells (aircraft lights, lit-window cells) as the plan says.
- 1.21.1 only; `chain` not iron_chain; no pale oak. Hang lanterns from solid blocks.
- Light every roof/terrace (spawn proofing); lights every 6x6 in decks.
- Fins must read continuous; no horizontal banding on the Sky Tower outside.
- Mast: keep lightning_rod at y396 top, off the red-lamp cells y397..398 (plan RESERVED).
```

### elements.md

```markdown
# elements.md — REQUIRED ELEMENTS (plot-local coordinates, as plan.md)

Part keys: P1 nanshan-shell, P2 nanshan-crown, P3 breeze-podium, P4 sky-shell, P5 sky-crown, P6 lights-and-grounds.
Vocab names are the helpers in plan.md VOCABULARY.

## Nan Shan Plaza (plot 0)
- [ ] Sheer tower shaft y19..352, 64x64 at x166..229 z12..75 — shaft shell is gray_stained_glass on the plane 1 back
  (x167/x228/z13/z74), no solid fill inside (floor slab y352 only); P1; `finFace`.
- [ ] Vertical pale fins every 2nd cell on the outer plane, y19..352: `smooth_quartz` column per fin, glass between;
  every 4th floor band (y 19+28k .. +6) black_stained_glass; P1; `finFace`, `floorLine`.
- [ ] Floor lines every 7 (y19,26..345): light_gray_concrete flush in glass plane; P1; `floorLine`.
- [ ] Four chamfered corners: triangle dx+dz<6 removed; sawtooth fin+glass step per cell; P1; `chamferCorner`.
- [ ] Centre reveal slot 6 wide x3 deep, full height, on all four faces (N/S x195..200; E/W z41..46): back wall
  light_gray_stained_glass, orange_terracotta spandrel at each floor line, side walls smooth_quartz; P1; `revealSlot`.
- [ ] Glass lobby base y4..18 (T-L x156..239 z6..77, +x240..245 z24..59): glass between quartz_pillar piers every 6 one
  proud, lit inside (sea_lantern ceiling grid); roof terrace y18 with glass_pane rail, planters; P1/P6; `lobbyGlass`, `planter`, `deckLight`.
- [ ] Entrances: S main z77 x190..205 (4 revolving-style glass door bays, doors both halves, quartz frame), N z6, E x245 z38..45; P1; `doorBay`.
- [ ] Porte-cochère canopies T-N/T-S (x168..185, x210..221; z0..5 / z78..83): 4 round quartz_pillar piers each, quartz slab canopy y11..12, hanging-from-block lanterns under; P6; `canopyPier`.
- [ ] Wheat-ear crown y353..381: fins continue, peak toward the reveal (top = 381 − dist/2, min 366), quartz to y365 then quartz_pillar, end_rod caps; open, no glass; P2; `crownFin`.
- [ ] Crown lit white-gold: pearlescent_froglight one cell inside each fin in roof slab y352, ochre_froglight every 3rd fin base y353; P2; `crownGlow`.
- [ ] Roof slab y352 gray_concrete + plant box x180..215 z26..61 y353..364 (hidden inside crown); P2.
- [ ] Four red aircraft lights (195,382,12) (200,382,12) (195,382,75) (200,382,75): lit redstone_lamp, red_stained_glass on 4 sides + top; P2; `aircraftLight`.
- [ ] Scattered lit windows (1 in 4-5 bays warm, 1 in 6 cool, set 1 behind glass), S and E faces densest; P6; `litWindows`.
- [ ] Breeze podium P-A y3..18: plinth y3 polished_andesite; shop storey y4..8 glass set back 2 behind quartz_pillar colonnade every 6; fascia y8 smooth_quartz with shop-name plaques every 12 (S, W, N faces); P3; `shopFront`, `plaqueFascia`.
- [ ] Gold perforated screen on P-A y9..18 and P-B y19..32 (lattice offset 2): yellow_terracotta field, open birch_trapdoor diamond lattice, gold_block studs at nodes every 4, glass behind with 1-in-4 lit bays; P3; `goldScreen`.
- [ ] P-C top dark-glass box y33..45: black_stained_glass, gray_concrete mullions every 3, smooth_stone bands y37,y41, coping y45..46; 1 in 5 bays warm; P3; `darkGlassBox`.
- [ ] Cantilevers: P-B north (z12..15, y19 quartz soffit + sea_lantern downlights every 4); P-C south (z72..79, y33); P3; `soffit`.
- [ ] Roof terraces (P-A W x0..5 & S z72..83 y19; P-B E x84..101 & N z12..23 y33): smooth_stone deck, glass_pane rail, planters, sea_lantern flush every 6; café pergola x88..99 z14..21 y34..37; P3/P6; `terraceDeck`, `planter`, `pergola`.
- [ ] P-C top deck y46 with coping, mechanical box x30..49 z40..59 y46..50 gray_concrete, lights every 6; P3.
- [ ] South kiosk P-K x18..29 z84..89 y3..10 glass box, slab roof y10, lit; P3; `kiosk`.
- [ ] Link atrium L x102..155 z24..59 y3..22 glass/iron mullions every 6, glass-and-steel roof grid y22, rail y23, sea_lantern ceiling; doors z24/z59 x124..133; P3; `atriumRoof`.
- [ ] Covered walk north W x102..107 z12..23 y3..10: quartz_pillar piers every 6, smooth_quartz canopy y9..10, lanterns hung under; P3; `coveredWalk`.
- [ ] West-edge slab ramps x0..11 (ground 1-2 to street 4): half steps, 3 then 2-long landing, 3 wide; P6; `slabRamp`.

## Sky Tower (plot 1)
- [ ] Podium S-P z0..50 y0..41 rounded N end per map: polished_andesite plinth, polished_diorite piers every 6 one proud, light_gray_stained_glass between, smooth_stone bands every 5, coping y40..41; P4; `podiumFace`.
- [ ] Lit lobby Songgao Rd (W): glass plane x3 z18..50 y1..8, doors z26..41; canopy x0..2 y9..10 smooth_quartz with sea_lantern underside; P4/P6; `lobbyGlass`, `doorBay`.
- [ ] Waist link S-W x9..47 z51..65 y0..30 glass box, iron_block mullions every 3, terrace y30 rail y31; P4.
- [ ] Tower shaft x1..55 z66..121 y0..343, corners rounded r9 (quarter circles centred (10,75),(46,75),(10,112),(46,112)); P4; `roundedPlan`.
- [ ] Continuous vertical ribs: white_concrete, every 2nd cell on flat faces, every cell on the curves, floor to crown, no horizontal bands; cyan_stained_glass 1 back; floor lines light_gray_stained_glass every 7 (y15..337); P4; `ribFace`.
- [ ] Taper: plane steps in 1 at y316, 330, 344 (x4..52 z69..118 above), rib tops capped smooth_quartz_slab; P4; `taperStep`.
- [ ] Double-height lit lobby y1..14 glass between quartz piers every 3; main W x0..2 z84..103; S z121 x20..36; P4; `lobbyGlass`.
- [ ] Observatory The Sky Taipei y344..371: rib cage to y376, white_stained_glass behind, shroomlight/ochre_froglight ceiling grids y357,y371 (warm lantern); P5; `observatory`.
- [ ] Stepped glass hip roof y372..384 (x6..50 z71..116 → x18..38 z83..104), white_stained_glass with iron_block diagonal ribs; P5; `glassHip`.
- [ ] Mast: iron_block 3x3 y385..388, 1x1 to y396 at (28,z93), lightning_rod top, end_rod rungs; P5; `mast`.
- [ ] Red aircraft light (27..29,397..398,92..94): redstone_lamp lit in red_stained_glass, plan RESERVED cells; P5; `aircraftLight`.
- [ ] Scattered lit windows warm/cool on S and E faces; podium lit shopfronts and roof garden (moss, azalea, lights every 6); P6; `litWindows`, `planter`, `deckLight`.
```

### rooms.json

```json
{"entrance":[198,4,78],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "fin": ["smooth_quartz", "smooth_quartz_slab", "smooth_quartz_stairs", "quartz_pillar", "quartz_slab"],
    "glass": ["gray_stained_glass", "black_stained_glass", "light_gray_stained_glass", "cyan_stained_glass", "white_stained_glass", "red_stained_glass", "glass"],
    "pane": ["glass_pane", "light_gray_stained_glass_pane", "gray_stained_glass_pane"],
    "concrete": ["light_gray_concrete", "gray_concrete", "white_concrete"],
    "stone": ["smooth_stone", "smooth_stone_slab", "polished_andesite", "polished_andesite_slab", "polished_diorite", "polished_diorite_slab", "stone_bricks"],
    "gold": ["yellow_terracotta", "orange_terracotta", "gold_block", "birch_slab"],
    "metal": ["iron_block"],
    "light": ["sea_lantern", "ochre_froglight", "pearlescent_froglight", "shroomlight", "glowstone"],
    "planting": ["moss_block", "flowering_azalea", "oak_leaves"]
  },
  "objects": ["oak_door", "birch_door", "birch_trapdoor", "iron_bars", "lightning_rod", "end_rod", "redstone_lamp", "lantern"]
}
```

### make.sh

```sh
#!/usr/bin/env bash
# Makes build.nbt from scratch: node build.mjs writes a temp file, which then moves into place.
set -euo pipefail
cd "$(dirname "$0")"
tmp="$(mktemp ./build.XXXXXX)"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Builds the whole site (argv[2] = output .nbt): the grid, the ground, then the six parts in plan.md's order.
// Parts write plot-local coordinates (plan.md); the views here move them into the grid (margin; plot 1 by PLOT1_X).
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { GRID, PLOT0, PLOT1, ANDESITE, groundTop, onFootprint, onPlot1, withMargin } from "./vocab/base.mjs";

// plan.md's PARTS, in build order: [name, module, plot] (plot "both" writes its own plots' coordinates).
const PARTS = [
  ["Nan Shan tower shell", "parts/nanshan-shell.mjs", 0],
  ["Breeze podium", "parts/breeze-podium.mjs", 0],
  ["Sky Tower shell", "parts/sky-shell.mjs", 1],
  ["Nan Shan crown", "parts/nanshan-crown.mjs", 0],
  ["Sky Tower crown", "parts/sky-crown.mjs", 1],
  ["Lights and grounds", "parts/lights-grounds.mjs", "both"],
];

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// A part whose module isn't written yet (another copy is still working) is left empty, not an error.
async function loadPart(module) {
  const path = fileURLToPath(new URL(module, import.meta.url));
  if (!existsSync(path)) { console.warn(`${module}: not written yet, part left empty`); return () => {}; }
  const mod = await import(path);
  return typeof mod.build === "function" ? mod.build : () => {};
}

// The ground: each footprint cell is solid polished andesite from y 0 up to its ground top (plinth to ground).
function layGround(g) {
  for (const plot of [PLOT0, PLOT1]) {
    const v = plot.id === 1 ? onPlot1(withMargin(g)) : withMargin(g);
    for (let z = 0; z < plot.d; z++) for (let x = 0; x < plot.w; x++) {
      const top = groundTop(plot.id, x, z);
      if (top == null || !onFootprint(plot.id, x, z)) continue;
      for (let y = 0; y <= top; y++) v.set(x, y, z, ANDESITE);
    }
  }
}

const g = new Grid(GRID, { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);
const list = [];
for (const [name, module, plot] of PARTS) {
  const build = await loadPart(module);
  // plot 1 parts get onPlot1 on top of the margin: their plot-local x is site x minus PLOT1_X
  list.push([name, plot === 1 ? (view) => build(onPlot1(withMargin(view))) : (view) => build(withMargin(view))]);
}
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared by every part and by build.mjs: palette ids, plan.md's site coordinates, the footprint and ground maps, rng, and the views
// that move plan coordinates into the grid. Parts write PLOT-LOCAL coordinates (plan.md): plot 0 is the site origin, plot 1 starts at
// x PLOT1_X of the site (onPlot1). build.mjs adds the MARGIN (withMargin), so parts never see grid coordinates.

/** Site size in blocks [x, y, z] from plan.md (x 0..308, y 0..400, z 0..126). */
export const SITE = [309, 401, 127];

/** Empty blocks around the site: a roof on a wall at the site edge grows the grid by one, so the edge needs room. */
export const MARGIN = 2;

/** Grid size build.mjs creates: the site plus MARGIN on each side in x and z. */
export const GRID = [SITE[0] + 2 * MARGIN, SITE[1], SITE[2] + 2 * MARGIN];

/** Plot 0, Taipei Nan Shan Plaza: site origin, size in blocks, top y. */
export const PLOT0 = { id: 0, x0: 0, z0: 0, w: 248, d: 90, maxY: 390 };

/** Plot 1, Taipei Sky Tower: site origin, size in blocks, top y. */
export const PLOT1 = { id: 1, x0: 252, z0: 0, w: 57, d: 127, maxY: 400 };

/** Site x of plot 1's local x = 0. */
export const PLOT1_X = PLOT1.x0;

/** True if plot-local block (x, z) of plot (0 or 1) is a footprint cell ('#'): build only there. */
export const onFootprint = (plot, x, z) => ...

/** Top y of the ground at plot-local block (x, z) of plot (0 or 1), or null where there is no ground. */
export const groundTop = (plot, x, z) => ...

/** A view of grid g in which every write and read is shifted by (dx, 0, dz): the coordinates passed in are offset. */
export function shiftView(g, dx, dz)

/** A view of grid g where x and z are site coordinates (plan.md's, origin at the site corner): adds the MARGIN. */
export const withMargin = (g) => ...

/** A view of grid g where x is plot-1-local: adds PLOT1_X. Give it a withMargin view to reach grid coordinates. */
export const onPlot1 = (g) => ...

/** A seeded rng(seed): returns a function giving floats in [0, 1); the same seed gives the same build. */
export function rng(seed)

// Palette: every id is in palette.json (roles or objects) and was checked against 1.21.1.
// Fins, frames, canopies
export const FIN = "smooth_quartz";

export const FIN_SLAB = "smooth_quartz_slab";

export const FIN_STAIRS = "smooth_quartz_stairs";

/** Quartz column: colonnade piers, crown fins above y365, porte-cochère posts. */
export const PILLAR = "quartz_pillar";

export const CANOPY_SLAB = "quartz_slab";

// Glass
export const GLASS_GRAY = "gray_stained_glass";

export const GLASS_BLACK = "black_stained_glass";

export const GLASS_LIGHT_GRAY = "light_gray_stained_glass";

export const GLASS_CYAN = "cyan_stained_glass";

export const GLASS_WHITE = "white_stained_glass";

export const GLASS_RED = "red_stained_glass";

export const GLASS_CLEAR = "glass";

export const PANE_CLEAR = "glass_pane";

export const PANE_LIGHT_GRAY = "light_gray_stained_glass_pane";

export const PANE_GRAY = "gray_stained_glass_pane";

// Concrete, stone, plinth
export const CONCRETE_LIGHT_GRAY = "light_gray_concrete";

export const CONCRETE_GRAY = "gray_concrete";

export const CONCRETE_WHITE = "white_concrete";

export const STONE = "smooth_stone";

export const STONE_SLAB = "smooth_stone_slab";

/** The plinth on both plots, and the ground fill under the footprint. */
export const ANDESITE = "polished_andesite";

export const ANDESITE_SLAB = "polished_andesite_slab";

export const DIORITE = "polished_diorite";

export const DIORITE_SLAB = "polished_diorite_slab";

export const BRICKS = "stone_bricks";

// Gold screen
export const TERRA_YELLOW = "yellow_terracotta";

export const TERRA_ORANGE = "orange_terracotta";

export const GOLD = "gold_block";

/** Open, lying on the face: the screen lattice. */
export const TRAPDOOR_BIRCH = "birch_trapdoor";

export const SLAB_BIRCH = "birch_slab";

// Metal
export const IRON = "iron_block";

export const IRON_BARS = "iron_bars";

export const LIGHTNING_ROD = "lightning_rod";

export const END_ROD = "end_rod";

// Light (functional)
export const SEA_LANTERN = "sea_lantern";

export const FROGLIGHT_OCHRE = "ochre_froglight";

export const FROGLIGHT_PEARL = "pearlescent_froglight";

export const SHROOMLIGHT = "shroomlight";

export const GLOWSTONE = "glowstone";

/** Lit (lit: true) at the aircraft lights; enclosed by red glass. */
export const REDSTONE_LAMP = "redstone_lamp";

/** Hang with hanging: true from a solid block (this build has no chain). */
export const LANTERN = "lantern";

// Planting
export const MOSS = "moss_block";

export const AZALEA = "flowering_azalea";

/** Use with persistent: true. */
export const OAK_LEAVES = "oak_leaves";

// Doors (both halves, facing out)
export const DOOR_OAK = "oak_door";

export const DOOR_BIRCH = "birch_door";
```

### vocab/h1.mjs

```js
// Vocabulary helpers, batch 1 (plan.md VOCABULARY): finFace, revealSlot, canopyPier, aircraftLight, shopFront,
// soffit, pergola, coveredWalk, roundedPlan, observatory.
//
// Contract, for every helper: position and facing come in as arguments; it writes only inside the footprint box it is
// given (x0..x1, y0..y1, z0..z1, inclusive); it writes only into air unless o.over is true; it returns { placed, blocked }
// where blocked lists the footprint cells that were not air (left alone). Face helpers take the face the work sits on
// ("north" = the low-z plane, "south" = high z, "west" = low x, "east" = high x).

/**
 * Outer fin plane on one face of the shaft: finMat every second cell (even offset from the span's start corner) on the
 * face plane, glass one cell back on every cell; every 4th floor band (7 high, from y0) uses the accent glass.
 * o: { x0,x1,y0,y1,z0,z1, finMat, glassMat, accentMat, accentEvery }. Call floorLine before this so its rows stay.
 */
export function finFace(g, face, o)

/**
 * Centre reveal on one face: a slot from span `from`..`to` (along the face), cut `depth` cells back. Carved by not
 * placing: the slot's own cells are left air. Back wall light_gray_stained_glass with orange_terracotta at each floor
 * line (every 7 from y0); side walls smooth_quartz. Pass the slot's span and the shaft box.
 * o: { from, to, depth = 3, y0, y1, over }. Give the slot's air before finFace has run on it (finFace skips it).
 */
export function revealSlot(g, face, box, o)

/**
 * A porte-cochère pier: quartz_pillar column of height h standing on [x, y, z], a 3x3 quartz_slab canopy on its top
 * (bottom slabs at y + h), and one lantern hanging from the canopy beside the pier (x + 1). Footprint: 3x3 by h + 1.
 */
export function canopyPier(g, [x, y, z], h, o = {})

/**
 * An aircraft light: redstone_lamp lit at [x, y, z], red_stained_glass on its four sides at the same level and on top.
 * The lamp's base cell must rest on something already built (the caller's). Footprint: 3x3 by 2.
 */
export function aircraftLight(g, [x, y, z], o = {})

/**
 * A street storey set back from a face: quartz_pillar colonnade on the face plane every pierEvery cells, clear glass
 * `setback` cells back, a door bay every doorEvery cells (frame, door both halves facing out, glass transom), and a
 * warm sea_lantern ceiling strip one cell behind the glass along the top row y1.
 * box = the storey band: its face plane is the face's own edge, depth runs setback + 1 cells in from it.
 * o: { setback = 2, pierEvery = 6, doorEvery = 12, wood = "birch", over }.
 */
export function shopFront(g, face, box, o = {})

/**
 * A flat soffit at box.y0 (= box.y1): smooth_quartz underside over the box, sea_lantern flush every 4 cells both ways
 * from the box's corner. Use it for cantilever undersides.
 */
export function soffit(g, box, o = {})

/**
 * An open pergola over box: quartz_pillar posts on the edges at the corners and every 4 cells (from y0 to y1 - 1),
 * an open birch_trapdoor lattice on every second column at the roof level y1, and lanterns hanging under a quartz_slab
 * beam at every fourth cell pair (the slab is what the lantern hangs from). Footprint: box.
 */
export function pergola(g, box, o = {})

/**
 * A covered walk: quartz_pillar piers on the two long sides (x0 and x1) every 6 cells along z (from z0, and at z1),
 * from y0 + 1 up to y1 - 2; a smooth_quartz canopy across the whole box at y1 - 1, with a smooth_quartz_slab cap at y1;
 * lanterns hung from the canopy every 6 cells along z on the middle line. y0 is the floor block (left alone).
 */
export function coveredWalk(g, box, o = {})

/**
 * The arc cells of a rounded shaft corner: cells whose distance from the arc centre (cx, cz) rounds to r, in the quadrant
 * of the given corner ('nw' | 'ne' | 'sw' | 'se': the arc bows toward that corner). Returns [[x, z], ...] from one end of
 * the arc to the other. Pure: writes nothing. Used for the rib cells on the curve (every cell).
 */
export function roundedPlan(cx, cz, r, corner)

/**
 * An observatory lantern: decks (smooth_stone floors) at y0 and y0 + 14, ceiling grid of shroomlight / ochre_froglight
 * every 3 cells at y0 + 13 and y1, white_stained_glass one cell in behind the outer ring, and the outer ring as a rib
 * cage of white_concrete on every second cell, up to ribTop (default y1 + 5). Footprint: box, with y1 raised to ribTop.
 */
export function observatory(g, box, o = {})
```

### vocab/h2.mjs

```js
// Vocabulary helpers, batch h2 (plan.md VOCABULARY): floorLine, lobbyGlass, crownFin, litWindows, plaqueFascia,
// terraceDeck, kiosk, slabRamp, ribFace, glassHip. Blocks are plan.md PALETTE ids; states are valid for 1.21.1.
// Each helper takes its position as arguments, writes only inside the footprint it is given and only into air.
// The one exception is plaqueFascia: its letters go onto the fascia band's own smooth_quartz, and only there.
// No helper places furniture: the rooms are seen through glass, so interiors get light only.
// Boxes are {x0,x1,y0,y1,z0,z1}, inclusive. Faces are "north" (z0 side), "south" (z1), "west" (x0), "east" (x1).

/** floorLine(g, face, y, box): light_gray_concrete in the glass plane (one cell in) at height y, across the face.
 *  chamfer: the shaft's corner chamfer width (plan: 6); cells with dx+dz < chamfer from a corner are left out. */
export function floorLine(g, face, y, box, { depth = 1, chamfer = 0, block = "light_gray_concrete" } = {})

/** lobbyGlass(g, box, pierEvery, pierMat, opts): the lobby's glazed faces (default all four). Piers of pierMat on the
 *  outer edge every pierEvery cells and at the corners, one proud of the glass; glass one cell in; in one bay of every
 *  three a sea_lantern on the ceiling one cell behind the glass. opts: faces, glass ("glass"), lanternBays (3). */
export function lobbyGlass(g, box, pierEvery, pierMat, { faces = FACES, glass = "glass", lanternBays = 3 } = {})

/** crownFin(g, at, face, topY, opts): one wheat-ear fin on the outer plane of a crown face. at is the fin's x (north and
 *  south) or z (east and west); topY is computed by the caller (381 at the centre, 366 at the chamfers). smooth_quartz up to
 *  y365, quartz_pillar above, an end_rod cap (opts.cap false where an aircraft light takes the top). opts: box, y0 (353). */
export function crownFin(g, at, face, topY, { box, y0 = 353, cap = true } = {})

/** litWindows(g, face, density, box, opts): lit windows on one face, picked by a seeded rng. A bay is 6 cells wide and one
 *  floor band tall (floor lines at y0 + 7k). In 1 bay of every 4.5 a warm light (ochre_froglight, shroomlight, glowstone),
 *  in 1 of 6 a cool one (sea_lantern, pearlescent_froglight), one cell behind the glass at the band's middle height.
 *  density scales both rates: 1 is plan.md's rate; S and E faces are denser, so pass more than 1 there. */
export function litWindows(g, face, density, box, { y0 = box.y0, y1 = box.y1, seed = 1, bayW = 6, step = 7 } = {})

/** plaqueFascia(g, text, at, face, opts): shop-name banner lettering on a fascia band. plaque() with no board (material
 *  null): the letters are wall banners hung on the band's own smooth_quartz, one cell proud, and nothing else is touched.
 *  at is the origin [x,y,z] on the face (plaque's frame). The banners sit on the top row of the band, so for the plan's
 *  fascia at y8 pass at y7 (height 2, the default). opts: width (12), height (2), letter. */
export function plaqueFascia(g, text, at, face, { width = 12, height = 2, letter } = {})

/** terraceDeck(g, box, y, opts): a roof terrace. smooth_stone_slab (bottom) deck at layer y, laid on the roof below it;
 *  a glass_pane rail one high (y+1) along the edges given (default all four). Deck-light cells (every 6x6, offset 3 from
 *  the corner) are left air for the lighting part. opts: edges, rail, deck, lightGrid (6). */
export function terraceDeck(g, box, y, { edges = FACES, rail = "glass_pane", deck = "smooth_stone_slab", lightGrid = 6 } = {})

/** kiosk(g, box, opts): a glass pavilion (P-K). Glass walls on the box edge from y0 to y1-1, a flat quartz_slab roof at y1
 *  over the whole footprint, and sea_lantern on the ceiling inside every 3 cells. It lays no floor: the walls start on the
 *  ground an earlier part owns. opts: glass, roof, light. */
export function kiosk(g, box, { glass = "glass", roof = "quartz_slab", light = "sea_lantern" } = {})

/** slabRamp(g, from, to, width, opts): a pedestrian ramp of bottom slabs on full blocks, half a block per step, 3 steps
 *  then a 2-long landing. from is the low end [x,y,z] and to the high end; y is the top solid layer, so the walking layer is
 *  y+1 (plan: ground 1-2 to street 4 means from.y 1 or 2, to.y 3). The ramp runs along x or z from `from` to `to` (inclusive)
 *  and is `width` cells wide from from's perpendicular coordinate on. Throws if the run is too short to reach `to`. */
export function slabRamp(g, from, to, width = 3, { material = "polished_andesite" } = {})

/** ribFace(g, face, opts): one flat face of the tower shaft (or of a rounded curve as flat pieces). The outer plane gets a
 *  white_concrete column every `every` cells from the corner (2 on flat faces, 1 on curves); the plane one cell back is
 *  cyan_stained_glass, with light_gray_stained_glass floor lines at y0 + 7k. opts: box, y0, y1, every (2), step (7). */
export function ribFace(g, face, { box, y0 = box.y0, y1 = box.y1, every = 2, rib = "white_concrete", glass = "cyan_stained_glass", line = "light_gray_stained_glass", step = 7 } = {})

/** glassHip(g, box0, box1, y0, y1, opts): a stepped glass hip roof. Course y (y0 to y1) is a solid white_stained_glass
 *  slab whose sides step in one cell per course from box0 until they reach box1; iron_block ribs run along the four
 *  diagonals of every course, from each corner to the middle. */
export function glassHip(g, box0, box1, y0, y1, { glass = "white_stained_glass", rib = "iron_block" } = {})
```

### vocab/h3.mjs

```js
// Plan helpers (plan.md VOCABULARY, third batch). Each takes its position as arguments and writes only inside the
// footprint it is given. Writes go only into air unless opts.over names a block that may be replaced; a cell that
// is taken is skipped, and the helper returns how many blocks it placed.
// Boxes are [x0, y0, z0, x1, y1, z1] (inclusive); footprints that are flat use [x0, z0, x1, z1].
// `face` is the outward side of a wall: north = low z, south = high z, west = low x, east = high x.

/**
 * Chamfer one shaft corner. Cells with dx+dz < 6 are left as air (the chamfer). Cells with dx+dz = 6 get a smooth_quartz
 * fin; the glass one cell diagonally in, at (dx+1, dz+1), is gray_stained_glass, black on every 4th floor band.
 * corner = { x, z, sx, sz }: the corner cell, and the step (+1 or -1 on each axis) that points into the shaft.
 */
export function chamferCorner(g, { x, z, sx, sz }, y0, y1, opts = {})

/**
 * A door bay: two doors (lower and upper halves, facing out, hinges alternate) across w cells, a glass transom above
 * them up to the lintel, quartz_pillar jambs and a smooth_quartz lintel. at = the low-end floor cell of the opening;
 * face = the outward side. The opening itself must already be air (the shell recesses it).
 */
export function doorBay(g, at, face, w = 2, h = 3, wood = "birch", opts = {})

/**
 * Crown glow: pearlescent_froglight one cell inside each fin in the roof-slab row slabY, and ochre_froglight one cell
 * inside every third fin at slabY + 1. fins = [{ x, z, face }], face = the outward side the fin stands on. The roof
 * slab is placed earlier, so pass opts.over = ["gray_concrete"] to light through it.
 */
export function crownGlow(g, fins, slabY, opts = {})

/**
 * Gold perforated screen on one face of a mass. The face plane is yellow_terracotta with an open birch_trapdoor
 * diamond lattice (period 4, offset by latticeOffset) and gold_block studs at the nodes. One cell in is glass
 * (opts.glass, default "glass"); on every 4th bay a warm ochre_froglight sits two cells in.
 * box = the mass [x0, y0, z0, x1, y1, z1]; face = the outward side the screen sits on.
 */
export function goldScreen(g, box, face, latticeOffset = 0, opts = {})

/**
 * Dark glass box on the four walls of a glazed volume box = [x0, y0, z0, x1, y1, z1]: black_stained_glass field,
 * gray_concrete mullions every 3 (corners are mullions), smooth_stone bands at y0 + 4 and y0 + 8, and a smooth_stone
 * coping ring over the top opts.coping rows (default 2). About one bay in five is lit warm (ochre_froglight) one cell
 * inside the glass.
 */
export function darkGlassBox(g, box, opts = {})

/**
 * A 2x2 planter on a deck: moss_block soil in the deck-level cells at [x, y, z], and on the row above a checker of
 * flowering_azalea and persistent oak_leaves. (The plan's smooth_stone ring does not fit a 2x2 footprint, so it is left out.)
 */
export function planter(g, [x, y, z], opts = {})

/**
 * Atrium glass roof on the row y over the footprint [x0, z0, x1, z1]: iron_block ribs every 6 (and on the edges),
 * light_gray_stained_glass between, and a sea_lantern one row below at each bay centre.
 */
export function atriumRoof(g, [x0, z0, x1, z1], y, opts = {})

/**
 * A podium face on the plane of `face` of the mass box = [x0, y0, z0, x1, y1, z1]. Piers every 6 cells stand on the
 * plane; glass sits one cell behind them, with smooth_stone bands every 5 rows in the glass plane (so the piers stand
 * proud). The bottom row is a plinth and the top row a coping. opts.pierEvery, opts.bandEvery and opts.mats override
 * the defaults: pier, cap, plinth, band, glass.
 */
export function podiumFace(g, box, face, opts = {})

/**
 * Taper setback at row y: the old footprint [x0, z0, x1, z1] steps in by 1 on every side above this row, so its outline
 * is capped with smooth_quartz_slab (bottom) on the row above the rib tops. The caller builds the new, smaller ribs.
 * (Rounded corners are not handled: the cap is the flat outline.)
 */
export function taperStep(g, y, [x0, z0, x1, z1], opts = {})

/**
 * Observatory-style mast on a centre column: iron_block 3x3 base for 4 rows, a 1x1 iron_block column for 7 more,
 * end_rod rungs at the 2nd and 5th rows of the column on the four sides, and a lightning_rod on top.
 * centre = [cx, y0, cz] for the base's lowest cell; the rod sits at y0 + 11 (the plan's 396 when y0 = 385).
 */
export function mast(g, [cx, y0, cz], opts = {})
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
