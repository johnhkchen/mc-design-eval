# THE SPACE NEEDLE: architect's plan (form, fixed)

Conventions: centre axis at cell (32, 32). `dx = x-32`, `dz = z-32`, `r = sqrt(dx²+dz²)`. A "disc r≤N" is
`circleCells(N)` around (32,32), and a "ring at r=N" is the cells with N-0.5 < r ≤ N+0.5. Azimuth θ is measured
clockwise from north (-z): direction `(sin θ, -cos θ)` in (x, z). The build is mirror-symmetric about the plane x = 32
(cell x ↔ 64-x). Nothing leaves x 0..63, z 0..63, y 0..259.

## SITE

| Item | Value |
|---|---|
| Plot | x 0..63, z 0..63; ground y 0 = `smooth_stone` over the whole plot (walk surface at y 1) |
| Street / front | NORTH (-z), x runs along the street. Elevator face, Pavilion door and ramp face north |
| Silhouette | hourglass of 3 leg pairs → waist y 120 → flare to saucer y 205..223 → stepped roof + shallow dome to y 235 → spire to y 258 |

Masses (every coordinate inclusive):

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| Ground | 0..63 | 0 | 0..63 | smooth_stone |
| Pavilion | disc r≤14 (walls), roof disc r≤15 | 1..8 | 18..46 | floor y1, glass wall y2..7, roof y8 |
| Pavilion approach | arc, see OPENINGS | 1 | ~14..18 | bottom slabs + full-block landing |
| Core (lattice) | 29..35 | 1..222 | 29..35 | 7×7; open shaft inside x30..34 z30..34 |
| Elevator shafts (2) | 29..30 and 34..35 | 2..222 | 27..28 | glass columns on the core's north face |
| Six legs | per LEG TABLE | 1..205 | per LEG TABLE | 2×2 each, smooth_quartz |
| Leg foot pads | leg cells ±1 (4×4) | 1 | — | smooth_quartz, under each leg |
| SkyLine deck | hexagon, apothem 16 (floor) | 41..48 | 16..48 | see below |
| Saucer throat | cone r 4→13 | 196..204 | — | core flares into the saucer |
| Saucer underside cone | cone r 14→30 | 205..211 | 2..62 | radiating ribs |
| Saucer floor / restaurant | disc r≤30 floor; glass at r=24 | 212..217 | 2..62 | |
| Deck floor / observation | disc r≤27 floor; glass at r=21 | 218..222 | 5..59 | outdoor deck r 22..27 |
| Halo | ring band r 28..30 | 212..222 | 2..62 | radial fins + hoops |
| Roof steps | discs r≤22, 20, 18, 16 | 223..226 | 10..54 | |
| Drum | disc r≤12 | 227..229 | 20..44 | orange band y228..229 |
| Dome | shallow dome r 12, base y230 | 230..235 | 20..44 | apex y235 |
| Spire | 32 | 236..258 | 32 | mast + end rods + sea lantern tip |

### LEG TABLE (the hourglass)

Pairs at θ = 180° (S, the back), 60° (NE), 300° (NW), so the north front looks between NE and NW straight at the
glass elevators. Pair centreline distance from the axis:

- y ≤ 120: `R(y) = 8 + 14·((120-y)/119)^1.3` (feet R 22, waist R 8)
- y > 120: `R(y) = 8 + 6·((y-120)/85)^1.5` (R 14 at y 205)

Each leg's centre = `(32,32) + R(y)·(sin θ, -cos θ) ± 2.5·(cos θ, sin θ)`; its 2×2 box starts at
`round(cx-0.5), round(cz-0.5)`. Compute it per y with exactly this rounding (it is mirror-exact about x=32). Key rows:

