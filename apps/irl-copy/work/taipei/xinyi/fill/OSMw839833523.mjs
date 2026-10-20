import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw839833523";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 17, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// outward directions for each exposed face
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// faces of a cell that border open air (perimeter faces)
function exposedFaces(x, z) {
  return Object.keys(DIRS).filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));
}

// position of a cell along its exposed face (for bay rhythm)
function along(f, x, z) {
  return (f === "N" || f === "S") ? x : z;
}

// Floor-by-floor recipe for facade cells, r = height above the cell's ground
function facadeBlock(r, pier) {
  if (r === 1) return pier ? ["stone_bricks"] : ["light_blue_stained_glass"];
  if (r === 2 || r === 3) return pier ? ["white_concrete"] : ["light_blue_stained_glass"];
  if (r === 4 || r === 5 || r === 6) return ["light_gray_concrete"];
  if (r === 7 || r === 8) return pier ? ["white_concrete"] : ["light_blue_stained_glass"];
  if (r === 9) return ["white_concrete"];
  if (r === 10) return ["stone_bricks"];
  if (r === 11) return ["smooth_stone_slab", { type: "bottom" }];
  return null;
}

const perimeter = new Map(); // key -> faces list
const lights = [];
const entranceCandidates = [];

// Pass 1: foundations, floor slabs, facades, roof slab
for (const [x, z, gr] of cells) {
  const key = `${x},${z}`;
  const faces = exposedFaces(x, z);
  const isPerim = faces.length > 0;
  if (isPerim) perimeter.set(key, faces);

  // foundation solid from y 0 up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // ground slab / base course
  put(x, gr, z, isPerim ? "stone_bricks" : "smooth_stone");

  if (!isPerim) {
    // interior: only floor slabs at storey lines and roof slab, air between
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    continue;
  }

  const corner = faces.length > 1;
  const pier = corner || faces.some(f => along(f, x, z) % 3 === 0);

  for (let r = 1; r <= 11; r++) {
    const spec = facadeBlock(r, pier);
    if (!spec) continue;
    if (spec[1]) put(x, gr + r, z, spec[0], spec[1]);
    else put(x, gr + r, z, spec[0]);
  }

  // candidate entrance cells on the south face
  if (faces.includes("S")) entranceCandidates.push([x, z, gr]);
}

// Pass 2: entrance door on the south face nearest the middle
if (entranceCandidates.length) {
  const xs = entranceCandidates.map(c => c[0]);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  const [ex, ez, egr] = entranceCandidates.reduce((best, c) =>
    Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best);

  put(ex, egr + 1, ez, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, egr + 2, ez, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, egr + 3, ez, "white_concrete");
  // canopy-style lantern beside the door on the ground storey wall
  const lx = ex + 1 < W && perimeter.has(`${ex + 1},${ez}`) ? ex + 1 : ex - 1;
  put(lx, egr + 3, ez, "lantern", { hanging: "true" });
}

// Pass 3: warm lights set back behind selected windows (interior cells only)
for (const [key, faces] of perimeter) {
  const [x, z] = key.split(",").map(Number);
  const gr = ground.get(key);
  for (const f of faces) {
    const a = along(f, x, z);
    if (a % 3 === 0 || faces.length > 1) continue; // piers and corners
    if (a % 6 !== 1) continue;
    const ix = x - DIRS[f][0];
    const iz = z - DIRS[f][1];
    if (!has(ix, iz) || perimeter.has(`${ix},${iz}`)) continue;
    lights.push([ix, gr + 2, iz, "glowstone"]);
    lights.push([ix, gr + 7, iz, "shroomlight"]);
  }
}
for (const [x, y, z, b] of lights) put(x, y, z, b);

// Pass 4: roof plant box in the middle of the roof
for (const [x, z, gr] of cells) {
  if (perimeter.has(`${x},${z}`)) continue;
  if (x >= 6 && x <= 8 && z >= 4 && z <= 7) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "smooth_stone_slab", { type: "bottom" });
  }
}

g.save(`${dir}/${id}.nbt`);
