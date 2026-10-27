// A 1970s-80s concrete office block on a basalt podium (way 162652115), Auckland. The lidar reads a flat roof at 43
// across most of the footprint, a 45-46 core in the middle and single-storey lower wings on the west and north-east
// edges, so the massing follows it: a 2-storey stone podium is the same block as the tower (stone and piers below
// y 8, white concrete above). Lidar tiers are quantised to 4-block floor lines (40 = the 10th floor deck, 44 = the core
// deck) and median-filtered over the 3 x 3 neighbourhood, so the roof is one clean tier with a 46-block core on top.
// Walls are every cell on the outside edge or next to a lower tier; they run from the cell's ground to its parapet
// coping. The face is a glass grid of light-blue panes (connected in the file) with white piers every 3 blocks, a
// floor-line band every 4, and spandrels; the parapet is white with a light-grey coping. The entrance is the north face,
// the lowest ground: a dark-oak door in the recessed centre bay between piers, under a basalt lintel. Interiors are air
// with a floor slab per storey (on a solid ground slab) and a roof deck, with plant boxes on the main roof and warm
// glowstone behind some of the panes. The canopy is not built: nothing can project outside the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162652115.cells.json", "utf8"));
const X = 29, Y = 58, Z = 26;
const BASE = "polished_andesite", PODIUM_BAND = "smooth_stone", BAND = "light_gray_concrete", SPANDREL = "gray_concrete";
const PIER = "white_concrete", PARAPET = "white_concrete", COPING = "light_gray_concrete", GLASS = "light_blue_stained_glass_pane";
const SLAB = "light_gray_concrete", DECK = "light_gray_concrete", PLANT = "gray_concrete", LAMP = "glowstone", DOOR = "dark_oak_door";
const TOWER_FROM = 8, DOOR_X = 15, DOOR_Z = 0;

const g = new Voxels([X, Y, Z]);
const key = (x, z) => `${x},${z}`;
const cellAt = new Map(cells.map(([x, z, gr, r]) => [key(x, z), { x, z, g: gr, r }]));
const cellOf = (x, z) => cellAt.get(key(x, z));
const CELLS = [...cellAt.values()];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const AROUND = [];
for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) AROUND.push([dx, dz]);

// tiers: the lidar roof quantised to floor lines (a core above 45 reads as 44), lower wings kept above their ground
const tier0 = new Map();
for (const c of CELLS) {
  let d = c.r >= 45 ? 44 : c.r >= 40 ? 40 : 4 * Math.floor(c.r / 4);
  d = Math.max(d, 4 * Math.ceil((c.g + 1) / 4));
  tier0.set(key(c.x, c.z), d);
}
const deck = new Map();   // the median of the 3 x 3 neighbourhood, so the lidar's 43 / 44 mosaic becomes flat tiers
for (const c of CELLS) {
  const vals = AROUND.map(([dx, dz]) => tier0.get(key(c.x + dx, c.z + dz))).filter(v => v !== undefined).sort((a, b) => a - b);
  deck.set(key(c.x, c.z), vals[Math.floor(vals.length / 2)]);
}
const D = (c) => deck.get(key(c.x, c.z));
const topOf = (d) => (d === 44 ? 46 : d === 40 ? 43 : d + 1);   // parapet coping: 43 on the tower, 46 on the core
const isWall = (c) => DIRS.some(([dx, dz]) => { const n = cellOf(c.x + dx, c.z + dz); return !n || D(n) < D(c); });
const exposedDirs = (c) => DIRS.filter(([dx, dz]) => !cellOf(c.x + dx, c.z + dz));

// the facade, by height and by the bay (piers every third block along the face)
function wallBlock(c, y, d, p) {
  if (y <= c.g) return BASE;
  if (y === p) return COPING;
  if (y > d) return (c.x + c.z) % 3 === 0 ? PIER : PARAPET;
  const tower = y >= TOWER_FROM, pier = (c.x + c.z) % 3 === 0;
  const row = y % 4;
  if (row === 0) return tower ? BAND : PODIUM_BAND;
  if (row === 3) return tower ? SPANDREL : BASE;
  return pier ? (tower ? PIER : BASE) : GLASS;
}

for (const c of CELLS) {
  const d = D(c), p = topOf(d);
  if (isWall(c)) {
    for (let y = 0; y <= p; y++) g.set(c.x, y, c.z, wallBlock(c, y, d, p));
  } else {
    for (let y = 0; y <= c.g; y++) g.set(c.x, y, c.z, BASE);                  // ground slab (and foundation)
    for (let y = 4; y < d; y += 4) if (y > c.g) g.set(c.x, y, c.z, SLAB);     // a floor slab per storey
    g.set(c.x, d, c.z, DECK);
  }
}

// the entrance: a dark-oak door in the recessed centre bay of the north face, piers either side, a basalt lintel
for (const x of [DOOR_X - 1, DOOR_X + 1]) for (const y of [1, 2]) g.set(x, y, DOOR_Z, BASE);
for (let x = DOOR_X - 1; x <= DOOR_X + 1; x++) g.set(x, 3, DOOR_Z, BASE);
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(DOOR_X, 1, DOOR_Z, DOOR, door("lower"));
g.set(DOOR_X, 2, DOOR_Z, DOOR, door("upper"));
g.set(DOOR_X, 2, DOOR_Z + 1, LAMP);   // a lamp inside the lobby, behind the door

// roof plant on the main deck (inside the parapet), two blocks high
for (const c of CELLS) {
  if (isWall(c) || D(c) !== 40) continue;
  if (c.x % 8 >= 3 && c.x % 8 <= 4 && c.z % 6 >= 2 && c.z % 6 <= 3) for (const y of [41, 42]) g.set(c.x, y, c.z, PLANT);
}

// warm light behind some panes: a single-face wall cell's inner neighbour, on the storey's window row
for (const c of CELLS) {
  if (!isWall(c)) continue;
  const ex = exposedDirs(c);
  if (ex.length !== 1 || (c.x + c.z) % 3 === 0) continue;
  const [dx, dz] = ex[0], ix = c.x - dx, iz = c.z - dz, inner = cellOf(ix, iz);
  if (!inner || isWall(inner)) continue;
  for (let y = 1; y <= D(c) - 3; y++) {
    const onWindowRow = y % 4 === 1 || y % 4 === 2;
    if (onWindowRow && y > inner.g && y < D(inner) && (c.x + c.z + Math.floor(y / 4)) % 4 === 0) g.set(ix, y, iz, LAMP);
  }
}

// the panes join their neighbours (glass, piers, walls), as a placed pane would: the neighbour's north/south/east/west
const solid = (b) => !!b && !/glowstone/.test(b);
for (const c of CELLS) {
  if (!isWall(c)) continue;
  for (let y = 0; y <= topOf(D(c)); y++) {
    const here = g.get(c.x, y, c.z);
    if (!here || !here.block.endsWith("_stained_glass_pane")) continue;
    const side = (x, z) => solid(g.get(x, y, z)?.block);
    g.set(c.x, y, c.z, GLASS, {
      north: String(side(c.x, c.z - 1)), south: String(side(c.x, c.z + 1)),
      east: String(side(c.x + 1, c.z)), west: String(side(c.x - 1, c.z)), waterlogged: "false",
    });
  }
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162652115.nbt");
console.log(JSON.stringify(out));