| y | R | Sa | Sb | NEa | NEb | NWa | NWb |
|---|---|---|---|---|---|---|---|
| 1 | 22.0 | 34..35, 54..55 | 29..30, 54..55 | 49..50, 18..19 | 52..53, 23..24 | 11..12, 23..24 | 14..15, 18..19 |
| 25 | 18.4 | 34..35, 50..51 | 29..30, 50..51 | 46..47, 20..21 | 49..50, 24..25 | 14..15, 24..25 | 17..18, 20..21 |
| 42 | 16.1 | 34..35, 48..49 | 29..30, 48..49 | 44..45, 21..22 | 47..48, 26..27 | 16..17, 26..27 | 19..20, 21..22 |
| 73 | 12.2 | 34..35, 44..45 | 29..30, 44..45 | 41..42, 23..24 | 43..44, 28..29 | 20..21, 28..29 | 22..23, 23..24 |
| 97 | 9.7 | 34..35, 41..42 | 29..30, 41..42 | 39..40, 25..26 | 41..42, 29..30 | 22..23, 29..30 | 24..25, 25..26 |
| 120 (waist) | 8.0 | 34..35, 40..41 | 29..30, 40..41 | 37..38, 25..26 | 40..41, 30..31 | 23..24, 30..31 | 26..27, 25..26 |
| 145 | 9.0 | 34..35, 40..41 | 29..30, 40..41 | 38..39, 25..26 | 41..42, 29..30 | 22..23, 29..30 | 25..26, 25..26 |
| 169 | 10.6 | 34..35, 42..43 | 29..30, 42..43 | 39..40, 24..25 | 42..43, 28..29 | 21..22, 28..29 | 24..25, 24..25 |
| 193 | 12.8 | 34..35, 44..45 | 29..30, 44..45 | 41..42, 23..24 | 44..45, 27..28 | 19..20, 27..28 | 22..23, 23..24 |
| 205 | 14.0 | 34..35, 46..47 | 29..30, 46..47 | 42..43, 22..23 | 45..46, 27..28 | 18..19, 27..28 | 21..22, 22..23 |

- The legs are continuous (each y's box overlaps or touches the one below; where the box jumps by 2 in one axis, fill the
  intermediate cell so the leg never breaks). Where a leg steps inward or outward, the exposed top of the cell it leaves
  gets a `smooth_quartz_stairs` (ascending toward the leg) or a bottom `smooth_quartz_slab`: no bare ledge.
- The legs end inside the saucer's underside at y 205 (they meet the cone there).
- **Pair ties** every 12: y 13, 25, 37, 61, 73, 85, 97, 109, 121, 133, 145, 157, 169, 181, 193: a 1-high row of
  bottom `smooth_quartz_slab` filling the gap between the two legs of each pair (S pair: x 31..33).
- **Radial ties** at y 73, 97, 121, 145, 169, 193: a line of bottom `smooth_quartz_slab` from each pair's inner
  face to the nearest core face (the S pair along x 31..33 to z 36; NE/NW along their own diagonal).

## ROOFS

No `$MCD roof` preset fits a round tower: every roof here is built by hand with the curved brushes (`disc`, `ring`,
`dome`), in the saucer part.

| Roof | Form | Levels |
|---|---|---|
| Pavilion | flat disc r≤15 at y 8 (1 over the glass wall = eave), rim ring r=15 `smooth_quartz_slab` (top) | y 8 |
| SkyLine | flat hexagon apothem 14 at y 48, its edge a bottom `smooth_quartz_slab` | y 48 |
| Saucer roof, stepped | y 223 disc r≤22 (1 overhang over the r=21 glass); y 224 r≤20; y 225 r≤18; y 226 r≤16; each step's outer ring cells `smooth_quartz_stairs` facing inward (rising to the centre) | 223..226 |
| Drum | disc r≤12, y 227 white, y 228..229 orange band | 227..229 |
| Dome | `dome(center [32,230,32], radius 12, profile "shallow", block smooth_quartz, edge "stairs")`, apex y 235 | 230..235 |
| Spire | x32 z32: y 236..239 `white_concrete`; y 240..257 `end_rod` (facing up); y 258 `sea_lantern` | 236..258 |

## FACADES

The tower reads the same from all sides (3-fold); the north is the front because the elevators are there.

**Legs**: plain warm-white 2×2 shafts, smooth stepped curve, thin slab ties; that is the whole ornament.

**Core** (x 29..35, z 29..35, y 1..222):
- Corner posts (29,29) (35,29) (29,35) (35,35) and a south spine (32, 35): `white_concrete`, full height. One
  `sea_lantern` in each corner post every 12 (y 7, 19, 31, ... 199).
- Faces between posts: `iron_bars` (the open lattice), with a `white_concrete` band ring at every tie level (y 13, 25, …).
- North face: two glass elevator shafts, x 29..30 and 34..35, z 27..28, y 2..222, solid `glass`; the gold car
  (`gold_block`) fills x 34..35, z 27..28, y 150..152 (the one gold car visible from the street).

**Pavilion** (y 1..8): floor y 1 disc r≤14 `smooth_quartz`; wall ring r=14, y 2..7 `glass`, with `white_concrete`
mullions every 30° from θ 15° (12 mullions); roof per ROOFS; a `white_concrete` band y 7 at r=14 under the eave.

