# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Golden Gate Bridge kit (1937): south tower + suspension span, 0.5 blocks/m

## SITE

A kit of four modules (plots along x; every coordinate is LOCAL to its module). The bridge runs north-south along z (north = low z). y 0 = the water surface: nothing at y 0, no ground course; every cell not listed stays air. Minecraft 1.21.1 blocks only.

Shared cross-section (each plot's own x; plot 0 adds +16):

| role | y | x (plots 1-3) | x (plot 0) |
|---|---|---|---|
| railing + lamp level (stand y 39) | 39 | 0, 14 | 16, 30 |
| road surface | 38 | 3..11 | 19..27 |
| sidewalks | 38 | 1..2, 12..13 | 17..18, 28..29 |
| edge girder | 38 | 0, 14 | 16, 30 |
| deck plate (closed underside of road) | 37 | 1..13 | 17..29 |
| truss top chord | 37 | 0, 14 | 16, 30 |
| Warren diagonals | 35..36 | 0, 14 | 16, 30 |
| floor beams | 35 | 1..13 | 17..29 |
| bottom chord + lateral bracing | 34 | 0..14 | 16..30 |

Warren pattern on each outer face (period 4, tiles every 16): z mod 4 = 1 -> y 35; = 2 -> y 36; = 3 -> y 35; = 0 -> open (node on the bottom chord). Floor beams at z mod 4 = 0, each with a shroomlight at its centre cell (x 7; plot 0 x 23). Lateral bracing at y 34 (diamonds in plan): line A x = 1 + round(z*12/7) for z 0..7, x = 13 - round((z-8)*12/7) for z 8..15, line B x = 14 - A; fill the run between consecutive z so each line is unbroken.

### Plot 0: south tower, x 0..46, z 0..23, y 1..116

| mass | x | y | z |
|---|---|---|---|
| fender ring (elliptical, 2 thick) | 0..46 | 1..3 | 0..23 |
| pier | 11..35 | 1..5 | 5..18 |
| west leg stage S1 | 14..18 | 6..54 | 8..15 |
| west leg stage S2 | 14..18 | 55..79 | 9..14 |
| west leg stage S3 | 15..18 | 80..104 | 10..13 |
| west leg stage S4 | 15..18 | 105..112 | 10..13 |
| east leg (mirror x' = 46 - x) | S1/S2 28..32, S3/S4 28..31 | same | same |
| bottom tie beam | 19..27 | 6..7 | 10..13 |
| X cross brace (two diagonals, 4 deep) | 19..27 | 8..27 | 10..13 |
| lower portal strut (carries the deck) | 19..27 | 28..33 | 10..13 |
| deck (cross-section above) z 0..7 and 16..23 | 16..30 | 34..39 | 0..7, 16..23 |
| deck through the portal (road + floor beams only, bearing on legs) | 19..27 | 34..38 | 8..15 |
| strut 1 | 19..27 | 55..60 | 10..13 |
| strut 2 | 19..27 | 72..77 | 10..13 |
| strut 3 | 19..27 | 90..95 | 10..13 |
| top strut | 19..27 | 106..112 | 10..13 |
| top strut crown | 19..27 / 21..25 | 113 / 114 | 10..13 / 11..12 |
| west walkway platform (y 38) | 12..18 | 38 | 6..7 and 16..17 |
| west walkway along leg | 12..13 | 38 | 8..15 |
| east walkway (mirror) | 28..34 / 33..34 | 38 | as west |
| walkway edge girder + railing outline | x 16 z 0..5 -> z 5 row x 11..16 -> x 11 z 5..18 -> z 18 row x 11..16 -> x 16 z 18..23 (east mirror x 30 / 35) | 38 girder, 39 railing | |
| walkway corbels | 12..13 | 37 | 8, 11, 12, 15 |

- Fender ring: a cell (x, z) is ring if inside ((x-23)/23.5)^2 + ((z-11.5)/12)^2 <= 1 and outside ((x-23)/21.5)^2 + ((z-11.5)/10)^2 <= 1. Air (the sea) between ring and pier.
- X brace: diagonal 1 cells at x = 19 + round((y-8)*8/19) for y 8..27, diagonal 2 at x = 46 - that; each cell 4 deep (z 10..13); where consecutive y jump 2 in x, fill the gap cell.
- Strut haunches (Art Deco stepped portal corners) under each of struts 1-3 and the top strut: row bottom-1: x 19..20 and 26..27; row bottom-2: x 19 and 27 (z 10..13).
- Tower top caps (west; east mirror x' = 46 - x): y 112 leg top course with x 16 left OPEN (z 10..13); y 113 x 15, 17, 18 (x 16 open) = saddle housing walls; y 114 x 15..18 z 10..13 solid = saddle housing roof over the cable groove; y 115 x 16..17 z 11..12 (glowstone at x 16, orange_terracotta at x 17); y 116 red_stained_glass at x 16 z 11..12 = red aircraft warning light. East: groove x 30, y 115 x 29..30 (glowstone x 30), y 116 x 30.

### Plot 1: deck section, x 0..14, z 0..15, y 34..44 only

The shared cross-section, z 0..15, tiling end to end (every layer is continuous through z 0 and z 15). Suspender anchor brackets: x 0 and x 14, z 0, 4, 8, 12, y 38..39 (orange_concrete). Lamps (pair) at x 1 and x 13, z 8: y 39 orange_terracotta base, y 40..41 red_sandstone_wall shaft, y 42 lantern standing on it. Lane lines in the road: x 7 yellow_concrete continuous; x 5 and x 9 white_concrete dashes at z 0..3 and 8..11. Keep x 0 / x 14, y 40..44 clear everywhere (suspenders land there).

### Plot 2: main-span cables, x 0..14, z 0..248, y 40..116

Only the two cables (x 0, x 14) and suspenders. f(z) = 41.9 + 0.00069 (z+72)^2; base = floor(f). Cable body full block at (x, base, z); if f - base >= 0.5 add a bottom smooth_red_sandstone_slab at base+1. Slope < 1 everywhere, so one body cell per z is already 8-connected. Cable bands: at z mod 4 = 0 the body block is orange_concrete. Suspenders: z = 0, 4, ..., 248, both lines, red_stained_glass_pane from y 40 up to base-1. Checks: z 0 -> 45 + slab 46; z 248 -> 112 + slab 113.

### Plot 3: side-span cables, x 0..14, z 0..231, y 36..116

Only the cables and suspenders. u = z + 0.5; z 0..171: f = 112.8 - 0.6475u + 0.001165u^2, same body/slab/band rule as plot 2 (z 0 -> 112 + slab; z 171 -> 36). z 172..231: body level at y 36, no slab, bands at z mod 4 = 0; z 231 ends against the anchorage pylon (other kit). Suspenders at z 12, 16, ..., 168 only, from the bottom y (z 12..43: 40; 44..75: 39; 76..107: 38; 108..139: 37; 140..171: 36) up to base-1; none where bottom > base-1.

## ROOFS

No roof (not a building): no `$MCD roof` preset. The tower's roofs are the hand-built stepped caps and the saddle housings (plot 0, listed above). Every setback ledge left by a stage step (S1->S2 at y 55 on z 8 and z 15; S2->S3 at y 80 on x 14 / x 32 and z 9 / z 14) is covered with a bottom smooth_red_sandstone_slab course (a shadow line, and nothing spawns on a bottom slab).

## FACADES

Tower legs (every face): riveted-cell fluting by exclusion. Ribs flush, panels recessed 1 (front cell left out, red_terracotta behind).
- S1 north/south faces (z 8 / z 15): ribs x 14, 16, 18; recesses x 15, 17. West/east faces (x 14 / x 18; east leg x 28 / x 32): ribs z 8, 10, 13, 15; recesses z 9, z 11..12, z 14.
- S2 north/south (z 9 / z 14): recesses x 15, 17. Side faces: ribs z 9, 11, 12, 14; recesses z 10, 13.
- S3/S4 north/south (z 10 / z 13): recess x 16..17 (east x 29..30). Side faces: recess z 11..12.
- Recesses run only between band courses; bands are solid orange_concrete courses at y 6..7 (plinth), 53..54, 78..79, 103..104, 111. Faces against the deck, walkways and struts stay solid where they meet.
- Struts 1-3 and top strut, north face z 10 and south face z 13: recessed frame x 21..25 over the strut's inner rows (strut 1 y 56..59, 2 y 73..76, 3 y 91..94, top y 107..111), front cell out, red_terracotta behind; inside it a raised panel back at the face, orange_concrete, x 22..24 over the middle rows (y 57..58, 74..75, 92..93, 108..110). Strut tops: shroomlight flush at x 23 z 11..12 (y 60, 77, 95; top strut on the crown at y 114).
- Lamp panels: shroomlight set in the legs' inner faces x 18 and x 28, z 11..12, y 40..41 (lights the portal roadway).
- Pier: light_gray_concrete body y 1..4, polished_andesite top course y 5. Fender: light_gray_concrete y 1..2, polished_andesite y 3.
- Deck: orange_terracotta chords and girders, red_terracotta diagonals and deck plate, orange_concrete brackets; railing red_sandstone_wall at y 39 along the girders between brackets (connects into one orange rail).

## MATERIALS

| role | block |
|---|---|
| steel body (legs, struts, chords, girders, cable body) | orange_terracotta |
| recess backs, truss diagonals, deck plate, X brace | red_terracotta |
| highlights: bands, raised strut panels, brackets, cable bands | orange_concrete |
| accent (sparingly: lower portal strut faces) | red_concrete |
| shaping slabs/stairs (cable half-steps, ledges, corbels) | smooth_red_sandstone_slab, smooth_red_sandstone_stairs |
| railing, lamp shafts | red_sandstone_wall |
| suspender ropes | red_stained_glass_pane |
| road | gray_concrete |
| lane lines | yellow_concrete (centre), white_concrete (dashes) |
| sidewalks, walkways | light_gray_concrete |
| pier / fender body | light_gray_concrete |
| pier / fender top course | polished_andesite |
| lamps | lantern |
| hidden lights | shroomlight |
| aircraft warning light | glowstone under red_stained_glass |

No wool, no copper, no chain. All ids pass `$MCD blocks --check`.

## OPENINGS

- Portal roadway: clear x 19..27, y 39..52, z 8..15 (strut 1 haunches start at y 53).
- Cable grooves: x 16 and x 30, y 112..113, z 10..13 open through the tower top.
- Below deck: everything between the legs not in the X brace, tie or lower strut is air.

## RESERVED

- Plot 0: x 16 and x 30, y 112..113 (all z) left empty for the cables.
- Plot 1: x 0 and x 14, y 40..44 (all z) clear for the suspenders; brackets at z 0, 4, 8, 12 are their seats.
- Plots 2/3: nothing but cables and suspenders; no deck, no railing.

## FLOORS

| level | y | where |
|---|---|---|
| road / sidewalk surface (people stand at 39) | 38 | plot 0 x 16..30 (+ walkways x 11..18, 28..35), plot 1 x 0..14 |
| pier top | 5 | plot 0 x 11..35, z 5..18 |
| fender top | 3 | plot 0 ring |

Lighting: deck lamps at z 8 (plot 1), walkway lamps (as plot 1 lamps) at plot 0 (12,6), (12,17), (34,6), (34,17); lanterns on the pier top at (11,5), (23,5), (35,5), (11,18), (23,18), (35,18), y 6; lanterns on the fender top y 4 at (0,11), (46,12), (23,0), (23,23), (3,7), (43,7), (3,16), (43,16), (15,1), (31,1), (15,22), (31,22).

## PALETTE

Every id passes `$MCD blocks --check`. Roles as MATERIALS above, plus variants:
- steel: orange_terracotta; backs/diagonals: red_terracotta; highlights: orange_concrete; accent: red_concrete
- shaping: smooth_red_sandstone_slab (type bottom), smooth_red_sandstone_stairs
- rails/lamp shafts: red_sandstone_wall (connected states set by neighbours; up true on posts)
- ropes: red_stained_glass_pane (connection states along neighbours: vertical ropes stay as thin posts, no side connections)
- road gray_concrete; lines yellow_concrete, white_concrete; sidewalks/pier/fender light_gray_concrete; top course polished_andesite
- light: lantern (hanging false), shroomlight, glowstone, red_stained_glass
No wool, no pale oak, no iron_chain.

## VOCABULARY

- legStage(g, side, y0, y1, x0, x1, z0, z1): solid orange_terracotta box of the stage; side "west" or "east" mirrors x' = 46 - x.
- fluteFace(g, face, y0, y1, ribs, recesses): for each recess column/row, place red_terracotta one cell behind the face line and leave the front cell air; ribs stay orange_terracotta. Only between band courses.
- bandCourse(g, y, box): orange_concrete full course across the leg box.
- portalStrut(g, yBottom, yTop, haunches): orange_terracotta box x 19..27 z 10..13; haunch rows under it (bottom-1 x 19..20, 26..27; bottom-2 x 19, 27); recessed frame x 21..25 on z 10 and 13 (front out, red_terracotta behind), orange_concrete panel x 22..24; shroomlight at x 23 z 11..12 on top.
- xBrace(g): two red_terracotta diagonals, x = 19+round((y-8)*8/19) and mirrored 46-x, z 10..13, fill x gaps.
- fenderRing(g): ellipse test from plan.md, light_gray_concrete y 1..2, polished_andesite y 3.
- saddleCap(g, side): y112 course with groove open, y113 walls, y114 roof, y115 glowstone + orange_terracotta, y116 red_stained_glass.
- deckSection(g, xOff, z0, z1): full cross-section from the SITE table (xOff 0 or 16): rows by role, Warren pattern by z mod 4, floor beams + shroomlight at z mod 4 = 0, lateral bracing lines A and B at y 34 filled between z; railing wall y 39; brackets orange_concrete at z%4=0 on x 0/14.
- walkway(g, side): light_gray_concrete y 38 platforms and strip, corbels y 37 (smooth_red_sandstone_stairs upside down), girder x 16 outline with railing y 39.
- deckLamp(g, x, z): y39 orange_terracotta, y40..41 red_sandstone_wall, y42 lantern standing.
- cableCell(g, x, z, f): base=floor(f): full block at base (orange_concrete if z%4==0 else orange_terracotta); if f-base>=0.5 a bottom smooth_red_sandstone_slab at base+1.
- suspender(g, x, z, yBottom, yTop): red_stained_glass_pane column.
- lanternAt(g, x, y, z): lantern on a solid block.

## ROOMS

None: a bridge, no interiors. Walkable surfaces: deck road/sidewalk y 38 (stand 39), walkways, pier top y 5, fender top y 3.

## PARTS

1. Tower massing (parts/tower.mjs): fender, pier, legs S1..S4, tie, X brace, lower strut, struts + haunches + crown, saddle caps.
2. Tower skin (parts/tower-skin.mjs): fluting by exclusion, bands, strut frames/panels, ledge slabs, lamp panels.
3. Deck (parts/deck.mjs): plot 1 whole section, plus plot 0 deck through the tower and walkways.
4. Cables (parts/cables.mjs): plots 2 and 3 cables and suspenders.
5. Lights and trim (parts/trim.mjs): lamps, lanterns, check nothing spawns.

## Notes for workers

- Plots 1-3 are local x 0..14; plot 0 deck is +16. Keep y 0 empty and nothing above stated heights.
- Keep x 16 and x 30 y 112..113 open in plot 0. Keep x 0/14 y 40..44 clear in plot 1.
- Deck section must tile: every layer continuous at z 0 and z 15.
- Cable must be 8-connected; verify by listing cells per z.
- Recesses are made by NOT placing the front block.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (coordinates from plan.md; module-local; plot 0 cross-section is +16 in x)

Parts: P1 tower-massing (parts/tower.mjs), P2 tower-skin (parts/tower-skin.mjs), P3 deck-section (parts/deck.mjs, also drawn through plot 0 by the tower parts via deckSection), P4 cables (parts/cables.mjs, plots 2 and 3), P5 lights-and-trim (parts/trim.mjs).

- [ ] South tower, two legs, stepped taper: S1..S4 boxes of plan.md SITE table (orange_terracotta solid cells), taper steps at y 55/80. Part P1. Helper legStage.
- [ ] Riveted fluting / recessed panels on every face: FACADES list; front cell NOT placed (exclusion), red_terracotta behind. Part P2. Helper fluteFace.
- [ ] Orange bands y 6..7, 53..54, 78..79, 103..104, 111 (orange_concrete). P2. bandCourse.
- [ ] Four portal struts (y 55..60, 72..77, 90..95, 106..112) + crown 113/114, haunches under each, recessed frames + raised panels, shroomlight tops. P1 (mass) + P2 (frames). Helper portalStrut.
- [ ] Lower strut y 28..33 (carries deck, red_concrete accents), bottom tie y 6..7, X cross brace y 8..27 4 deep. P1. Helper xBrace.
- [ ] Road deck through plot 0 (z 0..7, 16..23 full section; z 8..15 road+floor beams only), truss y 34..37, Warren diagonals. P3. Helper deckSection(x0, z0, z1).
- [ ] Cantilevered walkways x 11..18 / 28..35, corbels, girder/railing outline. P1/P3. Helper walkway.
- [ ] Cable saddle housings and open grooves x 16, x 30 y 112..113; caps y 114, 115; red aircraft light red_stained_glass over glowstone at y 116. P1. Helper saddleCap.
- [ ] Pier (light_gray_concrete y 1..4, polished_andesite y 5) and elliptical fender ring (y 1..3). P1. Helper fenderRing.
- [ ] Setback ledges covered with bottom smooth_red_sandstone_slab. P2.
- [ ] Deck section plot 1: road gray_concrete x 3..11, yellow centre line x 7, white dashes x 5, 9, sidewalks light_gray x 1..2, 12..13, orange railing (red_sandstone_wall y 39), brackets z 0,4,8,12 (orange_concrete y 38..39), seamless at z 0/15. P3. Helper deckSection.
- [ ] Street lamps (pairs at z 8): terracotta base y39, wall shaft y40..41, lantern y42. P5. Helper deckLamp.
- [ ] Main cables plots 2 and 3, catenary, 8-connected, slab half-steps, bands z mod 4 = 0 orange_concrete. P4. Helper cableCell, cableLine.
- [ ] Suspender ropes every 4 blocks (red_stained_glass_pane), plot 2 y 40..base-1, plot 3 z 12..168 steps. P4. Helper suspender.
- [ ] Lighting: shroomlight floor-beam lights, portal lamp panels, pier/fender lanterns so nothing spawns. P5. Helper lanternAt.
```

### rooms.json

```json
{"entrance":null,"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{"roles":{"steel":["orange_terracotta"],"backs":["red_terracotta"],"highlight":["orange_concrete"],"accent":["red_concrete"],"shaping":["smooth_red_sandstone_slab","smooth_red_sandstone_stairs"],"railing":["red_sandstone_wall"],"ropes":["red_stained_glass_pane"],"road":["gray_concrete"],"lane_centre":["yellow_concrete"],"lane_dash":["white_concrete"],"sidewalk":["light_gray_concrete"],"pier_top":["polished_andesite"],"Tower, portal struts, trusses and orange structural body":["red_terracotta","orange_terracotta","red_concrete","orange_concrete"],"Cable curves, bands, brackets and stepped frame details":["cut_copper","cut_copper_stairs","cut_copper_slab"],"Road and lane markings":["gray_concrete","white_concrete","yellow_concrete"],"Sidewalks, pier and fender":["light_gray_concrete","smooth_stone","smooth_stone_slab","polished_andesite","polished_andesite_stairs","polished_andesite_slab"],"Suspenders and railings":["red_stained_glass_pane"],"Street, walkway and warning lights":["lantern","glowstone","red_stained_glass"]},"objects":["lantern","shroomlight","glowstone","red_stained_glass"]}
```

### make.sh

```sh
#!/usr/bin/env bash
# The one command that makes build.nbt from scratch: node build.mjs writes every part in plan order to a temp file,
# the temp file must read back as a structure, then it moves into place. Stubs yield the bare grid (no ground course).
set -euo pipefail
cd "$(dirname "$0")"

MCD_JS=/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs
TMP=build.tmp.nbt
trap 'rm -f "$TMP"' EXIT

node build.mjs "$TMP"
node "$MCD_JS" info "$TMP" > /dev/null
mv "$TMP" build.nbt
echo "build.nbt written"
```

### build.mjs

```js
// Builds the Golden Gate south tower and suspension span from its parts, in plan order. runParts lets each part only
// ADD into air (writes into an earlier part's cells are refused and reported) and reports off-palette blocks per part.
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE } from "./vocab/base.mjs";
import * as tower from "./parts/tower.mjs";
import * as towerSkin from "./parts/tower-skin.mjs";
import * as deck from "./parts/deck.mjs";
import * as cables from "./parts/cables.mjs";
import * as trim from "./parts/trim.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// no ground course: y 0 is the water surface, every cell not built stays air
const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });

runParts(
  g,
  [
    ["tower massing", tower.build],
    ["tower skin", towerSkin.build],
    ["deck", deck.build],
    ["cables", cables.build],
    ["lights and trim", trim.build],
  ],
  { palette: "palette.json", roof: "roof.json" },
);

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the Golden Gate kit: palette ids (palette.json only), plan.md site coordinates, seeded rng.
// Plot origins: plot 0 (tower) is the frame itself; plots 1-3 sit further along x in the one grid (plan.md's cross-
// section is module-local, so a part adds PLOT_X.* to its plot-1..3 x values). Plot-local coordinates otherwise.

// palette (ids as in palette.json; bare names, the toolkit adds minecraft:)

// palette (ids as in palette.json; bare names, the toolkit adds minecraft:)
/** Steel body: legs, struts, chords, girders, cable body. */
export const STEEL = "orange_terracotta";

/** Recess backs, truss diagonals, deck plate, X brace. */
export const BACK = "red_terracotta";

/** Bands, raised strut panels, brackets, cable bands. */
export const HIGHLIGHT = "orange_concrete";

/** Accent, sparingly (lower portal strut faces). */
export const ACCENT = "red_concrete";

/** Bottom slab for ledges and cable half-steps. */
export const SLAB = "smooth_red_sandstone_slab";

/** Corbels (placed upside down) and shaping stairs. */
export const STAIR = "smooth_red_sandstone_stairs";

/** Railing and lamp shafts. */
export const RAILING = "red_sandstone_wall";

/** Suspender ropes. */
export const ROPE = "red_stained_glass_pane";

/** Road surface. */
export const ROAD = "gray_concrete";

/** Centre lane line. */
export const LANE_CENTRE = "yellow_concrete";

/** Lane dashes. */
export const LANE_DASH = "white_concrete";

/** Sidewalks, walkways, pier and fender body. */
export const SIDEWALK = "light_gray_concrete";

/** Pier and fender top course. */
export const PIER_TOP = "polished_andesite";

/** Street and walkway lanterns. */
export const LANTERN = "lantern";

/** Hidden lights in floor beams, strut tops and lamp panels. */
export const SHROOM = "shroomlight";

/** Glow under the aircraft warning light. */
export const GLOW = "glowstone";

/** Aircraft warning light glass. */
export const WARNING_GLASS = "red_stained_glass";

// site (grid size and plot origins along x; all y/z are plot-local, see plan.md)
/** Plot origins along x in the one grid. */
export const PLOT_X = { tower: 0, deck: 48, mainCable: 63, sideCable: 78 };

/** Full kit extent: x 0..92 (plot 3 ends at 78+14), y 0..116, z 0..248. */
export const SITE_SIZE = [93, 117, 249];

/** y 0 is the water surface: nothing there, no ground course. */
export const WATER_Y = 0;

// shared cross-section (plots 1-3 x; plot 0 adds TOWER_DECK_X)
/** Plot 0 cross-section offset: its deck sits 16 further along x. */
export const TOWER_DECK_X = 16;

/** Rail and lamp stand level. */
export const RAIL_Y = 39;

/** Road and sidewalk surface (people stand on it at RAIL_Y). */
export const ROAD_Y = 38;

/** Edge girder and truss top chord. */
export const GIRDER_Y = 38;

/** Deck plate (closed underside) and truss top chord row. */
export const DECK_PLATE_Y = 37;

/** Warren diagonals span these rows. */
export const DIAGONAL_Y = [35, 36];

/** Floor beams (shroomlight at z % 4 = 0). */
export const FLOOR_BEAM_Y = 35;

/** Bottom chord and lateral bracing. */
export const BOTTOM_Y = 34;

/** Road lanes and sidewalks x (plots 1-3): road 3..11, sidewalks 1..2 and 12..13, edges 0 and 14. */
export const ROAD_X = [3, 11];

export const SIDEWALK_X = [[1, 2], [12, 13]];

export const EDGE_X = [0, 14];

/** Warren period: z % 4 = 1 -> y 35, = 2 -> y 36, = 3 -> y 35, = 0 open (node on the bottom chord). */
export const WARREN_PERIOD = 4;

/** Tiles every 16 blocks along z. */
export const DECK_TILE = 16;

// plot 0: south tower (local coordinates, x 0..46, z 0..23, y 1..116)
/** Fender ring outer and inner ellipse semi-axes; plan.md ring test. */
export const FENDER = { x: [0, 46], y: [1, 3], z: [0, 23], outer: { ax: 23.5, az: 12 }, inner: { ax: 21.5, az: 10 }, centre: { x: 23, z: 11.5 } };

/** Pier body and top course. */
export const PIER = { x: [11, 35], y: [1, 5], z: [5, 18], topY: 5 };

/** Leg stages on the west side; east mirrors x' = 46 - x (east S3/S4 x 28..31). */
export const LEG_STAGES = [

/** Tower x mirror: x' = TOWER_MIRROR - x. */
export const TOWER_MIRROR = 46;

/** Bottom tie beam, X brace, lower portal strut (carries the deck). */
export const TIE = { x: [19, 27], y: [6, 7], z: [10, 13] };

export const X_BRACE = { x: [19, 27], y: [8, 27], z: [10, 13] };

export const LOWER_STRUT = { x: [19, 27], y: [28, 33], z: [10, 13] };

/** Portal struts 1-3 and top strut (x 19..27, z 10..13). */
export const STRUTS = [

/** Top strut crown: a 9x4 course at y 113, a 5x2 cap at y 114. */
export const CROWN = { y113: { x: [19, 27], z: [10, 13] }, y114: { x: [21, 25], z: [11, 12] } };

/** Deck through the tower: full section z 0..7 and 16..23; road + floor beams only z 8..15 (bearing on the legs). */
export const TOWER_DECK = { x: [16, 30], y: [34, 39], z: [[0, 7], [16, 23]] };

export const PORTAL_DECK = { x: [19, 27], y: [34, 38], z: [8, 15] };

/** Walkway platforms at y 38 (x 12..18 and mirror 28..34), along the leg and its corbels at y 37. */
export const WALKWAY = { platformX: [12, 18], platformZ: [[6, 7], [16, 17]], legX: [12, 13], legZ: [8, 15], corbelY: 37, corbelZ: [8, 11, 12, 15] };

/** Setback ledges (bottom slab course): S1->S2 at y 55 on z 8 and z 15; S2->S3 at y 80 on x 14 / x 32 and z 9 / z 14. */
export const LEDGE_Y = { s1s2: 55, s2s3: 80 };

/** Bands, solid orange_concrete courses across each leg. */
export const BANDS = [[6, 7], [53, 54], [78, 79], [103, 104], [111, 111]];

/** Top caps (west; east mirror). */
export const CAP = { legTop: 112, housingWalls: 113, housingRoof: 114, lights: 115, warning: 116 };

/** Cable grooves open through the tower top: x 16 and x 30, y 112..113, z 10..13. */
export const GROOVE_X = [16, 30];

export const GROOVE = { y: [112, 113], z: [10, 13] };

/** Portal roadway clearance: x 19..27, y 39..52, z 8..15. */
export const PORTAL_ROAD = { x: [19, 27], y: [39, 52], z: [8, 15] };

/** Deck lamps (plot 1) and walkway lamps (plot 0, same design). */
export const DECK_LAMP_Z = 8;

export const DECK_LAMP_X = [1, 13];

export const WALKWAY_LAMPS = [[12, 6], [12, 17], [34, 6], [34, 17]];

/** Pier lanterns (y 6) and fender lanterns (y 4), plot-0 coordinates. */
export const PIER_LANTERNS = [[11, 5], [23, 5], [35, 5], [11, 18], [23, 18], [35, 18]];

export const FENDER_LANTERNS = [[0, 11], [46, 12], [23, 0], [23, 23], [3, 7], [43, 7], [3, 16], [43, 16], [15, 1], [31, 1], [15, 22], [31, 22]];

// plot 1: deck section (local x 0..14, z 0..15, y 34..44)
/** Tiles along z: 0..15, every layer continuous at z 0 and z 15. */
export const PLOT1 = { z: [0, 15], y: [34, 44] };

/** Suspender anchor brackets: x 0 and x 14, z 0, 4, 8, 12, y 38..39. */
export const ANCHOR_X = [0, 14];

export const ANCHOR_Z = [0, 4, 8, 12];

export const ANCHOR_Y = [38, 39];

/** Lane lines: centre x 7 (continuous); dashes x 5 and x 9 at z 0..3 and 8..11. */
export const LANE_CENTRE_X = 7;

export const LANE_DASH_X = [5, 9];

export const LANE_DASH_Z = [[0, 3], [8, 11]];

/** Suspender clear zone: x 0 and x 14, y 40..44 (all z). */
export const SUSPENDER_CLEAR_Y = [40, 44];

// plots 2 and 3: cables (plot-local x 0..14)
/** Main-span cable: f(z) = 41.9 + 0.00069 (z+72)^2, z 0..248. */
export const MAIN_CABLE = { z: [0, 248], a: 41.9, k: 0.00069, zc: 72, x: [0, 14] };

/** Side-span cable: f = 112.8 - 0.6475u + 0.001165u^2 (u = z + 0.5) for z 0..171; then level at y 36 for z 172..231. */
export const SIDE_CABLE = { z: [0, 231], curveZ: [0, 171], levelY: 36, levelZ: [172, 231], a: 112.8, b: 0.6475, c: 0.001165, x: [0, 14] };

/** Cable bands every 4 blocks in z (orange_concrete body block where z % 4 = 0). */
export const BAND_PERIOD = 4;

/** Suspender rows: main every 4 blocks in z from 0 to 248; side at z 12, 16, ..., 168. */
export const SIDE_SUSPENDER_Z = [12, 168];

/** Side suspender bottoms by z band (from y, up to base-1). */
export const SIDE_SUSPENDER_BOTTOM = [[12, 43, 40], [44, 75, 39], [76, 107, 38], [108, 139, 37], [140, 171, 36]];
```

### vocab/h1.mjs

```js
// plan.md VOCABULARY, part 1: legStage, bandCourse, xBrace, saddleCap, walkway, cableCell, lanternAt.
// Every helper takes its position as arguments and returns { placed, refused }; refused = [x, y, z, block, reason].
// Writes stay inside the footprint the helper computes from its arguments, go only into air (opts.over replaces),
// and never touch y < 1 (nothing at y 0). Side "east" mirrors the west-frame x as x' = span - x (plot 0 span 46).

// One solid orange_terracotta box of a leg stage. x0..x1 are given in the west frame; side "east" mirrors them.
export function legStage(g, side, y0, y1, x0, x1, z0, z1, opts = {})

// One full orange_concrete course at height y across the plan rectangle box = [x0, z0, x1, z1] (a leg's face band).
export function bandCourse(g, y, box, opts = {})

// The X cross brace: two red_terracotta diagonals across box = [x0, y0, z0, x1, y1, z1]; the second is mirrored
// about the box's centre (x' = x0 + x1 - x). Where the diagonal jumps more than one x between rows, the gap cells fill.
export function xBrace(g, box, opts = {})

// Cable saddle housing over a tower top. box = [x0, y0, z0, x1, z1] in the west frame, the 4-wide leg top
// (x0..x0+3), y0 = the leg's top course (112). The groove is the column x0+1: open at y0 and y0+1, roofed at y0+2,
// glowstone and aircraft light above it. Side "east" mirrors the whole cap.
export function saddleCap(g, side, box, opts = {})

// The cantilevered walkway beside a leg: light_gray_concrete platforms and strip at y 38, stair corbels under it at
// y 37, and the edge girder (orange_terracotta, y 38) with its railing (red_sandstone_wall, y 39) on the outline.
// at = where the plot's walkway anchor (12, 38, 6) lands in the west frame; side "east" mirrors it.
export function walkway(g, side, at = WALK_ANCHOR, opts = {})

// One main-span or side-span cable cell at (x, z) on the catenary height f: a full body block at floor(f) (every 4th
// z in orange_concrete, the bands), plus a bottom slab in the cell above when f is at least half a block past it.
export function cableCell(g, x, z, f, opts = {})

// One lantern at (x, y, z). Standing (default) needs a solid block under it; opts.hanging hangs it from a block above.
export function lanternAt(g, x, y, z, opts = {})
```

### vocab/h2.mjs

```js
// Helpers for plan.md's VOCABULARY: fluteFace, portalStrut, fenderRing, deckSection, deckLamp, suspender.
// Each takes its position as arguments (module-local coordinates) and writes only its own footprint, only into air:
// a cell that is already built is refused, never overwritten. Every helper returns { placed, refused: [[x, y, z], ...] }.

/**
 * Fluted leg face (plan.md FACADES). face: the outward side of the leg box x0..x1, z0..z1 ("north" / "south" / "east" /
 * "west"). ribs and recesses are the columns (x for north/south, z for east/west) on that face. A rib stays steel; a
 * recess leaves its front cell air and puts red_terracotta one cell behind it. Pass y0..y1 between two band courses.
 * skin: true when the leg's own steel is already built (legStage): the recess front is carved out of it and the back
 * is written over it. Without skin, cells must be air.
 */
export function fluteFace(g, face, y0, y1, x0, x1, z0, z1, ribs, recesses, { skin = false } = {})

/**
 * Portal strut (plan.md VOCABULARY): steel box x0..x0+8, z0..z0+3, yBottom..yTop. haunches: the stepped corners in the
 * two rows under it. frame: a recessed frame on both z faces (x0+2..x0+6 over the inner rows; front cells left out, red
 * behind; an orange_concrete panel at the face over x0+3..x0+5 in the middle rows) and a shroomlight flush in the top
 * at x0+4. opts.frame false: a plain steel box (the lower strut). opts.light: the y of the top shroomlight (default
 * yTop; the top strut's crown sits above it, at 114).
 */
export function portalStrut(g, x0, z0, yBottom, yTop, haunches, { frame = true, light = yTop } = {})

/**
 * Elliptical fender ring (plan.md): centre (cx, cz); outer half-axes 23.5 x 12, inner 21.5 x 10. Cells between the two
 * ellipses: light_gray_concrete at y 1..2, polished_andesite at y 3. Nothing at y 0.
 */
export function fenderRing(g, cx, cz)

/**
 * Deck cross-section (plan.md SITE) for z0..z1 at x offset xOff (plot 1: 0, the tower's deck: 16). Rows: railing and
 * lamp level y 39 (red_sandstone_wall, connected to its neighbours); road y 38 x 3..11 (gray_concrete, yellow centre
 * line at x 7, white dashes at x 5 and 9 on z 0..3 and 8..11); sidewalks y 38 x 1..2 and 12..13; edge girders and
 * truss top chords at x 0 and 14; deck plate y 37 x 1..13; Warren diagonals at x 0 and 14 on z mod 4 (open at 0);
 * floor beams y 35 x 1..13 on z mod 4 = 0 with a shroomlight at x 7; bottom chord y 34 at x 0 and 14 and the two
 * lateral bracing lines; brackets orange_concrete at x 0 and 14 on z mod 4 = 0.
 * opts.portal: the stretch through the tower's portal, road and floor beams only, x 3..11 (plan.md).
 */
export function deckSection(g, xOff, z0, z1, { portal = false } = {})

/** Street lamp (plan.md): orange_terracotta base at y 39, red_sandstone_wall shaft y 40..41, lantern standing at y 42. */
export function deckLamp(g, x, z)

/** Suspender rope (plan.md): red_stained_glass_pane column from yBottom to yTop, no side connections (a thin post). */
export function suspender(g, x, z, yBottom, yTop)
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
