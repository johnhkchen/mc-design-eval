# Antipolar: the land works, by schematicannon

Built on `input/antipolar_expansion_002_raw.nbt` (140 × 18 × 195). **Every corner below is counted from that export's lowest
north-west corner** (it sits at Polarton's (18, 3, 64)). y is the export's own: the swamp's water surface is y 0, so a
corner at y −4 is four blocks below the export's bottom.

The cannon reads any cell a file leaves out as air, so every fill and dig file holds the whole of its box. Below y 0 the
export shows nothing, so files only reach under the water inside the levee ring's rectangle (x 8–76, z 38–154), where
every block is set.

## The order

**0. Staging.** `0-staging.nbt` has your export's footprint (140 × 195) and starts at its bottom; it is 23 tall, to reach the decks.
- **Where:** put it back where you took `antipolar_expansion_002_raw.nbt` from. Use the same corner and the same bottom,
  so the hologram's outline sits on the area you selected for the export. Corner (+0, +0, +0), no rotation.
- **Mode:** *Don't Replace Solid*. It holds no air and only places into air and water.
- **Line it up on the road:** the file carries the end of Polarton's terrace road as it stands now: gravel, path,
  coarse dirt, and the pasture's spruce fence and gate (x 8–26, z 12–28, where the road runs out toward the swamp). Move
  the hologram until its road lies exactly on the real one. Those blocks are already there, so the paste leaves them alone.
- **Check:** a pink wool post, 3 high, stands at each of the export's 4 corners. If the posts land on the corners of the
  land you exported, it's aligned. Take the posts away afterwards.
- **Finding the corner:** the export's corner is Polarton's export corner + (18, 3, 64). That's x + 18, y + 3, z + 64 from
  where `polarton_expansion_001_xl.nbt` began.

It gives you:
- **8 scaffolding towers**, one per section: a column up from the ground to a 5 × 5 deck at y 22, with the section's letter in
  pink wool on the deck. Put that section's cannon and chests on the deck. The deck sits above every box.
- **Pink wool at the 4 corners of each section's fill box**, a block above the ground (on the water where it is wet).
  Line the hologram up on them. That section's own paste removes them.
- **Magenta wool at the 4 corners of each below-water box** (sections A, C, E), a block above the finished fill. They
  outlast the fill so you can line up the dig. Take them away by hand afterwards.

**1. Fill.** For every section paste `1-<S>-fill.nbt`, and for A, C and E also `1-<S>-fill-below.nbt` (*Replace Solid with
Empty*, no rotation). The two can run in either order. The levee ring goes up, and its inside is landfilled solid from
y −4 to y 0. Nothing is dug and no water is left open, so nothing can flood. The towers are part of every file that
covers them, so the cannons never take their own towers down.

**2. Dig, once A, C and E are all filled** (the ring is then closed all round): paste `2-A-dig.nbt`, `2-C-dig.nbt`,
`2-E-dig.nbt`. These dig the polder down to its floor at y −2 and cut the seepage ditch, canals, field ditches and paddies.
Digging solid fill inside a closed ring lets no water in.
- **The cannon does not place water** (I believe it skips fluids; worth a check on the test pond first). The ditches and
  paddies will come out dry. Flood them from the swamp with buckets, or later through the pump houses.

**3. Afterwards:** break the bottom block of each tower (scaffolding all falls), take away the magenta wool.

## Files

| File | Section | Kind | Corner (x, y, z) | Size | KB | Mode |
|---|---|---|---|---|---|---|
| 0-staging.nbt | all | staging | +0, +0, +0 | 140 × 23 × 195 | 2 KB | Don't Replace Solid (placement only: it holds no air) |
| 1-A-fill.nbt | A shore west | fill | +7, +0, +26 | 70 × 15 × 27 | 62 KB | Replace Solid with Empty |
| 1-A-fill-below.nbt | A shore west | fill below | +8, -4, +38 | 69 × 4 × 15 | 9 KB | Replace Solid with Empty |
| 2-A-dig.nbt | A shore west | dig | +8, -4, +38 | 69 × 5 × 15 | 12 KB | Replace Solid with Empty |
| 1-B-fill.nbt | B shore east | fill | +77, +0, +28 | 50 × 14 × 25 | 38 KB | Replace Solid with Empty |
| 1-C-fill.nbt | C polder north | fill | +2, +0, +53 | 75 × 14 × 47 | 107 KB | Replace Solid with Empty |
| 1-C-fill-below.nbt | C polder north | fill below | +8, -4, +53 | 69 × 4 × 47 | 30 KB | Replace Solid with Empty |
| 2-C-dig.nbt | C polder north | dig | +8, -4, +53 | 69 × 5 × 47 | 38 KB | Replace Solid with Empty |
| 1-D-fill.nbt | D waterfront north | fill | +77, +0, +53 | 36 × 13 × 47 | 51 KB | Replace Solid with Empty |
| 1-E-fill.nbt | E polder south | fill | +1, +0, +100 | 76 × 14 × 55 | 126 KB | Replace Solid with Empty |
| 1-E-fill-below.nbt | E polder south | fill below | +8, -4, +100 | 69 × 4 × 55 | 35 KB | Replace Solid with Empty |
| 2-E-dig.nbt | E polder south | dig | +8, -4, +100 | 69 × 5 × 55 | 44 KB | Replace Solid with Empty |
| 1-F-fill.nbt | F waterfront south | fill | +77, +0, +100 | 48 × 14 × 55 | 84 KB | Replace Solid with Empty |
| 1-G-fill.nbt | G bluff and plateau | fill | +0, +0, +155 | 77 × 10 × 25 | 44 KB | Replace Solid with Empty |
| 1-H-fill.nbt | H pasture | fill | +77, +0, +155 | 45 × 12 × 25 | 32 KB | Replace Solid with Empty |

## Towers (cannon decks at y 22)

| Section | x, z | Column y | Where |
|---|---|---|---|
| A | 41, 37 | 2..21 | in its section |
| B | 89, 23 | 1..21 | just outside its section |
| C | 5, 54 | 2..21 | in its section |
| D | 63, 37 | 2..21 | just outside its section |
| E | 5, 135 | 1..21 | in its section |
| F | 108, 133 | 1..21 | in its section |
| G | 38, 167 | 9..21 | in its section |
| H | 99, 163 | 1..21 | in its section |

## Checked

A simulated run over the export (unknown cells below y 0 taken as water) goes like this:
- **Staging**, then all fills: no open cell is left below y 1 inside the ring, and all pink markers are gone.
- **Then all digs:** the result is the finished design block for block (0 mismatches).

## What it builds

- **Levee ring** (x 14 / 70, z 44 / 148): the crest is a 5-wide street at y 2, Polarton's lane grade.
  - Banks at 1 in 2 with a packed-mud core.
  - Riprap (cobble, mossy cobble, stone, andesite) on the swamp face.
- **The polder floor at y −2**, two below the swamp:
  - A seepage ditch at the inner toe.
  - Two drainage canals (water at y −3) with farm lanes and sluice gates.
  - The polder road down the middle on plank bridges over the canals.
  - Half-step ramps (flights of 3, then landings) up to the north and south levees.
  - **Faubourg:** 4 lots of 12 × 14, raised a block on fill.
  - **Fields:** field ditches every 9 rows, level with the farmland.
  - **Rice beds:** paddies a block deep behind bunds.
- **Waterfront:**
  - Made land at street level behind timber bulkheads for M1–M5, the distillery (10 × 22) and the brewhouse (10 × 22).
  - A 3-wide boardwalk on piles behind them, level alleys between them.
  - 9 finger piers at boat height (y 1) down half steps.
  - The island boardwalk.
  - A pirogue landing off the west levee.
- **Boatyard** on made land:
  - 2 slipways into the water.
  - Sites for the boat shed, sawmill and timber yard, and a back row (steam box, pitch kettle, chandler).
  - A channel to every mooring (5 cells of mud dredged).
- **Stubs ready to extend:**
  - the shore street east (polder 4's north levee);
  - the south levee east (polder 4's south levee);
  - the plateau road west;
  - the pasture road;
  - the grove lane west;
  - the island boardwalk east.
- **Trees:** 718 log blocks felled on or over the works, with their leaves; 1024 floating leaves and vines cleared.

## Materials (roughly)

- **Fill:** about 11300 blocks of earth above the water line, and about 11700 below it (all landfill; the dig takes about 6,000 of those back out as you go).
- **Stone and wood:** about 1700 riprap stones, 762 plank deck cells, and 282 piles.

`final-world.nbt` and `landfill-world.nbt` (one level up) are the finished and filled states for checking; they hold world y −4..23 at grid
y 0..27.
