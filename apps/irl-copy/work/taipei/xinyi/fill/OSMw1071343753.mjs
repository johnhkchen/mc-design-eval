import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw1071343753: no record, so a 1980s-90s Xinyi commercial block.
// Two storeys of 5 blocks each, a stone base, white tiled spandrels, blue-tinted
// glazing in a 3-block bay rhythm, a recessed north entrance, and a parapet that
// tops out about 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343753";
const W = 34, H = 23, D = 28;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Outward normals for a footprint cell (faces with no neighbour).
function normalsOf(x, z) {
  const n = [];
  if (!has(x, z - 1)) n.push([0, -1]);
  if (!has(x, z + 1)) n.push([0, 1]);
  if (!has(x - 1, z)) n.push([-1, 0]);
  if (!has(x + 1, z)) n.push([1, 0]);
  return n;
}

// Pick a single north-facing entrance near the middle of the north face.
const northXs = [];
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  if (!has(x, z - 1)) northXs.push(x);
}
northXs.sort((a, b) => a - b);
const entranceX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -1;
const entranceZ = northXs.length ? [...ground.keys()]
  .map(k => k.split(",").map(Number))
  .find(([x, z]) => x === entranceX && !has(x, z - 1))?.[1] ?? -1 : -1;

const WALL = "white_concrete";
const BASE = "stone_bricks";
const GLASS = "light_blue_stained_glass";
const BAND = "white_concrete";
const PARAPET = "smooth_stone";

// Per-cell body: foundation, storeys, floors, roof.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  const ns = normalsOf(x, z);
  const ring = ns.length > 0;

  if (!ring) {
    // Interior: floor slabs per storey and a roof deck; otherwise air.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "gray_concrete");
    continue;
  }

  const corner = ns.length >= 2;
  // Position along the face: x for north/south faces, z for east/west faces.
  const p = (ns[0][0] === 0) ? x : z;
  const isEntrance = (x === entranceX && z === entranceZ);

  for (let row = 0; row <= 10; row++) {
    const y = gr + row;
    let block = WALL;
    let props;

    if (row === 0) block = BASE;
    else if (row === 4 || row === 5 || row === 9) block = BAND;
    else if (row === 10) block = PARAPET;
    else if (row === 1 || row === 2 || row === 3 || row === 6 || row === 7 || row === 8) {
      if (corner || p % 3 === 0) block = WALL;
      else block = GLASS;
    }

    if (isEntrance && (row === 1 || row === 2)) {
      block = "iron_door";
      props = {
        facing: "south",
        half: row === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    }
    if (isEntrance && row === 3) block = WALL; // lintel over the door

    put(x, y, z, block, props);
  }

  // Roof-level: the parapet already closes the ring; roof deck sits inside it.
  // (Interior roof deck handled by the non-ring branch.)
}

// Warm lights behind some upper and ground-floor glazing (interior cell behind glass).
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const ns = normalsOf(x, z);
  if (ns.length !== 1) continue;
  const [nx, nz] = ns[0];
  const p = (nx === 0) ? x : z;
  if (p % 6 !== 1) continue;
  const ix = x - nx, iz = z - nz;
  if (!has(ix, iz) || normalsOf(ix, iz).length > 0) continue;
  for (const row of [2, 7]) {
    if (x === entranceX && z === entranceZ) continue;
    put(ix, gr + row, iz, "glowstone");
  }
}

// Rooftop plant: 2x2 plant boxes on the roof deck, each one sitting on its own roof.
const plantSpots = [[8, 8], [24, 18], [14, 20]];
for (const [sx, sz] of plantSpots) {
  const cs = [[sx, sz], [sx + 1, sz], [sx, sz + 1], [sx + 1, sz + 1]];
  if (!cs.every(([x, z]) => has(x, z) && normalsOf(x, z).length === 0)) continue;
  for (const [x, z] of cs) {
    const gr = groundAt(x, z);
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
