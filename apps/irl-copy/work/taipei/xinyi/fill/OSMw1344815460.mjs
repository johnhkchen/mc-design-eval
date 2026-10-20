import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "OSMw1344815460";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 19, D = 6;
const TOP = 7;        // roof slab level (about 7 blocks above lowest ground)
const PARAPET = 8;    // low parapet on the roof edge
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", E: "W", W: "E" };
const hasCell = (x, z) => ground.has(key(x, z));
const exts = (x, z) => Object.keys(DIRS).filter(d => !hasCell(x + DIRS[d][0], z + DIRS[d][1]));

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Choose the door: the north-facing perimeter cell nearest x = 2
let doorCell = null;
for (const [x, z, gr] of cells) {
  if (!exts(x, z).includes("N")) continue;
  if (gr + 2 > 6) continue;
  if (!doorCell || Math.abs(x - 2) < Math.abs(doorCell[0] - 2)) doorCell = [x, z, gr];
}
const isDoor = (x, z) => doorCell && doorCell[0] === x && doorCell[1] === z;

// Pass 1: foundation, base course, floors, walls, corners, windows
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // base course / ground floor slab at the ground level
  const ex = exts(x, z);
  put(x, gr, z, ex.length ? "stone_bricks" : "smooth_stone");

  if (gr + 1 > 6) continue; // no room for walls above this ground

  // walls, roof slab, parapet
  for (let y = gr + 1; y <= 6; y++) {
    if (ex.length === 0) continue; // interior air
    if (ex.length >= 2) {
      put(x, y, z, "quartz_pillar", { axis: "y" }); // corner pillar
    } else {
      put(x, y, z, "smooth_quartz");
    }
  }

  // roof slab over the whole footprint
  put(x, TOP, z, "smooth_quartz");

  // cornice band on the perimeter
  if (ex.length) put(x, TOP, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // parapet on the perimeter
  if (ex.length) put(x, PARAPET, z, "stone_brick_wall");
}

// Pass 2: windows, door, interior lights
const shroomCells = [];
for (const [x, z, gr] of cells) {
  const ex = exts(x, z);
  if (ex.length !== 1) continue;
  if (gr + 1 > 6) continue;
  if (isDoor(x, z)) continue;

  const side = ex[0];
  const horizontal = side === "N" || side === "S";
  const pane = (y) => put(x, y, z, "glass_pane", {
    north: horizontal ? "false" : "true",
    south: horizontal ? "false" : "true",
    east: horizontal ? "true" : "false",
    west: horizontal ? "true" : "false",
    waterlogged: "false",
  });

  // window band on the second and third storey course above ground
  for (const y of [gr + 2, gr + 3]) {
    if (y <= 6) pane(y);
  }

  // warm light behind some windows, in the interior cell beside the glass
  if ((x + z) % 2 === 0 && gr + 2 <= 6) {
    const nx = x - DIRS[side][0];
    const nz = z - DIRS[side][1];
    if (hasCell(nx, nz) && exts(nx, nz).length === 0) shroomCells.push([nx, gr + 2, nz]);
  }
}

for (const [x, y, z] of shroomCells) put(x, y, z, "shroomlight");

// Door with a frame, on the north face, with a lower and upper half
if (doorCell) {
  const [dx, dz, dg] = doorCell;
  const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(dx, dg + 1, dz, "oak_door", { ...base, half: "lower" });
  put(dx, dg + 2, dz, "oak_door", { ...base, half: "upper" });
  // stone door surround above the opening
  if (dg + 3 <= 6) put(dx, dg + 3, dz, "stone_bricks");
}

// Roof equipment: a rooftop AC unit on an interior roof cell, with a lantern
let plant = null;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (exts(x, z).length === 0) { plant = [x, z]; break; }
}
if (!plant) plant = [2, 3];
put(plant[0], PARAPET - 1, plant[1], "iron_block");
put(plant[0], PARAPET, plant[1], "lantern", { hanging: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
