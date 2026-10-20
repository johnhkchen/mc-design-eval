# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Six Giant Rocks Viewpoint (Xiangshan): plan

Plot 0, local coords x 0..105, z 0..100, y 0..74 (nothing at y 75 or above). Minecraft 1.21.1 blocks only.
No street here: this is a hillside. North (low z) is the downhill side toward the city and the camera's view;
the hill climbs to the south-east. Exterior only, no rooms.

## SITE

**Ground grid → blocks.** GROUND cell (column c, row r) covers x 3c..3c+2, z 3r..3r+2 (column 35 clipped to
x 105, row 33 clipped to z 99..100). The value is the top ground block's y in that cell. Rebuild the hillside:
- Interpolate the surface between cell centres (x 3c+1, z 3r+1) so it rises in 1-block steps, never 3x3 terraces.
  Each centre cell keeps its exact map value.
- Solid below the surface down to y 0: surface block, 3 blocks of `dirt` under it, `stone` below that.
- Low point: north-east corner, y 1 (x 105, z 0). High point: south-east corner, y 63 (x 105, z 100).
- A knoll on the west side (x 12..29, z 45..71, up to y 44) has steep flanks.

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| Hillside ground | 0..105 | 0..63 | 0..100 | the whole plot, per GROUND map |
| R1 lead rock (NW, behind the platform) | 34..47 | 35..52 | 46..58 | 14 x 13, 17 tall; north face hangs over the deck's back edge |
| R2 | 49..59 | 37..50 | 47..57 | 11 x 11, 13 tall; leans west (top shifted 1 toward R1); gap x 48 (1 wide, slot) to R1 |
| R3 tallest (E) | 62..75 | 35..53 | 46..59 | 14 x 14, 18 tall; gap x 60..61 (2 wide, open cleft) to R2 |
| R4 (SW, back row) | 38..50 | 43..56 | 60..71 | 12 x 12, 13 tall; nearly touches R1 at z 59 (1-wide crack) |
| R5 leaning (S, back row) | 53..64 | 45..61 | 61..70 | 12 x 10, 16 tall; top 3 rows lean 2 cells north-west and rest on R2's crown (they touch at about x 55..58, z 57..60, y 49..50) |
| R6 low (SE) | 66..76 | 46..56 | 62..71 | 11 x 10, 10 tall |
| Viewing platform deck | 42..66 | 36..38 | 30..45 | prow footprint below; deck top y 37, walking level y 38 |
| Deck posts/footings | on the deck's perimeter and every 4 cells inside | ground..35 | 30..45 | up to about 9 tall at the north prow (ground there y 28) |
| Lower trail (from the north edge up to the deck) | 67..68 | 8..37 | 0..45 | 2 wide; enters the deck from the east at z 42..45 |
| Upper trail (deck up to the south-east) | 67..79 then 78..79 then diagonal | 35..63 | 42..100 | 2 wide: east along z 42..43 to x 79, south along x 78..79 to z 74, then diagonal to the south edge at x 96..97, z 100 |
| Rock-cleft spur | 60..61 | 38..44 | 46..59 | 2-wide stepped path from the deck's south edge up into the R2/R3 cleft, dead end with a lantern |
| Tree T1 (east edge) | trunk 98, crown 94..102 | 32..44 | trunk 44, crown 40..48 | ground about y 31 |
| Tree T2 (south-east edge) | trunk 88, crown 84..92 | 61..71 | trunk 93, crown 89..97 | ground about y 60; crown top y 71 or lower |
| Tree T3 (south-west edge) | trunk 20, crown 16..24 | 35..46 | trunk 95, crown 91..99 | ground about y 34 |

**Platform footprint.** A stepped prow pointing north-west:

| Part | x | z |
|---|---|---|
| West block | 42..56 | 30..45 |
| Middle step | 57..62 | 34..45 |
| East step | 63..66 | 38..45 |

The deck's south edge (z 45) meets R1 at x 42..47 and the slope at x 48..66.

**Rock shape (every rock).**
- Rounded boulder, not a box. Each horizontal slice is an ellipse filling the rock's x/z box.
- Widest at about 1/3 of the height. The bottom 2 courses are inset 1 (undercut, so the rock reads as sitting on
  the ground). The top 4 courses step in 1–2 per course to a domed crown.
- Bury the bottom course 1 block into the ground.
- Gaps between rocks stay air from the ground to the sky; R4/R5's lean is the only contact.
- Carve 2–3 vertical cracks per rock (1-wide notches, 1 deep, 4–8 tall) on the north and west faces.

