import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343729.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343729.nbt";

const W = 23, H = 23, D = 36;
const g = new Voxels([W, H, D]);

// Two-storey 1970s-80s concrete shopfront block with a parapet and rooftop plant.
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces of a cell: N = -z, S = +z, W = -x, E = +x
function faces(x, z) {
  return {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
}

// Window bays: every third block along a face, only where the wall continues on both sides.
function isBay(x, z, face) {
  if (face === "N" || face === "S") {
    return x % 3 === 1 && has(x - 1, z) && has(x + 1, z);
  }
  return z % 3 === 1 && has(x, z - 1) && has(x, z + 1);
}

// Entrance: on the north (street) face, near the middle of its run.
const northCells = [];
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z - 1)) northCells.push(x);
}
let entranceX = null;
if (northCells.length) {
  const mid = northCells.reduce((a, b) => a + b, 0) / northCells.length;
  let best = null;
  for (const x of northCells) {
    if (!has(x - 1, 0 + 0) && false) continue;
    if (!best || Math.abs(x - mid) < Math.abs(best - mid)) best = x;
  }
  entranceX = best;
}

// Pass 1: foundation, floor slabs, roof deck, walls.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faces(x, z);
  const edge = f.N || f.S || f.W || f.E;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab, upper floor slab, roof deck.
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "gray_concrete");
  put(x, gr + 10, z, "gray_concrete");

  if (!edge) continue;

  // Primary face for the facade pattern.
  const face = f.N ? "N" : f.S ? "S" : f.W ? "W" : "E";
  const bay = isBay(x, z, face);
  const isEntrance = face === "N" && !f.S && !f.W && !f.E && x === entranceX;

  // Ground storey: base course, shopfront glazing, lintel band.
  put(x, gr + 1, z, "polished_andesite");
  if (!isEntrance) {
    const gl = bay ? "glass_pane" : "light_gray_concrete";
    put(x, gr + 2, z, gl);
    put(x, gr + 3, z, gl);
  }
  put(x, gr + 4, z, "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");

  // Upper storey: windows with concrete mullions, sill and head bands.
  const up = bay ? "glass_pane" : "light_gray_concrete";
  put(x, gr + 6, z, up);
  put(x, gr + 7, z, up);
  put(x, gr + 8, z, up);
  put(x, gr + 9, z, "smooth_stone");

  // Parapet with a stone coping.
  put(x, gr + 10, z, "light_gray_concrete");
  put(x, gr + 11, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
}

// Pass 2: entrance door and canopy-style lintel.
if (entranceX !== null) {
  const gr = gnd(entranceX, 0);
  const dz = 0;
  if (gr !== undefined) {
    put(entranceX, gr + 1, dz, "oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(entranceX, gr + 2, dz, "oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(entranceX, gr + 3, dz, "stone_bricks");
  }
}

// Pass 3: warm lights behind some windows, standing on the floor inside.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faces(x, z);
  if (!(f.N || f.S || f.W || f.E)) continue;
  const face = f.N ? "N" : f.S ? "S" : f.W ? "W" : "E";
  if (!isBay(x, z, face)) continue;
  if ((x * 31 + z * 17) % 4 !== 0) continue;

  // Inward neighbour across the wall.
  let ix = x, iz = z;
  if (face === "N") iz = z + 1;
  else if (face === "S") iz = z - 1;
  else if (face === "W") ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz)) continue;
  const igr = gnd(ix, iz);
  if (igr !== gr) continue;
  const ifaces = faces(ix, iz);
  if (ifaces.N || ifaces.S || ifaces.W || ifaces.E) continue;

  // Ground storey glow stands on the ground slab; upper storey on the upper slab.
  put(ix, gr + 1, iz, "glowstone");
  put(ix, gr + 6, iz, "shroomlight");
}

// Pass 4: rooftop plant on interior roof deck.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faces(x, z);
  if (f.N || f.S || f.W || f.E) continue;
  if (x % 6 === 3 && z % 7 === 3) {
    put(x, gr + 11, z, "iron_block");
  }
}

g.save(OUT);
