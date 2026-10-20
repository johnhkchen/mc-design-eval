import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1153980199";
const W = 17, H = 43, D = 25;

// Footprint: [x, z, ground] per cell.
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    ground.set(key(x, z), Math.max(0, Math.min(H - 14, Math.round(g))));
  }
}
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

// Edge = footprint cell with a missing 4-neighbour (exterior wall).
const isEdge = (x, z) => has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));
const isCorner = (x, z) => (!has(x - 1, z) && !has(x, z - 1)) || (!has(x + 1, z) && !has(x, z - 1)) ||
                           (!has(x - 1, z) && !has(x, z + 1)) || (!has(x + 1, z) && !has(x, z + 1));

// Inward direction for an edge cell (toward the building interior).
function inward(x, z) {
  if (!has(x, z - 1)) return [0, 1];
  if (!has(x, z + 1)) return [0, -1];
  if (!has(x - 1, z)) return [1, 0];
  if (!has(x + 1, z)) return [-1, 0];
  return null;
}

// Facade pier: corners and every third cell along the wall.
function isPier(x, z) {
  if (isCorner(x, z)) return true;
  const northOrSouth = !has(x, z - 1) || !has(x, z + 1);
  const along = northOrSouth ? x : z;
  return along % 3 === 0;
}

// Front entrance: north face (z minimum), nearest cell to the centre x.
const northCells = cells
  .filter(([x, z]) => has(x, z) && !has(x, z - 1))
  .map(([x, z]) => x)
  .sort((a, b) => Math.abs(a - 8) - Math.abs(b - 8));
const doorX = northCells.length ? northCells[0] : 8;
const doorZ = cells.find(([x, z]) => x === doorX && has(x, z))?.[1] ?? 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const ROOF = 30;   // roof cap level (top of storey 6)
const PARAPET = 31;

const deferred = []; // door blocks written last

for (const [x, z, gr] of cells) {
  if (!has(x, z)) continue;
  const edge = isEdge(x, z);
  const pier = edge && isPier(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone");

  // Storeys: floor line every 5 blocks, roof cap at 30, parapet at 31.
  for (let y = gr + 1; y <= ROOF; y++) {
    const r = y % 5;
    if (y === ROOF) {
      put(x, y, z, "stone_bricks");
      continue;
    }
    if (r === 0) {
      put(x, y, z, "light_gray_concrete"); // floor slab, all footprint cells
      continue;
    }
    if (!edge) continue; // interior air, no interiors
    if (r === 4) {
      put(x, y, z, "white_concrete"); // spandrel
      continue;
    }
    if (y < 5) {
      // Ground storey: base course and shopfront.
      if (r === 1) { put(x, y, z, "polished_granite"); continue; }
      put(x, y, z, pier ? "white_concrete" : "cyan_stained_glass");
    } else {
      put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
    }
  }

  // Parapet on the exterior edge.
  if (edge && PARAPET > gr) put(x, PARAPET, z, "stone_bricks");
}

// Warm light behind some window glass (interior cell, kept as air otherwise).
for (const [x, z, gr] of cells) {
  if (!has(x, z) || !isEdge(x, z) || isPier(x, z)) continue;
  const inw = inward(x, z);
  if (!inw) continue;
  const ix = x + inw[0], iz = z + inw[1];
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  for (let y = gr + 1; y < ROOF; y++) {
    const r = y % 5;
    if (r === 0 || r === 4) continue;
    if (y <= gnd(ix, iz)) continue;
    if ((x * 7 + y * 3 + z) % 11 === 0) put(ix, y, iz, "glowstone");
  }
}

// Entrance: double-height door on the front, lower and upper halves.
deferred.push([doorX, 1, doorZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }]);
deferred.push([doorX, 2, doorZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }]);

// Rooftop plant room: solid box with louvres on north and south faces.
for (let x = 5; x <= 11; x++) {
  for (let z = 8; z <= 16; z++) {
    if (!has(x, z)) continue;
    for (let y = PARAPET; y <= 33; y++) {
      const louvre = (z === 8 || z === 16) && x % 2 === 0 && (y === 32 || y === 33) && x > 5 && x < 11;
      put(x, y, z, louvre ? "iron_bars" : "light_gray_concrete");
    }
    put(x, 34, z, "stone_bricks");
  }
}

for (const [x, y, z, block, props] of deferred) put(x, y, z, block, props);

g.save(`${dir}/${id}.nbt`);