**Bench, sign and lamps.**
- Bench: two spruce benches on the deck facing north, at x 49..51, z 44 and x 58..60, z 44.
- Trail sign: x 69, z 41, at y = ground + 1 to +2.
- Lantern posts:
  - deck corners (42,30), (56,30), (66,38), (42,45), (66,45);
  - lower trail at z 10, 20, 30 (x 69);
  - upper trail at (79, 52), (79, 64), (86, 82), (94, 96);
  - cleft spur end (61, 58).

## ROOFS

None. There is no building. The deck is open to the sky (no pavilion roof); nothing stands above the deck rail.
Rock crowns are the silhouette: R5 (y 61) and R3 (y 53) are the high points. No `$MCD roof` preset is used.

## FACADES

There are no building faces. These are the readable "faces" of the scene, in order of what the camera sees
(it looks north-west, so the rocks' north and west faces and their crowns).

**Rocks, per rock, bottom → top:**
- Base, courses 1–3: `tuff` mixed with `terracotta` (about 60/40), with `moss_block` patches on the north side.
- Body: `smooth_sandstone` (about 70%), with `sandstone` streaks (vertical runs of 2–5, about 20%) and
  `orange_terracotta` weather stains (about 10%), placed in vertical drips, never as noise.
- Crown, top 2–3 courses: `smooth_sandstone`, with `moss_block` and `moss_carpet` caps over about 1/3 of the top,
  favouring the north side.
- Cracks: recessed 1, lined with `tuff`, with a `fern` at the foot of each.
- R3 and R5 also get one `brown_terracotta` band (a 1–2 course bedding seam, recessed 0) at about mid-height.
  That gives the layered sandstone look.

**Viewing platform:**
- Footings: a `stone_bricks` pad 1 block wider than each post, set on the ground.
- Posts: `dark_oak_log` axis y, from the pad to y 35. Under the north and west edges they stand at every 4 cells
  (x 42, 46, 50, 54, 56 at z 30; z 30, 34, 38, 42 at x 42; and the step corners).
- Bracing: under the north prow, `dark_oak_stairs` upside-down knee braces post → joist (1 under the joist
  line, proud 0).
- Joists: y 36, `stripped_dark_oak_log` axis z, every 2 x.
- Fascia: `dark_oak_planks` around the whole deck perimeter at y 36, proud 0.
- Deck: y 37, `spruce_planks`. The outermost ring is `dark_oak_slab` (type top) at y 37 as an edge board.
- Railing: y 38, `spruce_fence` around the perimeter. Openings stay air (see OPENINGS).
- Rail posts: `dark_oak_fence` at y 38 every 4 cells, with a `lantern` standing on top at y 39 at the 5 corners only.

**Trails:**
- Rises: `stone_brick_stairs` facing up-slope (facing south on the lower trail, east then south on the upper).
- Treads: `stone_brick_slab` bottom where the rise is half a block, full `stone_bricks` landings every 6–8 steps.
- About 1 in 6 trail blocks use the mossy variant (`mossy_stone_brick_stairs`, `mossy_stone_brick_slab`,
  `mossy_stone_bricks`), more near the rocks.
- Edges: a 1-cell border of `coarse_dirt` and `rooted_dirt` both sides.
- It is a hiking trail, so stairs are correct here (not an entrance ramp).

**Lantern posts:** `stone_bricks` base, then 2 `dark_oak_fence`, then a `lantern` standing on top.
Light is warm only (no soul lanterns).

**Planting:**
- Shrubs and ground cover anywhere (`azalea`, `flowering_azalea`, `fern`, `large_fern`, `short_grass`,
  `moss_carpet`), thickest around the rock feet and along the trails.
- Nothing taller than 2 blocks anywhere with x < 80 and z < 70 (the open view to the north-west).
- Trees only at T1–T3:
  - trunk `oak_log` (T2 `jungle_log`), 6 tall;
  - crown of persistent `oak_leaves` mixed with `jungle_leaves` (T2 `jungle_leaves` mixed with `azalea_leaves`),
    9 wide and 5 tall, irregular, not a sphere.

## MATERIALS

| Role | Block id |
|---|---|
| Ground (main, about 65%) | `grass_block` |
| Ground patches: slopes and trail borders (about 15%) | `coarse_dirt` |
| Ground near rock feet and trees (about 10%) | `moss_block`, `rooted_dirt` |
| Ground under trees | `podzol` |
| Exposed outcrop on steep cells (west knoll flanks, any cell rising more than 2 over its neighbour) | `stone`, `andesite` |
| Sub-surface | `dirt` (3 deep), then `stone` |
| Rock body | `smooth_sandstone` |
| Rock streaks | `sandstone` |
| Rock stains | `orange_terracotta` |
| Rock base and cracks | `tuff`, `terracotta` |
| Rock bedding seam | `brown_terracotta` |
| Rock moss | `moss_block`, `moss_carpet` |
| Deck | `spruce_planks` |
| Deck edge board | `dark_oak_slab` (top) |
| Fascia | `dark_oak_planks` |
| Joists | `stripped_dark_oak_log` |
| Posts | `dark_oak_log` |
| Braces | `dark_oak_stairs` |
| Railing | `spruce_fence` |
| Rail posts and lamp posts | `dark_oak_fence` |
| Footings | `stone_bricks` |
| Trail | `stone_brick_stairs`, `stone_brick_slab`, `stone_bricks`, mossy variants |
| Light | `lantern` (warm) |
| Bench | `spruce_stairs` + `spruce_trapdoor` arms |
| Sign | `spruce_sign` (standing) reading "象山 SIX GIANT ROCKS / VIEWPOINT" |
| Plants | `azalea`, `flowering_azalea`, `fern`, `large_fern`, `short_grass`, `oak_leaves`, `jungle_leaves`, `azalea_leaves` (persistent) |

All ids pass `$MCD blocks --check`. Do not use `chain`: the toolkit's registry doesn't know the 1.21.1 name, so
railings are fences. No pale oak.

Colour logic: warm buff sandstone with orange stains reads as the real tan rocks at dusk against dark green moss
and grass. The deck is a darker brown so it separates from the rock.

## OPENINGS

There are no doors or windows. These gaps in the railing stay air at y 38..39:

| Opening | x | z |
|---|---|---|
| East entry from the lower trail | 66 | 42..43 |
| East exit to the upper trail | 66 | 44..45 |
| South exit to the cleft spur | 60..61 | 45 |
| Back edge against R1, no rail (the rock is the wall) | 42..47 | 45 |

Rock gaps (air, ground to sky):

| Gap | x | z |
|---|---|---|
| R1 \| R2 | 48 | 47..57 |
| R2 \| R3 (the spur runs in it) | 60..61 | 46..59 |
| R1 \| R4 crack | 38..47 | 59 |
| R3 \| R6 | 65 | 62..71 |

## RESERVED

| Item | Cells |
|---|---|
| Trail cells (ground parts leave them for the trail part to set) | lower trail x 67..68, z 0..45; upper trail x 67..79, z 42..43; x 78..79, z 44..74; diagonal 2-wide band from (78, 74) to (96..97, 100); spur x 60..61, z 45..59 |
| Lantern post bases | the posts listed under SITE (base cell at ground level beside the trail) |
| Tree trunks | T1 (98, 44), T2 (88, 93), T3 (20, 95), from ground + 1 up |
| Bench and sign | benches at (49..51, 38, 44) and (58..60, 38, 44); sign at (69, ground + 1, 41) |
| View corridor | x 0..80, z 0..70: nothing above ground + 2 except the deck (to y 39) and the rocks |

## FLOORS

| Level | y |
|---|---|
| Deck walking level | 38 (deck top block y 37) |
| Lower trail | climbs y 9 → 37 |
| Upper trail | climbs y 36 → 63 |

There is no interior volume.

Light: lanterns as listed, plus 2 hanging `lantern`s under the deck's north fascia at (46, 35, 30) and (52, 35, 30).
They glow under the prow and light the post forest below.

# DESIGNER SECTIONS

## PALETTE
Architect's ids unchanged. Shape variants and decor, all checked with `$MCD blocks --check` (none unknown):
- Terrain: `grass_block`, `coarse_dirt`, `moss_block`, `rooted_dirt`, `podzol`, `stone`, `andesite`, `dirt`.
- Rock: `smooth_sandstone`, `sandstone`, `orange_terracotta`, `terracotta`, `brown_terracotta`, `tuff`, `moss_block`, `moss_carpet`.
- Deck: `spruce_planks`, `spruce_slab`, `dark_oak_slab` (top), `dark_oak_planks`, `stripped_dark_oak_log`, `dark_oak_log`, `dark_oak_stairs`, `spruce_fence`, `dark_oak_fence`, `stone_bricks`.
- Trail: `stone_brick_stairs`, `stone_brick_slab`, `stone_bricks`, `mossy_stone_bricks`, `mossy_stone_brick_stairs`, `mossy_stone_brick_slab`.
- Bench: `spruce_stairs`, `spruce_trapdoor`. Sign: `spruce_sign`.
- Light: `lantern` (hanging true/false).
- Plants: `azalea`, `flowering_azalea`, `fern`, `large_fern`, `short_grass`, `oak_log`, `jungle_log`, `oak_leaves`, `jungle_leaves`, `azalea_leaves` (all `persistent: "true"`).

## VOCABULARY
- `hillCell(x, z, h)`: fills x/z column to the interpolated height. Surface is grass_block (65%), coarse_dirt on slopes (>1 rise), moss_block/rooted_dirt near rock feet, stone/andesite where the rise is over 2; then 3 dirt, then stone to y 0. The interpolation is bilinear between cell centres, rounded; centres exact. Skips the RESERVED trail cells.
- `boulder(box, {lean, seam})`: per course, an ellipse in the box's x/z. Radius is full at about 1/3 height, base two courses inset 1, top 4 courses step in 1-2 into a dome; the bottom course buried 1. Base courses 1-3 tuff 60% / terracotta 40%, moss_block on the north side. Body is smooth_sandstone 70%, sandstone vertical runs of 2-5 (20%), orange_terracotta drips (10%) in vertical runs. Crown is smooth_sandstone, one third capped with moss_block/moss_carpet, mostly north. `seam`: one 1-2 course brown_terracotta band at mid-height. `lean`: the top 3 courses shift 2 north-west.
- `crack(rock, face, x|z, y0, len)`: a 1-wide, 1-deep notch 4-8 tall, lined with tuff, fern at its foot. Two or three per rock on the N and W faces.
- `deckPost(x, z)`: a stone_bricks pad 3x3 at ground, dark_oak_log axis y up to y 35, and a dark_oak_stairs brace (half top) under the joist on the north prow.
- `deckRail(path)`: spruce_fence at y 38 along the perimeter, leaving the OPENINGS as air. dark_oak_fence rail post every 4 cells; a standing lantern on the 5 corner posts at y 39.
- `bench(x0, z, face)`: three cells. spruce_stairs at (x0..x0+2, 38, z) facing north (the seat faces the view), spruce_trapdoor open arms at both ends on the south side.
- `trailRun(points, width)`: stone_brick_stairs facing up-slope on 1-block rises, stone_brick_slab (bottom) on half rises, a full stone_bricks landing every 6-8 steps. Mossy variant about 1 in 6. A coarse_dirt/rooted_dirt border 1 cell each side. Every step stands on a solid block (fill dirt below).
- `trailSign(x, z)`: a stone_bricks base, a spruce_fence post, a standing spruce_sign (rotation 4, to read from the north-west). Lines: "SIX GIANT ROCKS" and "VIEWPOINT".
- `lampPost(x, z)`: a stone_bricks base at ground, 2 dark_oak_fence, then a lantern (hanging false).
- `shrub(x, z, kind)`: azalea or flowering_azalea on grass or moss; fern, large_fern or short_grass in clumps; moss_carpet on rock feet.
- `tree(x, z, kind)`: a log trunk 6 tall on a podzol patch (radius 2), a crown of persistent leaves 9 wide and 5 tall, irregular; T2 uses jungle_log with jungle_leaves and azalea_leaves.

## ROOMS
There are no rooms (an open hillside). `rooms` is empty.

Lighting: lantern positions are the architect's list. Add standing lanterns on the ground edge of the trail every 9 cells where the plan has none.
The deck is lit by 5 corner lanterns and 2 hanging ones.

The way in: it is a hiking trail, so stairs are correct (see plan FACADES). The entrance cell is the foot of the lower trail, (67, 8, 0). The street cell is (68, 1, 0).

## PARTS
1. Terrain: parts/terrain.mjs. All the hillCell columns, from y 0 to the surface. Tick the hillside.
2. Rocks: parts/rocks.mjs. The six `boulder`s, `crack`s, the seams and the R5 lean. Place after terrain, keep the gaps clear.
3. Platform: parts/platform.mjs. The pads, posts, braces, joists, fascia, deck, edge board, rail, benches. Hanging lanterns at (46,35,30) and (52,35,30).
4. Trails and lights: parts/trails.mjs. The lower and upper trails, the spur, the sign, all lantern posts, ground lanterns.
5. Planting: parts/planting.mjs. Shrubs, ferns, moss carpets and the three trees. Respect the view corridor (nothing above ground+2 in x 0..80, z 0..70, other than the rocks and the deck).
6. Dusk pass: parts/dusk.mjs. Verify light coverage, add lanterns on the trail and the deck where a gap over 9 cells is left, and check that nothing exceeds y 74 or leaves the plot.

## NOTES
- Build in site orientation. North is low z.
- Rocks come after the terrain and overwrite its columns; the trail cells are reserved from both.
- Lamp posts sit beside the trail, never in it.
- Run `$MCD check` and `$MCD fit` after each part.
- 1.21.1 only: use no `chain` (use fences) and no pale oak.
```

### elements.md

```markdown
# Required elements (Six Giant Rocks viewpoint)
All coordinates are plot-local, from plan.md. Helpers are defined in plan.md VOCABULARY.

- [ ] Hillside terrain: the GROUND map interpolated in 1-block steps, centre cells exact. Surface grass_block/coarse_dirt/moss_block/rooted_dirt, steep cells stone/andesite, 3 dirt, stone below. Part 1, `hillCell`.
- [ ] Six giant rocks R1..R6 (boxes in plan SITE): elliptical slices, widest at 1/3 height, base inset 1, domed crown, buried 1. Layers: tuff/terracotta base, smooth_sandstone body with sandstone streaks and orange_terracotta drips, moss crown. Part 2, `boulder`.
- [ ] Cracks: 2-3 notches per rock on the N and W faces, tuff-lined, fern at the foot. Part 2, `crack`.
- [ ] Bedding seam: brown_terracotta band on R3 and R5. Part 2, `boulder` option `seam`.
- [ ] R5 lean onto R2 (contact x55..58, z57..60, y49..50). The gaps stay open air. Part 2.
- [ ] Timber viewing platform (stepped prow, deck top y37): stone_bricks pads, dark_oak_log posts, upside-down dark_oak_stairs braces, stripped_dark_oak_log joists, dark_oak_planks fascia, spruce_planks deck, dark_oak_slab top edge, spruce_fence rail with the plan's gaps, dark_oak_fence rail posts. Part 3, `deckPost`, `deckRail`.
- [ ] Two benches at (49..51,38,44) and (58..60,38,44) facing north. Part 3, `bench`.
- [ ] Stone-step trail: lower (x67..68, z0..45, y8..37) and upper (to the south-east edge), the spur (x60..61). stone_brick_stairs/slab, mossy about 1 in 6, coarse_dirt/rooted_dirt borders. Part 4, `trailRun`.
- [ ] Trail sign at (69, ground+1, 41): spruce_sign reading the plan's text. Part 4, `trailSign`.
- [ ] Lantern posts (13 of them, in plan SITE), plus 2 hanging lanterns at (46,35,30) and (52,35,30), plus 5 deck-corner lanterns on dark_oak_fence. Part 4, `lampPost`.
- [ ] Shrubs and ferns: azalea, flowering_azalea, fern, large_fern, short_grass, moss_carpet at rock feet and along the trail. At most 2 high in the view corridor. Part 5, `shrub`.
- [ ] Three broadleaf trees T1..T3 at the east and south edges. Part 5, `tree`.
- [ ] Dusk light and no mob spawns: warm lanterns only. Every deck cell is within 6 of a lantern. Ground lanterns stand on the trail every 8 to 10 cells. Part 4.
```

### rooms.json

```json
{"entrance":[67,8,0],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "ground": ["grass_block", "coarse_dirt", "moss_block", "rooted_dirt", "podzol", "stone", "andesite", "dirt"],
    "rock": ["smooth_sandstone", "sandstone", "orange_terracotta", "terracotta", "brown_terracotta", "tuff", "moss_block", "moss_carpet"],
    "deck": ["spruce_planks", "dark_oak_slab", "dark_oak_planks", "stripped_dark_oak_log", "dark_oak_log", "dark_oak_stairs", "spruce_fence", "dark_oak_fence", "stone_bricks"],
    "trail": ["stone_brick_stairs", "stone_brick_slab", "stone_bricks", "mossy_stone_bricks", "mossy_stone_brick_stairs", "mossy_stone_brick_slab"],
    "bench": ["spruce_stairs", "spruce_trapdoor"],
    "sign": ["spruce_sign"],
    "light": ["lantern"],
    "plants": ["azalea", "flowering_azalea", "fern", "large_fern", "short_grass", "oak_log", "jungle_log", "oak_leaves", "jungle_leaves", "azalea_leaves"]
  },
  "objects": ["spruce_slab"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which replaces build.nbt only once it is complete.
set -eu
cd "$(dirname "$0")"
tmp="./build.$$.tmp.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Builds the Six Giant Rocks viewpoint: lays the ground, then runs every part in plan order. Usage: node build.mjs <out.nbt>
import { runParts, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { PLOT, STONE } from "./vocab/base.mjs";

const PARTS = [
  ["hillside terrain", "parts/terrain.mjs"],
  ["six giant rocks", "parts/rocks.mjs"],
  ["viewing platform", "parts/platform.mjs"],
  ["trails, sign and lamps", "parts/trails.mjs"],
  ["planting and trees", "parts/planting.mjs"],
  ["dusk light pass", "parts/dusk.mjs"],
];

// A part whose module is missing or fails to import is a no-op here, so a copy with unfinished parts still builds
async function loadPart([name, file]) {
  try {
    const { build } = await import(`./${file}`);
    return [name, build ?? (() => {})];
  } catch (e) {
    console.log(`part ${name}: not loaded (${e.code ?? e.message.split("\n")[0]}); skipped`);
    return [name, () => {}];
  }
}

// The ground laid before the parts: a stone floor at y 0 across the plot. The terrain part fills each column above it.
function layGround(g) {
  g.fill([0, 0, 0], [PLOT[0] - 1, 0, PLOT[2] - 1], STONE);
}

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(1);
}
const g = new Grid(PLOT, { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);
const list = [];
for (const part of PARTS) list.push(await loadPart(part));
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}: ${g.cells.size} blocks`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the six-giant-rocks build: palette ids, plan site coordinates, a seeded rng. Places no blocks.
// Palette: block ids from palette.json, one constant each (the role it first sits in is in the comment)

// Shared constants for the six-giant-rocks build: palette ids, plan site coordinates, a seeded rng. Places no blocks.
// Palette: block ids from palette.json, one constant each (the role it first sits in is in the comment)
export const GRASS_BLOCK = "grass_block"; // ground

export const COARSE_DIRT = "coarse_dirt"; // ground

export const MOSS_BLOCK = "moss_block"; // ground

export const ROOTED_DIRT = "rooted_dirt"; // ground

export const PODZOL = "podzol"; // ground

export const STONE = "stone"; // ground

export const ANDESITE = "andesite"; // ground

export const DIRT = "dirt"; // ground

export const SMOOTH_SANDSTONE = "smooth_sandstone"; // rock

export const SANDSTONE = "sandstone"; // rock

export const ORANGE_TERRACOTTA = "orange_terracotta"; // rock

export const TERRACOTTA = "terracotta"; // rock

export const BROWN_TERRACOTTA = "brown_terracotta"; // rock

export const TUFF = "tuff"; // rock

export const MOSS_CARPET = "moss_carpet"; // rock

export const SPRUCE_PLANKS = "spruce_planks"; // deck

export const DARK_OAK_SLAB = "dark_oak_slab"; // deck

export const DARK_OAK_PLANKS = "dark_oak_planks"; // deck

export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log"; // deck

export const DARK_OAK_LOG = "dark_oak_log"; // deck

export const DARK_OAK_STAIRS = "dark_oak_stairs"; // deck

export const SPRUCE_FENCE = "spruce_fence"; // deck

export const DARK_OAK_FENCE = "dark_oak_fence"; // deck

export const STONE_BRICKS = "stone_bricks"; // deck

export const STONE_BRICK_STAIRS = "stone_brick_stairs"; // trail

export const STONE_BRICK_SLAB = "stone_brick_slab"; // trail

export const MOSSY_STONE_BRICKS = "mossy_stone_bricks"; // trail

export const MOSSY_STONE_BRICK_STAIRS = "mossy_stone_brick_stairs"; // trail

export const MOSSY_STONE_BRICK_SLAB = "mossy_stone_brick_slab"; // trail

export const SPRUCE_STAIRS = "spruce_stairs"; // bench

export const SPRUCE_TRAPDOOR = "spruce_trapdoor"; // bench

export const SPRUCE_SIGN = "spruce_sign"; // sign

export const LANTERN = "lantern"; // light

export const AZALEA = "azalea"; // plants

export const FLOWERING_AZALEA = "flowering_azalea"; // plants

export const FERN = "fern"; // plants

export const LARGE_FERN = "large_fern"; // plants

export const SHORT_GRASS = "short_grass"; // plants

export const OAK_LOG = "oak_log"; // plants

export const JUNGLE_LOG = "jungle_log"; // plants

export const OAK_LEAVES = "oak_leaves"; // plants

export const JUNGLE_LEAVES = "jungle_leaves"; // plants

export const AZALEA_LEAVES = "azalea_leaves"; // plants

export const SPRUCE_SLAB = "spruce_slab"; // object

// Site (plan.md SITE). Coordinates are plot-local; boxes are inclusive
/** Grid size [x, y, z]: x 0..105, y 0..74 (nothing at y 75 or above), z 0..100 */
export const PLOT = [106, 75, 101];

/** Highest block y anywhere in the build */
export const HEIGHT_CAP = 74;

/** GROUND cell width: cell (column c, row r) covers x 3c..3c+2, z 3r..3r+2 (column 35 and row 33 clipped to the plot) */
export const GROUND_STEP = 3;

/** GROUND[r][c]: y of the top ground block in that cell, rows = z, columns = x. Centres (3c+1, 3r+1) keep their value */
export const GROUND = [

/** Rock boxes R1..R6: boulders sit in these; gaps between them stay air */
export const ROCKS = {
  R1: { x0: 34, x1: 47, y0: 35, y1: 52, z0: 46, z1: 58 },
  R2: { x0: 49, x1: 59, y0: 37, y1: 50, z0: 47, z1: 57 },
  R3: { x0: 62, x1: 75, y0: 35, y1: 53, z0: 46, z1: 59 },
  R4: { x0: 38, x1: 50, y0: 43, y1: 56, z0: 60, z1: 71 },
  R5: { x0: 53, x1: 64, y0: 45, y1: 61, z0: 61, z1: 70 },
  R6: { x0: 66, x1: 76, y0: 46, y1: 56, z0: 62, z1: 71 },
};

/** Viewing deck: joists at y 36, deck top y 37, walking level y 38; footprint x 42..66, z 30..45 */
export const DECK = { x0: 42, x1: 66, z0: 30, z1: 45, joistY: 36, topY: 37, walkY: 38 };

/** The deck's stepped prow footprint: west block, middle step, east step */
export const PRONGS = [

/** Two spruce benches at y 38 facing north: x0..x1 at row z */
export const BENCHES = [

/** Trail sign base cell; the sign stands at ground + 1 to +2 */
export const SIGN = { x: 69, z: 41 };

/** The 13 lantern post base cells [x, z], beside the trail or at the deck corners */
export const LANTERN_POSTS = [

/** Hanging lanterns [x, y, z] under the deck's north fascia */
export const HANG_LANTERNS = [[46, 35, 30], [52, 35, 30]];

/** Trees T1..T3: trunk cell [x, z], crown envelope box (inclusive; trunk from ground + 1) and ground y */
export const TREES = {
  T1: { trunk: [98, 44], box: { x0: 94, x1: 102, y0: 32, y1: 44, z0: 40, z1: 48 }, ground: 31 },
  T2: { trunk: [88, 93], box: { x0: 84, x1: 92, y0: 61, y1: 71, z0: 89, z1: 97 }, ground: 60 },
  T3: { trunk: [20, 95], box: { x0: 16, x1: 24, y0: 35, y1: 46, z0: 91, z1: 99 }, ground: 34 },
};

/** The view corridor (nothing above ground + 2 here except the deck to y 39 and the rocks) */
export const VIEW_CORRIDOR = { x0: 0, x1: 80, z0: 0, z1: 70 };

/** Reserved trail boxes (ground parts leave them to the trail part): lower, upper east, upper south, cleft spur */
export const TRAIL = {
  lower: { x0: 67, x1: 68, z0: 0, z1: 45 },
  upperEast: { x0: 67, x1: 79, z0: 42, z1: 43 },
  upperSouth: { x0: 78, x1: 79, z0: 44, z1: 74 },
  spur: { x0: 60, x1: 61, z0: 45, z1: 59 },
};

/**
 * True if the column (x, z) is reserved trail: the TRAIL boxes, or the 2-wide diagonal from (78, 74) to (96..97, 100).
 * @param {number} x
 * @param {number} z
 * @returns {boolean}
 */
export function onTrail(x, z)

/**
 * Seeded random numbers (mulberry32): rng(seed)() returns a float in [0, 1), the same sequence for the same seed.
 * @param {number} seed
 * @returns {() => number}
 */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Helpers from plan.md VOCABULARY: hillCell, crack, deckRail, trailRun, lampPost, tree (site, rocks, deck, trails, planting).
// Each takes the grid first, then its position (and facing or rotation where it has one). Every write goes through
// put(), which writes only into air, so an earlier part's blocks are never overwritten; a write that can't be made is
// skipped, never thrown. Block ids are literals from plan.md PALETTE. Imports nothing from the other vocab files.

/**
 * One terrain column (plan SITE and MATERIALS): stone down to y 0, 3 dirt under the surface, the surface block at y = h.
 * The caller interpolates h from the GROUND map. Options: rise = the largest height step to a neighbour (over 1 is a
 * slope, over 2 an outcrop); nearRock = a rock foot; podzol = under a tree. A column beside a reserved trail column
 * gets the trail edge (coarse or rooted dirt). Reserved trail columns are skipped (trailRun owns them).
 * @returns {number} blocks placed
 */
export function hillCell(g, x, z, h, { rise = 0, nearRock = false, podzol = false } = {})

/**
 * A 1-wide, 1-deep notch in a rock's wall, y0 up to y0 + len - 1 (plan SITE, facades: 2-3 per rock on the N and W faces).
 * face "north" cuts the z0 wall at x = pos; face "west" cuts the x0 wall at z = pos. The notch is carved to air, its
 * back and sides lined with tuff, and a fern stands on the ground at its foot. Edits only the rock's own cells, plus the
 * fern, which goes on air in front of the notch.
 * @param {{x0:number,x1:number,y0:number,y1:number,z0:number,z1:number}} rock inclusive box of the rock
 * @returns {number} cells changed
 */
export function crack(g, rock, face, pos, y0, len)

/**
 * Deck railing (plan OPENINGS, DECK rail): spruce_fence at the walking height along `path`, a dark_oak_fence post every
 * `every` cells and at each corner, and a standing lantern on each corner post. Openings stay air. Fences connect to
 * neighbouring fences of the same wood, so the rail reads as one run.
 * @param {number[][]} path [x, z] cells in order along the rail line
 * @param {{y?:number, openings?:number[][], corners?:number[][], every?:number}} [opts] y defaults to the walking level 38
 * @returns {number} blocks placed
 */
export function deckRail(g, path, { y = 38, openings = [], corners = [], every = 4 } = {})

/**
 * Stone-brick trail (plan TRAIL, PALETTE trail): `width` cells across each centre point [x, y, z], so width 2 at x 68
 * covers x 67..68 on a trail running along z. y is a whole block, or .5 for a half step (a bottom slab at floor(y)).
 * A whole step up or down is a stair facing up the slope; a point at the same y as the one before it is a full stone
 * brick (put a flat point every 6-8 steps for a landing). About 1 in 6 cells is the mossy variant. Each trail cell
 * stands on dirt (3 deep) and then stone, filled down to y 0 into air. Writes only inside the trail's own columns.
 * @param {number[][]} points [x, y, z] centre cells in travel order
 * @param {number} [width=2]
 * @returns {number} blocks placed
 */
export function trailRun(g, points, width = 2)

/**
 * Lamp post beside the trail (plan lampPost): a stone brick base on the ground, two dark oak fences, and a standing
 * lantern on top. All four cells must be air or nothing is written. Refuses a reserved trail cell.
 * @param {{ground?:number}} [opts] ground y; default: the top solid block of the column
 * @returns {number} blocks placed
 */
export function lampPost(g, x, z, { ground } = {})

/**
 * Broadleaf tree (plan PLANTING, T1-T3): a 6-tall log trunk from ground + 1, and an irregular crown 9 wide and 5 tall
 * from ground + 4, of persistent leaves. kind "oak": oak_log with oak_leaves and jungle_leaves. kind "jungle": jungle_log
 * with jungle_leaves and azalea_leaves. The trunk and crown only go into air; the podzol patch under it is hillCell's
 * podzol option, set by the terrain part.
 * @param {{ground?:number}} [opts] ground y; default: the top solid block of the column
 * @returns {number} blocks placed
 */
export function tree(g, x, z, kind = "oak", { ground } = {})
```

### vocab/h2.mjs

```js
// The h2 helpers of plan.md VOCABULARY: boulder, deckPost, bench, trailSign, shrub.
// Each takes its position (and facing, where it has one) as arguments and returns { placed, refused }.
// A helper writes only inside the footprint it computes from its arguments, and only into air unless { over: true }
// says otherwise, so the ground, sand and floor an earlier part laid are never written over.

/**
 * A rock in box [x0, y0, z0, x1, y1, z1]: one ellipse per course, widest at a third of the height, the base two courses
 * undercut by 1, the top four courses stepped in to a dome. Base (3 courses): tuff/terracotta, moss_block on the north.
 * Body: smooth_sandstone with sandstone streaks and orange_terracotta drips. Crown (top 3): smooth_sandstone with
 * moss_carpet on the exposed top, mostly north. seam: a 2-course brown_terracotta band at mid-height. lean: the top
 * three courses shift by `lean` cells north-west (true = 2); cells that would leave the box are dropped.
 * over: replace what is there (a rock set into the terrain, its buried bottom course); default is air only.
 */
export function boulder(g, box, { lean = 0, seam = false, over = false } = {})

/**
 * A deck post at (x, z): a 3x3 stone_bricks footing whose centre sits on the ground (each column fills from its own
 * ground up to the pad), a dark_oak_log post on the pad up to y `top` (required), and with `brace` (north|south|east|
 * west) a dark_oak_stairs knee brace at y `top` on that side, its back against the post. The ground is the top solid
 * block at or below `from` (default: the grid top).
 */
export function deckPost(g, x, z, { top, brace, from } = {})

/**
 * A three-cell spruce bench on row z, x0..x0+2, at height y. The seat faces `face` (north or south); the back is on the
 * opposite side, so the stairs' facing (their tall back) is OPP[face]. Open trapdoor arms stand at both ends on the back
 * side. Nothing is written above y, so the 2-high lane in front of the seat stays clear.
 */
export function bench(g, x0, y, z, face)

/**
 * A trail sign at (x, z): a stone_bricks base on the ground, a spruce_fence post above it, and a standing spruce_sign
 * (rotation 4, to read from the north-west) on top: y ground+1 to ground+3. The ground is found as in deckPost.
 */
export function trailSign(g, x, z, { from } = {})

/**
 * A planting at (x, z) on the ground found as in deckPost, never above ground + 2:
 * azalea | flowering_azalea: one bush, on grass_block or moss_block only;
 * fern | short_grass: a clump (the centre and about half of its eight neighbours);
 * large_fern: a 2-high double plant (lower and upper halves, both written or neither);
 * moss_carpet: one carpet.
 */
export function shrub(g, x, z, kind, { from } = {})
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
