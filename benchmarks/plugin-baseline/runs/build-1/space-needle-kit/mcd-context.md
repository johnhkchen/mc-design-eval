# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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

Checklist: [ ] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6

## NOTES FOR WORKERS
- Build height is large: write by column loops; do not render the full tower per step, test slices with `$MCD check`.
- The architect's table is authoritative; compute leg boxes by formula, not by hand. Mirror about x=32.
- Don't touch reserved cells (ladder column, car cells before P2's final write, openings).
- Use `iron_bars` not `chain`. All blocks stay inside x0..63, z0..63, y0..259.
- Every sea_lantern must be hidden in a floor/roof/soffit/post; no dark open cells.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (Space Needle). Coordinates are plan.md's. P1..P6 = parts in PARTS.

| # | Element | Real construction | Coordinates | Part | Vocab |
|---|---|---|---|---|---|
| 1 | Ground | `smooth_stone` slab of the plot, walk surface y1 | x0..63 z0..63 y0 | P1 | groundPlate |
| 2 | Six legs, hourglass | 2x2 `smooth_quartz` columns, centre per LEG TABLE formula each y; fill the jump cell; exposed ledge where a leg steps = `smooth_quartz_stairs` ascending toward the leg or bottom slab | y1..205 | P1 | legBox, legStep |
| 3 | Foot pads | 4x4 `smooth_quartz` under each leg | y1 | P1 | footPad |
| 4 | Pair ties | 1-high bottom `smooth_quartz_slab` between each pair's legs | y13,25,37,61,73,...193 | P1 | pairTie |
| 5 | Radial ties | bottom slab lines pair-inner-face to core face | y73,97,121,145,169,193 | P1 | radialTie |
| 6 | Core lattice | corner posts + south spine `white_concrete`, faces `iron_bars`, `white_concrete` band ring at each tie level; open shaft inside | x29..35 z29..35 y1..222 | P2 | coreLattice, coreBand |
| 7 | Glass elevator shafts | solid `glass` columns, two on north face | x29..30 and 34..35, z27..28, y2..222 | P2 | elevatorShaft |
| 8 | Gold elevator car | `gold_block` 2x2x3 inside the east shaft (placed AFTER the glass) | x34..35 z27..28 y150..152 | P2 | elevatorCar |
| 9 | Stair ladder in core | `ladder` facing north on spine z35, at x32 z34; trapdoor-free holes at floors | x32 z34 y2..221 | P2 | coreLadder |
| 10 | Pavilion | disc floor `smooth_quartz` r<=14 y1, `glass` wall ring r14 y2..7, 12 `white_concrete` mullions, band y7, roof disc r<=15 y8 with top-slab rim | y1..8 | P2 | ringWall, mullion |
| 11 | Pavilion door + accessible ramp | 3-wide opening z18; landing full `smooth_quartz` y1 (r14.5..18.5, θ345..15); bottom-slab ramp curving NW | see OPENINGS | P2 | pavilionRamp |
| 12 | SkyLine hexagon | soffit y41 + `sea_lantern`/5 cells, floor y42, `gray_stained_glass` wall apothem13 y43..47, 6 white posts, roof y48 with lanterns | y41..48 | P3 | hexCells, skyline |
| 13 | Saucer throat | `gray_concrete` cone shell r4->13 | y196..204 | P4 | coneShell |
| 14 | Saucer underside + 24 ribs | `light_gray_concrete` annuli; `smooth_quartz` rib line one block below soffit, r4..30 every 15° | y205..211 | P4 | coneShell, radialRib |
| 15 | Restaurant | floor y212 r<=30 with hidden lanterns; `gray_stained_glass` ring r24 y213..217, mullions at rib azimuths | y212..217 | P4 | glassRing |
| 16 | Observation deck | floor y218 r<=27, lantern ring r26; `black_stained_glass` ring r21 y219..222; `glass_pane` rail r27 y219..220 | y218..222 | P4 | glassRing |
| 17 | HALO | 90 radial `white_concrete` fins r28..30 y213..221, bottom-slab hoops at y212 and y222, `iron_bars` mid rail r30 y217 | y212..222 | P4 | haloFin, hoop |
| 18 | Stepped roof | discs r22/20/18/16 at y223..226, rim ring as inward-facing `smooth_quartz_stairs` | y223..226 | P5 | roofStep |
| 19 | Orange gold band | drum r<=12: y227 `smooth_quartz`, y228..229 `orange_terracotta` | y227..229 | P5 | drumBand |
| 20 | Dome | `dome(...radius 12 shallow smooth_quartz edge stairs)` | y230..235 | P5 | (dome brush) |
| 21 | Spire + beacon | `white_concrete` y236..239, `end_rod` up y240..257, `sea_lantern` y258 | x32 z32 | P5 | spire |
| 22 | Light, no spawn | hidden `sea_lantern`: core posts/12, floors, soffits, roofs, ramp | per plan | P6 | hiddenLamp |
| 23 | Doors / openings | core doorways x31..33 z29 at y2..4, 43..45, 213..215, 219..221; deck exits at θ0/120/240 (open air) | OPENINGS | P6 (cut by P2/P4) | doorway |
| 24 | Tables in restaurant | fence/wall post + top slab, a few only | room | rooms | table |
```

### rooms.json

```json
{"entrance":[32,2,16],"street":null,"entrances":null,"rooms":[{"name":"Pavilion","box":[19,2,19,45,7,45]},{"name":"SkyLine","box":[18,43,20,46,47,44]},{"name":"The Loupe","box":[9,213,9,55,217,55]},{"name":"Observation deck inner","box":[12,219,12,52,222,52]},{"name":"Outdoor deck","box":[5,219,5,59,222,59]}]}
```

### palette.json

```json
{
  "roles": {
    "white_body": ["smooth_quartz", "smooth_quartz_stairs", "smooth_quartz_slab"],
    "crisp_white": ["white_concrete"],
    "greys": ["light_gray_concrete", "gray_concrete"],
    "lattice": ["iron_bars"],
    "glass": ["glass", "glass_pane", "gray_stained_glass", "black_stained_glass"],
    "accent": ["gold_block", "orange_terracotta"],
    "spire_light": ["end_rod", "sea_lantern"],
    "ground": ["smooth_stone"],
    "climb": ["ladder"]
  },
  "objects": []
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
// The Space Needle: the site grid, the ground, then every part in plan.md order. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, PLOT, GROUND_Y, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order (the stair joiner before any room; the rooms last, furnished around the finished tower).
const PARTS = [
  ["Legs and ties", "parts/legs.mjs"],
  ["Stairs and ladders", "parts/stairs.mjs"],
  ["Core, elevators and Pavilion", "parts/core-pavilion.mjs"],
  ["SkyLine hexagon", "parts/skyline.mjs"],
  ["Saucer and halo", "parts/saucer.mjs"],
  ["Crown and spire", "parts/crown.mjs"],
  ["Lights and details", "parts/lights-details.mjs"],
  ["room: Pavilion", "parts/room-1.mjs"],
  ["room: SkyLine", "parts/room-2.mjs"],
  ["room: The Loupe", "parts/room-3.mjs"],
  ["room: Observation deck inner", "parts/room-4.mjs"],
  ["room: Outdoor deck", "parts/room-5.mjs"],
];

const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([PLOT.x0, GROUND_Y, PLOT.z0], [PLOT.x1, GROUND_Y, PLOT.z1], SMOOTH_STONE);

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
// Shared constants for the Space Needle kit: palette block ids, site coordinates from plan.md, and a seeded rng.

// Block ids (palette.json only; the 1.21.1 names: no chain, no pale oak)

// Block ids (palette.json only; the 1.21.1 names: no chain, no pale oak)
export const SMOOTH_QUARTZ = "smooth_quartz";                     // legs, ties, floors, roof steps, dome

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";       // leg steps, roof step rims, dome edge

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";           // pair and radial ties, halo hoops, table tops

export const WHITE_CONCRETE = "white_concrete";                   // core posts, band rings, mullions, halo fins, spire base

export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";         // saucer underside soffit

export const GRAY_CONCRETE = "gray_concrete";                     // saucer throat

export const IRON_BARS = "iron_bars";                             // core lattice faces, halo mid rail

export const GLASS = "glass";                                     // elevator shafts, Pavilion wall

export const GLASS_PANE = "glass_pane";                           // deck rail

export const GRAY_STAINED_GLASS = "gray_stained_glass";           // SkyLine walls, restaurant wall

export const BLACK_STAINED_GLASS = "black_stained_glass";         // observation inner wall

export const GOLD_BLOCK = "gold_block";                           // elevator car

export const ORANGE_TERRACOTTA = "orange_terracotta";             // drum band (galaxy gold)

export const END_ROD = "end_rod";                                 // spire

export const SEA_LANTERN = "sea_lantern";                         // hidden lights, spire tip

export const SMOOTH_STONE = "smooth_stone";                       // ground

export const LADDER = "ladder";                                   // core ladder, facing north

// Site (plan.md): the full site is 64 x 260 x 64; the plot is inclusive x0..x1 / z0..z1
export const SITE = [64, 260, 64];

export const PLOT = { x0: 0, z0: 0, x1: 63, z1: 63 };

export const CENTRE = [32, 32];                                   // the tower's axis cell (x, z)

export const GROUND_Y = 0;                                        // smooth_stone ground

export const WALK_Y = 1;                                          // walk surface and the Pavilion floor

export const TOP_Y = 258;                                         // the spire's sea lantern tip

export const ENTRANCE = [32, 2, 16];                              // the Pavilion door's outside cell

export const STREET = [18, 1, 19];                                // the street, where the ramp starts

// Legs (LEG TABLE): pair angles from north clockwise, the R(y) profile, the leg top
export const LEG_ANGLES = { S: 180, NE: 60, NW: 300 };            // pair centre angles (degrees)

export const LEG_R = { feet: 22, waist: 8, waistY: 120, top: 14 }; // R(y): feet at y1, waist at waistY, top at y205

export const LEG_TOP_Y = 205;                                     // legs meet the saucer's underside here

export const LEG_TIE_Y = [13, 25, 37, 61, 73, 85, 97, 109, 121, 133, 145, 157, 169, 181, 193]; // pair ties

export const LEG_RADIAL_TIE_Y = [73, 97, 121, 145, 169, 193];     // radial ties from pair to core

// Core lattice and elevators: the 7 x 7 core and its north face
export const CORE = { x0: 29, z0: 29, x1: 35, z1: 35, y0: 1, y1: 222 };

export const CORE_DOORWAY_X = [31, 33];                           // doorway cells x31..33 at z29

export const CORE_LADDER = [32, 34];                              // ladder cell (x, z); climbs y2..221

export const ELEVATOR_Z = [27, 28];                               // shaft cells on the north face

export const ELEVATOR_SHAFTS_X = [[29, 30], [34, 35]];            // x of the two glass shafts

export const ELEVATOR_CAR = { x0: 34, x1: 35, z0: 27, z1: 28, y0: 150, y1: 152 }; // gold car, written last

export const LADDER_HOLES = [[32, 34, 42], [32, 34, 212], [32, 34, 218]]; // [x, z, y] ladder holes in floors

// Pavilion (ticket hall): disc r<=14, glass wall y2..7, roof disc r<=15 at y8
export const PAVILION = { r: 14, roofR: 15, floorY: 1, glassY0: 2, glassY1: 7, roofY: 8 };

export const PAVILION_DOOR = { x0: 31, x1: 33, z: 18, y0: 2, y1: 4 }; // main door, north

export const PAVILION_BOX = [19, 2, 19, 45, 7, 45];               // inner air of the ticket hall

// Roofs and the crown: the stepped saucer roof, drum, dome and spire
export const ROOF = {
  pavilionY: 8,                                                   // Pavilion roof disc
  skylineY: 48,                                                   // SkyLine roof
  stepsY: [223, 224, 225, 226], stepsR: [22, 20, 18, 16],         // saucer roof steps (r per level)
  drumY0: 227, drumY1: 229, drumR: 12,                            // drum disc, orange band y228..229
  domeBaseY: 230, domeApexY: 235, domeR: 12,                      // shallow dome
  spireY0: 236, spireY1: 258,                                     // spire from base to sea lantern tip
};

// SkyLine (hexagon, 30 m): the soffit, floor, glass walls and roof
export const SKYLINE = { soffitY: 41, floorY: 42, wallY0: 43, wallY1: 47, roofY: 48, apothem: { soffit: 15, floor: 16, wall: 13 } };

export const SKYLINE_BOX = [18, 43, 20, 46, 47, 44];              // inner air of the event hall

// Saucer and halo: the throat, the underside cone, the restaurant, the deck and the halo
export const SAUCER = {
  throatY0: 196, throatY1: 204, undersideY0: 205, undersideY1: 211, // cone: r 14 at y205 to r 27.7 at y211
  floorY: 212, restaurantY0: 213, restaurantY1: 217,                 // restaurant r<=23 inside glass at r=24
  deckFloorY: 218, observeY0: 219, observeY1: 222,                   // deck floor r<=27; inner glass at r=21
  haloR0: 28, haloR1: 30, haloY0: 212, haloY1: 222,                  // halo fins and hoops
  doorwayCutsY: [213, 219],                                        // doorway cuts through the floors
};

export const RESTAURANT_BOX = [9, 213, 9, 55, 217, 55];           // inner air of The Loupe

export const OBSERVATION_BOX = [12, 219, 12, 52, 222, 52];        // inner air of the observation deck

export const OUTDOOR_DECK_BOX = [5, 219, 5, 59, 222, 59];         // ring r22..27, open sky

// A seeded rng: rng(seed)() returns a float in [0, 1), the same sequence for the same seed
export function rng(seed)
```

### vocab/h1.mjs

```js
// Space Needle helper set H1 (plan.md VOCABULARY). Geometry is plan.md's: axis at cell (32, 32), azimuth clockwise
// from north (direction (sin θ, -cos θ) in x, z), cells on integer coordinates.
//
// Every helper takes its position as arguments (nothing is hard-wired to a spot) and writes only into AIR inside its
// own footprint. opts.replace lists block ids it may overwrite (default none); anything else is left alone and the
// helper returns the number of cells it actually wrote. Guarded grids (build.mjs guard) still refuse protected cells.

/** Fill the plot's ground: smooth_stone over x0..x1, z0..z1 at height y (the walk surface is y + 1). */
export function groundPlate(g, [x0, z0], [x1, z1], y, opts = {})

/**
 * Leg step between y - 1 and y for leg "Sa" | "Sb" | "NEa" | "NEb" | "NWa" | "NWb" (plan LEG TABLE). Where the 2x2 box
 * moves two or more cells in one axis, a bridge cell is laid at y - 1 so the leg stays in one piece. The old box's cells
 * that the new box leaves are capped at y by smooth_quartz_stairs whose back faces the new box (the step rises to the
 * leg). Does nothing where the origin is unchanged or y < 2.
 */
export function legStep(g, leg, y, opts = {})

/**
 * Radial tie at y: a bottom smooth_quartz_slab line from the pair's inner face to the core. S runs x 31..33 from z 36 to
 * the leg's inner face; NE and NW run one cell wide along their own diagonal (Bresenham).
 */
export function radialTie(g, pair, y, opts = {})

/**
 * Glass elevator shaft: glass over x0..x0+1, z 27..28, y 2..222. opts.car writes the gold car (2x2x3 at y 150..152) last,
 * over the shaft's own glass; pass it for the east shaft (x0 = 34).
 */
export function elevatorShaft(g, x0, opts = {})

/**
 * Mullions: block (default white_concrete) at the ring-r cell nearest each azimuth, from startDeg every stepDeg round the
 * full circle, for y0..y1. Dresses an existing glass wall, so it may replace glass as well as writing into air.
 */
export function mullion(g, r, y0, y1, stepDeg, startDeg, opts = {})

/**
 * Conical shell at y: the annulus between the disc of radius prev (r at y - 1) and the disc of radius r (at y), around the
 * axis. Air only, so the core and the legs keep their cells.
 */
export function coneShell(g, y, r, prev, opts = {})

/** Halo fin at azimuth theta (degrees): white_concrete on the cells at r 28, 29 and 30, for y0..y1. */
export function haloFin(g, theta, y0, y1, opts = {})

/**
 * Drum at centre [cx, cz] with radius r: the floor disc at y0 (smooth_quartz), then the orange band at y0 + 1 .. y0 + 2.
 * plan.md: y0 = 227, r = 12.
 */
export function drumBand(g, cx, cz, y0, r, opts = {})

/**
 * Restaurant table at [x, y, z]: a white_concrete post at y and a bottom smooth_quartz_slab on top of it (the top at
 * y + 1.5). Uses cells y and y + 1 only, so the 2-high clear lane above it stays open.
 */
export function table(g, x, y, z, opts = {})
```

### vocab/h2.mjs

```js
// Space Needle vocabulary, set h2 (plan.md VOCABULARY). Every helper takes the grid `g` first (a build-library Grid,
// from load() or new Grid()), then its position: `axis` = [cx, cz], the tower's centre cell ([32, 32] in plan.md),
// and the y levels it needs. Nothing is hard-wired to a spot.
//
// Writes are AIR-ONLY: a cell that already holds a block (ground, an earlier part's wall) is refused and listed in the
// returned `refused` ("x,y,z" strings), never overwritten. Pass `replace: true` only where the plan says a part writes
// over an earlier one. Each helper returns { placed, refused }. Every write is a plain g.set with states the 1.21.1
// toolkit lists (`$MCD states <block> --version 1.21.1`).

// ---- plumbing ---------------------------------------------------------------------------------------------------------

/** Pair centreline distance from the axis at height y. */
export function legR(y)

/** A leg's centre and its 2x2 origin at height y: { cx, cz, x0, z0, R }. Pure: writes nothing. */
export function legCentre(leg, y, opts = {})

/** 4x4 smooth_quartz pad at y (the walk surface, 1) around the leg's 2x2 box at that y. Placed first; the leg
 *  overwrites its own 2x2 with replace: true. */
export function footPad(g, leg, opts = {})

// ---- core -------------------------------------------------------------------------------------------------------------
/** The 7x7 core: white posts at the four corners and the south spine (cx, cz+3), iron bars on the other perimeter
 *  cells, the 5x5 shaft left open. doors: [[yLo, yHi], ...] of north-face doorways (x cx-1..cx+1 on z cz-3), left empty. */
export function coreLattice(g, opts = {})

/** The climbing ladder on the axis' south side: x cx, z cz+2 (against the spine at z cz+3), y0..y1. Facing is the
 *  side the ladder faces: "north" for the plan's ladder against the south spine. */
export function coreLadder(g, opts = {})

// ---- pavilion approach ------------------------------------------------------------------------------------------------
/** The approach at y (1): full smooth_quartz landing r 14.5..18.5 over θ 345..15 (north), and a bottom-slab ramp
 *  r 16.5..18.5 over θ 315..345 curving round from the north-west. Ground under it is the plot's, never written. */
export function pavilionRamp(g, opts = {})

/** One smooth_quartz rib along azimuth θ from r rMin to rMax, one block below the cone's surface cell at each radius.
 *  The surface cell is solid and the cell under it is air, so the rib can only sit at layer-1 (plan says 205..211 for
 *  the layers themselves; the air-only rule puts it one block lower, 204..210). Inside the throat (r<=13) the rib
 *  cell is refused. */
export function radialRib(g, theta, opts = {})

/** A ring band of bottom smooth_quartz_slab at y, cells with r0 <= r <= r1 (ring at N: N-0.5 < r <= N+0.5). */
export function hoop(g, y, opts = {})

// ---- spire ------------------------------------------------------------------------------------------------------------
/** The mast on the axis: white_concrete for 4 blocks from base, end rods facing up up to top-1, a sea lantern at top. */
export function spire(g, opts = {})
```

### vocab/h3.mjs

```js
// Space Needle vocabulary, part 3 set (plan.md VOCABULARY): legBox, pairTie, coreBand, ringWall, hexCells, glassRing,
// roofStep, hiddenLamp. Each takes its position as arguments (centre defaults to the axis [32, 32]), writes only its own
// footprint, and only into air, or into the blocks named in opts.over. Cells it may not write are left alone and listed
// in `refused`; cells already holding the block it wants count as `kept`. Returns { placed, kept, refused }.

/**
 * One leg: a 2x2 smooth_quartz column at its origin for level y. leg: "Sa" | "Sb" | "NEa" | "NEb" | "NWa" | "NWb".
 */
export function legBox(g, leg, y, opts = {})

/** The 1-high bottom smooth_quartz_slab tie across each pair's gap at level y (all three pairs). */
export function pairTie(g, y, opts = {})

/** White concrete ring on the core's outer faces (x 29..35, z 29..35) at y, skipping the north doorways. */
export function coreBand(g, y, opts = {})

/** A ring wall at radius r for y0..y1 (plan's ring convention), all one block. opts.centre, opts.state, opts.over. */
export function ringWall(g, r, y0, y1, block, opts = {})

/**
 * A ring of glazing at radius r for y0..y1. Glass panes get their north/east/south/west connections from the ring
 * itself, so the ring reads continuous; other glazing (glass, stained glass) needs no state.
 */
export function glassRing(g, r, y0, y1, block, opts = {})

/**
 * The hexagon of apothem a at y (plan's SkyLine convention): filled, or only its outline when opts.outline is true
 * (the glass wall). opts.centre, opts.state, opts.over.
 */
export function hexCells(g, a, y, block, opts = {})

/**
 * A stepped roof disc at y: smooth_quartz out to radius r-1, with the outer ring of smooth_quartz_stairs facing the
 * centre (rising toward it, as the library's dome edges do). opts.centre, opts.over.
 */
export function roofStep(g, y, r, opts = {})

/**
 * A sea lantern in the floor or soffit cell at (x, y, z). Refuses air: a lamp is hidden in a block. Replaces only the
 * materials in opts.over (default: the plan's floor and soffit materials).
 */
export function hiddenLamp(g, x, y, z, opts = {})
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
