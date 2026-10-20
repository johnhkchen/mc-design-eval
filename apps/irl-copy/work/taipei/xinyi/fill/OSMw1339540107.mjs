import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw1339540107: a single-storey 1980s Xinyi-style commercial block (white-tile
// and concrete parapet, stone plinth, glazed shopfront on the street face).
// Roof is 7 blocks above lowest ground: storey 0..4, cornice 5, parapet 6.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339540107.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339540107.nbt";

const W = 23, H = 19, D = 14;
const ROOF_TOP = 6;      // highest parapet block; roof line at 7 blocks
const STOREY_TOP = 4;    // spandrel band; storey is 0..4
const CORNICE = 5;
const FRONT_DOOR_X = 11; // door sought on the street (north, z=0) face

const g = new Voxels([W, H, D]);
const raw = JSON.parse(readFileSync(CELLS, "utf8"));

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gy] of raw) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    ground.set(key(x, z), Math.min(Math.max(gy, 0), STOREY_TOP));
  }
}
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

const isPerim = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: foundation, floor slabs, walls, roof deck.
const cellsList = [...ground.keys()].map((k) => k.split(",").map(Number));

for (const [x, z] of cellsList) {
  const gr = gOf(x, z);

  // Foundation from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const mN = !has(x, z - 1);
  const mS = !has(x, z + 1);
  const mW = !has(x - 1, z);
  const mE = !has(x + 1, z);
  const perim = mN || mS || mW || mE;
  const corner = (mN || mS) && (mW || mE);

  if (!perim) {
    // Interior: floor slab, air above, roof deck at the cornice line.
    set(x, gr, z, "smooth_stone");
    set(x, CORNICE, z, "light_gray_concrete");
    continue;
  }

  // Perimeter wall.
  set(x, gr, z, "stone_bricks"); // plinth / base course
  const along = mN || mS ? x : z;

  for (let y = gr + 1; y <= 3; y++) {
    const pier = corner || along % 3 === 0;
    set(x, y, z, pier ? "white_concrete" : "glass_pane");
  }

  if (gr < STOREY_TOP) set(x, STOREY_TOP, z, "white_concrete"); // spandrel / lintel band
  set(x, CORNICE, z, "stone_bricks");                           // cornice course
  set(x, ROOF_TOP, z, "light_gray_concrete");                   // parapet cap
}

// Pass 2: rooftop plant on the back (south) half of the roof, interior cells only.
for (const [x, z] of cellsList) {
  if (isPerim(x, z)) continue;
  if (x >= 15 && x <= 18 && z >= 4 && z <= 8) {
    set(x, ROOF_TOP, z, "iron_block");
  }
}

// Pass 3: warm lights in the air gap behind the front and back glazing.
for (const [x, z] of cellsList) {
  if (isPerim(x, z)) continue;
  const gr = gOf(x, z);
  if (x % 5 !== 2) continue;
  if (!(isPerim(x, z - 1) || isPerim(x, z + 1))) continue;
  if (2 <= gr || 2 > STOREY_TOP) continue;
  set(x, 2, z, "glowstone");
}

// Pass 4: street entrance on the north face, nearest to the chosen x.
let doorX = null;
let bestDist = Infinity;
for (const [x, z] of cellsList) {
  if (z !== 0 && has(x, z - 1)) continue;
  if (has(x, z - 1)) continue;
  const d = Math.abs(x - FRONT_DOOR_X);
  if (d < bestDist) { bestDist = d; doorX = x; }
}
if (doorX !== null) {
  const gr = gOf(doorX, 0);
  const lowerY = gr + 1;
  const upperY = gr + 2;
  set(doorX, lowerY, 0, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(doorX, upperY, 0, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lintel over the door and a warm lantern just inside.
  set(doorX, upperY + 1, 0, "stone_bricks");
  if (has(doorX, 1)) set(doorX, lowerY, 1, "lantern", { hanging: "false" });
}

g.save(OUT);
