import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw538618834: no record. Read as a 2-storey mid-century Taipei commercial block:
// stone plinth, tiled off-white (smooth quartz) facade with a window grid of glass panes
// and concrete storey lines, a dark-oak shopfront entrance with canopy and lantern,
// flat concrete roof deck with parapet and a small plant box.
// Roof top sits at absolute y = R (11 above lowest ground); each cell stacks storeys
// from its own ground, so downhill cells show extra storeys.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618834";
const W = 21, H = 23, D = 17;
const R = 11;                       // roof / parapet top, absolute y

const FLOOR = "light_gray_concrete";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const WALL = "smooth_quartz";
const GLASS = "light_blue_stained_glass_pane";
const SHROOM = "shroomlight";
const EQUIP = "light_gray_concrete";
const VENT = "iron_block";
const DOOR = "dark_oak_door";
const CANOPY = "dark_oak_slab";
const LANTERN = "lantern";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(`${x},${z}`, gr);
const has = (x, z) => groundOf.has(`${x},${z}`);
const gAt = (x, z) => groundOf.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}
const pane = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Build each footprint cell column
for (const [x, z, gr] of cells) {
  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  if (gr >= R - 1) continue; // nothing above this ground within the roof line

  const exN = !has(x, z - 1), exS = !has(x, z + 1);
  const exW = !has(x - 1, z), exE = !has(x + 1, z);
  const isExt = exN || exS || exW || exE;
  // piers every third cell; windows along the face the cell sits on
  const along = (exN || exS) ? x : z;
  const winOk = along % 3 !== 0;

  for (let y = gr; y <= R - 2; y++) {
    const k = y - gr;
    const kk = k % 5;
    if (k === 0) {
      put(x, y, z, isExt ? BASE : FLOOR);
    } else if (kk === 0) {
      put(x, y, z, FLOOR);                       // storey line / floor slab
    } else if (!isExt) {
      // interior: air gap between floor slabs
    } else if (kk === 4) {
      put(x, y, z, WALL);                        // spandrel below next floor
    } else if (winOk) {
      if (kk === 2 && (x + z + k) % 7 === 0) {
        put(x, y, z, SHROOM);                    // warm light behind glass
      } else {
        put(x, y, z, GLASS, pane);
      }
    } else {
      put(x, y, z, WALL);                        // pier
    }
  }

  // roof deck
  put(x, R - 1, z, FLOOR);
  // parapet on exterior edge
  if (isExt) put(x, R, z, WALL);
}

// Plant box / rooftop plant on the interior deck
for (const [x, z, gr] of cells) {
  if (gr >= R - 2) continue;
  const exterior = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (exterior) continue;
  if (x >= 7 && x <= 9 && z >= 5 && z <= 8) put(x, R, z, EQUIP);
  if (x === 8 && z === 6) put(x, R + 1, z, VENT);
}

// Entrance on the north face (or south if no north exposure)
let doorFace = null;
const northCells = cells.filter(([x, z]) => !has(x, z - 1));
const southCells = cells.filter(([x, z]) => !has(x, z + 1));
if (northCells.length) doorFace = "north";
else if (southCells.length) doorFace = "south";

if (doorFace) {
  const pool = doorFace === "north" ? northCells : southCells;
  const meanX = pool.reduce((s, c) => s + c[0], 0) / pool.length;
  pool.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
  const [dx, dz] = pool[0];
  const gr = gAt(dx, dz);
  const dzOut = doorFace === "north" ? dz : dz;
  const dOpts = { facing: doorFace, hinge: "left", open: "false", powered: "false" };
  if (gr + 2 <= R - 2) {
    put(dx, gr + 1, dz, DOOR, { ...dOpts, half: "lower" });
    put(dx, gr + 2, dz, DOOR, { ...dOpts, half: "upper" });
  }
  // lantern hangs under the canopy
  if (gr + 3 <= R - 2) put(dx, gr + 3, dz, LANTERN, { hanging: "true", waterlogged: "false" });
  // canopy over the entrance bay
  for (let cx = dx - 1; cx <= dx + 1; cx++) {
    if (!has(cx, dzOut)) continue;
    const cg = gAt(cx, dzOut);
    if (cg + 4 <= R - 2) put(cx, cg + 4, dzOut, CANOPY, { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