**SkyLine** (hexagon, flat faces N, NE, SE, S, SW, NW; cell in hexagon of apothem a iff `|dz| ≤ a`,
`|0.866·dx - 0.5·dz| ≤ a`, `|0.866·dx + 0.5·dz| ≤ a`):
- y 41: soffit, apothem 15, `smooth_quartz` with `sea_lantern` every 5 cells (hidden lights, seen from below as a glow).
- y 42: floor, apothem 16 (the splayed white rim, it wraps the legs at the NE, S and NW flats).
- y 43..47: wall at apothem 13, `gray_stained_glass`, `white_concrete` posts at the 6 corners.
- y 48: roof per ROOFS, `sea_lantern` every 6 cells in it.

**Top house** (the saucer, the thing it must be read by):
- y 196..204 throat: shell where r grows 4 → 13 (r = 4 + (y-196)·9/8), `gray_concrete`.
- y 205..211 underside cone: layer y fills the annulus between r(y-1) and r(y), r(y) = 14 + (y-205)·16/7
  (14, 16.3, 18.6, 20.9, 23.1, 25.4, 27.7), `light_gray_concrete`. **24 radiating ribs** at θ = 0°, 15°, 30°… from
  r 4 to r 30: `smooth_quartz` one block proud below the soffit (the rib cell sits directly under the surface cell).
- y 212: floor disc r≤30, `smooth_quartz`, `sea_lantern` at r 10 and r 18 every 30°.
- y 213..217 restaurant: wall ring r=24 `gray_stained_glass`, `white_concrete` mullion at each rib azimuth.
  The ring r 25..27 outside it stays open (a shadow band under the deck).
- y 218: deck floor disc r≤27 `smooth_quartz`, a `sea_lantern` every 30° at r 26: the white floor slab line.
- y 219..222 observation: inner wall ring r=21 `black_stained_glass` with `white_concrete` mullions every 15°;
  outdoor deck r 22..27; glass rail ring r=27, y 219..220 `glass_pane`.
- **Halo** r 28..30, y 212..222: fins = radial lines of 3 cells (r 28, 29, 30) of `white_concrete`, y 213..221,
  one every 4° (90 fins, about every other cell at the rim). Hoops: the floor rim at y 212 and a top hoop at y 222,
  ring band r 28..30 of bottom `smooth_quartz_slab`; a thin mid rail ring r=30 at y 217 of `iron_bars`.
- Roof, drum (orange band), dome and spire per ROOFS.

## MATERIALS

| Role | Block |
|---|---|
| Legs, ties, floors, roof steps, dome ("astronaut white") | `smooth_quartz`, `smooth_quartz_stairs`, `smooth_quartz_slab` |
| Crisp white: core posts, mullions, halo fins, spire base | `white_concrete` |
| Core lattice, halo mid rail | `iron_bars` |
| Elevator shafts | `glass` |
| Elevator car (accent) | `gold_block` |
| Saucer underside soffit | `light_gray_concrete` |
| Saucer throat | `gray_concrete` |
| Restaurant / SkyLine glazing | `gray_stained_glass` |
| Observation glazing | `black_stained_glass` |
| Deck rail | `glass_pane` |
| Roof band ("galaxy gold") | `orange_terracotta` |
| Pavilion glazing | `glass` |
| Spire | `end_rod`, `sea_lantern` tip |
| Lights | `sea_lantern` (hidden in floors, soffits, roof flats, core posts) |
| Ground | `smooth_stone` |
| Ladder | `ladder` |

All checked with `$MCD blocks --check`; all exist in 1.21.1. Do NOT use `chain`/`iron_chain` (the 1.21.1 name
differs from the toolkit's), pale oak, or anything 1.21.4+.

## OPENINGS

| Opening | Cells | Notes |
|---|---|---|
| Pavilion main door (north) | x 31..33, z 18, y 2..4 | 3 wide; a glass door pair or air + `glass` transom at y 5 |
| Pavilion approach | landing: full `smooth_quartz` at y 1, cells with r 14.5..18.5 and θ 345°..15°; ramp: bottom `smooth_quartz_slab` at y 1, cells with r 16.5..18.5 and θ 315°..345° (it curves round from the north-west) | ground (1.0) → slab (1.5) → landing (2.0) = threshold; 2+ wide, accessible |
| Core doorway, Pavilion | x 31..33, z 29, y 2..4 | between the two shafts |
| Core doorway, SkyLine | x 31..33, z 29, y 43..45 | |
| Core doorway, restaurant | x 31..33, z 29, y 213..215 | |
| Core doorway, observation | x 31..33, z 29, y 219..221 | |
| Observation to outdoor deck | 3 ring cells of r=21 nearest θ 0° (x 31..33, z 11), θ 120° (around 50, 42) and θ 240° (around 14, 42), y 219..221 | |
| Ladder hole through each floor | x 32, z 34 at y 42 (SkyLine floor), y 212, y 218 | |

All other glazing is continuous glass rings as in FACADES.

## RESERVED (shell leaves these empty)

| Cells | For |
|---|---|
| x 32, z 34, y 2..221 | ladder (facing north, on the south spine at z 35) |
| x 34..35, z 27..28, y 150..152 | gold elevator car (place it as gold, not glass) |
| all OPENINGS cells | doors, rails |
| the hexagon interior of SkyLine y 43..47, the restaurant r≤23 y 213..217, the observation r≤20 y 219..222 | tables, interior (later parts add only) |

## FLOORS

| Level | Floor y | Clear height | Interior volume |
|---|---|---|---|
| Pavilion (ticket hall, shop) | 1 | y 2..7 | disc r≤13 minus core x 29..35 z 29..35 and shafts x 29..30/34..35 z 27..28 |
| SkyLine (event hall) | 42 | y 43..47 | hexagon apothem ≤12 minus core and shafts |
| Restaurant (the Loupe) | 212 | y 213..217 | disc r≤23 minus core |
| Observation deck, inner | 218 | y 219..222 | disc r≤20 minus core |
| Observation deck, outdoor | 218 | y 219..222 (open sky) | ring r 22..27 |
| Core shaft | 1 | to y 222 | x 30..34, z 30..34, ladder only |

---
# DESIGNER'S SECTIONS

## PALETTE (all verified with `$MCD blocks --check`, unknown: none)

| Role | Ids |
|---|---|
| White body | `smooth_quartz`, `smooth_quartz_stairs`, `smooth_quartz_slab` |
| Crisp white | `white_concrete` |
| Greys | `light_gray_concrete` (soffit), `gray_concrete` (throat) |
| Lattice | `iron_bars` |
| Glass | `glass`, `glass_pane`, `gray_stained_glass`, `black_stained_glass` |
| Accent | `gold_block`, `orange_terracotta` |
| Spire/light | `end_rod`, `sea_lantern` |
| Ground | `smooth_stone` |
| Climb | `ladder` (facing north, on spine z35) |
| Restaurant tables | top `smooth_quartz_slab` on a `white_concrete` post |
Forbidden: `chain`/`iron_chain`, pale oak, anything newer than 1.21.1.

## VOCABULARY (helpers; all write with `set`, last write wins unless noted)

- `groundPlate()`: fill y0 x0..63 z0..63 `smooth_stone`.
- `legCentre(leg, y)`: R(y) per LEG TABLE; centre = (32,32)+R·(sinθ,-cosθ) ± 2.5·(cosθ,sinθ), θ∈{180,60,300}; origin = round(cx-0.5), round(cz-0.5).
- `legBox(leg, y)`: 2x2 `smooth_quartz` at the origin for that y. `legStep(leg,y)`: when origin(y)≠origin(y-1), fill the bridging cells of y-1/y (union of both boxes' bounding span in that row) and put `smooth_quartz_stairs` (half bottom, facing toward the new box) on the cell(s) of the old box not covered at y; never leave a gap.
- `footPad(leg)`: 4x4 `smooth_quartz` at y1 around the leg's y1 box (placed first, legs overwrite).
- `pairTie(y)`: for each pair, bottom `smooth_quartz_slab` in the cells between its two legs' inner edges at y.
- `radialTie(y)`: bottom slab line from pair inner face to nearest core face (S: x31..33 to z36; NE/NW along diagonal, Bresenham).
- `coreLattice()`: posts (29,29)(35,29)(29,35)(35,35),(32,35) `white_concrete` y1..222; faces `iron_bars` y1..222 except post cells; leave x30..34 z30..34 empty; reserved ladder cell (32,34) empty; doorway cells x31..33 z29 y2..4 etc. empty.
- `coreBand(y)`: `white_concrete` ring on the core's outer faces at y (tie levels), skipping doorways.
- `elevatorShaft(x0)`: `glass` x0..x0+1, z27..28, y2..222; the car cells y150..152 of x34..35 are `gold_block` (write the car last).
- `coreLadder()`: `ladder` facing north at (32,34) y2..221.
- `ringWall(r,y0,y1,block)`: ring brush at r. `mullion(r,y0,y1,stepDeg,startDeg)`: `white_concrete` at the ring cell nearest each azimuth.
- `pavilionRamp()`: per OPENINGS: landing full `smooth_quartz` y1 (r14.5..18.5, θ345..15); ramp bottom `smooth_quartz_slab` y1 (r16.5..18.5, θ315..345) with a ground row at y0 `smooth_stone`; 2+ wide.
- `hexCells(a)`: cells with |dz|≤a, |0.866dx-0.5dz|≤a, |0.866dx+0.5dz|≤a. `skyline()`: per FACADES.
- `coneShell(y,r)`: annulus between r(y-1) and r(y). `radialRib(θ)`: line r4..30 of `smooth_quartz` on y205..211 following the cone, one block below the surface.
- `glassRing(r,y0,y1,block)`: ring brush glass. `haloFin(θ)`: cells r28,29,30 at azimuth, y213..221 `white_concrete`. `hoop(y)`: ring band r28..30 bottom `smooth_quartz_slab`.
- `roofStep(y,r)`: disc `smooth_quartz` r, outer ring `smooth_quartz_stairs` facing inward.
- `drumBand()`: per ROOFS. `spire()`: per ROOFS. `hiddenLamp(x,y,z)`: `sea_lantern` replacing a floor/soffit cell.
- `table(x,y,z)`: `white_concrete` post then top `smooth_quartz_slab`.

## ROOMS (floor material `smooth_quartz` all)

1. Pavilion (ticket hall): air r≤13 y2..7 minus core, box [19,2,19,45,7,45]. Mood: bright glass rotunda, gift shop + ticket desk. In: door x31..33 z18 y2..4 (north); core doorway x31..33 z29 y2..4.
2. SkyLine event hall: hexagon apothem≤12 y43..47, box [18,43,20,46,47,44]. Mood: low gray-glass event room. In: core doorway x31..33 z29 y43..45; ladder hole x32 z34 y42.
3. The Loupe (restaurant): r≤23 y213..217, box [9,213,9,55,217,55]. Mood: ring dining room, tables near glass. In: x31..33 z29 y213..215; ladder hole (32,34,212).
4. Observation deck, inner: r≤20 y219..222, box [12,219,12,52,222,52]. Mood: dark glass, telescopes. In: x31..33 z29 y219..221; ladder hole (32,34,218); exits at θ0 (31..33,11), θ120 (~50,42), θ240 (~14,42).
5. Outdoor deck: ring r22..27 y219..222, box [5,219,5,59,222,59] (ring only). Open sky; glass rail r27. In: the three exits above.
Stairs between floors: none; the core ladder at (32,34) climbs y2..221 (holes in floors at y42, 212, 218).

Entrance (outside door): [32,2,16]; street: [18,1,19]; the way in is the slab ramp (ground→slab 1.5→landing 2.0).

## PARTS

- P1 `parts/legs.mjs` Leg & tie mason: ground, pads, 6 legs y1..205, steps, pairTie, radialTie. Ticks 1–5.
- P2 `parts/core-pavilion.mjs` Core, elevators, ladder, Pavilion, ramp, door cuts. Ticks 6–11, 23 (lower).
- P3 `parts/skyline.mjs` SkyLine hexagon. Tick 12.
- P4 `parts/saucer.mjs` Throat, cone, ribs, floors, glass rings, halo, doorway cuts at 213/219. Ticks 13–17.
- P5 `parts/crown.mjs` Stepped roof, drum band, dome, spire. Ticks 18–21.
- P6 `parts/lights-details.mjs` Hidden sea lanterns (core posts y7+12k at corners, floors, soffits, ramp), restaurant tables, check of reserved cells, glass-on-gold order. Ticks 22, 24.

Checklist: [x] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6

## NOTES FOR WORKERS
- Build height is large: write by column loops; do not render the full tower per step, test slices with `$MCD check`.
- The architect's table is authoritative; compute leg boxes by formula, not by hand. Mirror about x=32.
- Don't touch reserved cells (ladder column, car cells before P2's final write, openings).
- Use `iron_bars` not `chain`. All blocks stay inside x0..63, z0..63, y0..259.
- Every sea_lantern must be hidden in a floor/roof/soffit/post; no dark open cells.
- P1: ground is laid by build.mjs (groundPlate would be refused); NE/NW radial ties float until P2's core exists (they end at the core face).
- Stairs part (P-stairs) writes nothing: the only vertical way is the P2 core ladder (32,34) y2..221; P3/P4 must leave (32,34) open at y42, 212, 218.
