import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw832858016";
const W = 19, H = 23, D = 22;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground level (integer, >= 0)
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));
const gr = (x, z) => ground.get(key(x, z));

const FACES = [
  { n: "north", dx: 0, dz: -1, along: "x" },
  { n: "south", dx: 0, dz: 1, along: "x" },
  { n: "west", dx: -1, dz: 0, along: "z" },
  { n: "east", dx: 1, dz: 0, along: "z" },
];
const OPP = { north: "south", south: "north", east: "west", west: "east" };

// Exterior faces of a footprint cell (faces whose neighbour is outside the footprint)
const facesOf = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));

const edgeSet = new Set();
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (facesOf(x, z).length > 0) edgeSet.add(k);
}
const isEdge = (x, z) => edgeSet.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// ---- Choose the entrance: middle window-position cell on the face with the most cells ----
const faceCells = {};
for (const k of edgeSet) {
  const [x, z] = k.split(",").map(Number);
  const fs = facesOf(x, z);
  if (fs.length !== 1) continue;
  const f = fs[0];
  const t = f.along === "x" ? x : z;
  if (t % 3 === 0) continue;
  (faceCells[f.n] ??= []).push({ x, z, t, f });
}
let door = null;
{
  let bestFace = null;
  for (const n of Object.keys(faceCells)) {
    if (!bestFace || faceCells[n].length > faceCells[bestFace].length) bestFace = n;
  }
  if (bestFace) {
    const arr = faceCells[bestFace].slice().sort((a, b) => a.t - b.t);
    const mid = arr[Math.floor(arr.length / 2)].t;
    door = arr.reduce((a, b) => (Math.abs(b.t - mid) < Math.abs(a.t - mid) ? b : a));
  }
}

// ---- Build each footprint column ----
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const G = gr(x, z);

  // Foundation below the cell's ground, then ground-floor slab at G
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
  put(x, G, z, "smooth_stone");

  const fs = facesOf(x, z);

  // Interior cells: roof slab at G+10, storey line slab at G+5 (air gap above)
  if (fs.length === 0) {
    put(x, G + 5, z, "smooth_stone");
    put(x, G + 10, z, "gray_concrete");
    continue;
  }

  // Edge cells: full wall column G+1..G+11, then articulate
  for (let y = G + 1; y <= G + 11; y++) put(x, y, z, "white_concrete");

  const f0 = fs[0];
  const t = f0.along === "x" ? x : z;
  const isPillar = fs.length > 1 || t % 3 === 0;
  const isDoor = door && door.x === x && door.z === z;

  // Base course
  put(x, G + 1, z, "stone_bricks");

  // Ground storey: shopfront or entrance
  if (isDoor) {
    const facing = OPP[door.f.n];
    put(x, G + 1, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, G + 2, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, G + 3, z, "glass_pane");
    put(x, G + 4, z, "smooth_quartz");
  } else {
    put(x, G + 2, z, isPillar ? "smooth_quartz" : "glass_pane");
    put(x, G + 3, z, isPillar ? "smooth_quartz" : "glass_pane");
    put(x, G + 4, z, "smooth_quartz");
  }

  // Storey line
  put(x, G + 5, z, "smooth_quartz");

  // Upper storey: sill, glazing, lintel
  if (isPillar) {
    put(x, G + 6, z, "smooth_quartz");
    put(x, G + 7, z, "smooth_quartz");
    put(x, G + 8, z, "smooth_quartz");
  } else {
    put(x, G + 6, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    put(x, G + 7, z, "glass_pane");
    put(x, G + 8, z, "glass_pane");
  }
  put(x, G + 9, z, "smooth_quartz");

  // Cornice and parapet
  put(x, G + 10, z, "smooth_quartz");
  put(x, G + 11, z, "white_concrete");

  // Warm light behind some upper-storey glass, in the air gap one cell inside
  if (!isPillar && (x + z) % 2 === 0) {
    const ix = x - f0.dx, iz = z - f0.dz;
    if (has(ix, iz) && !isEdge(ix, iz)) {
      put(ix, G + 7, iz, "glowstone");
    }
  }
}

// ---- Roof plant: small box on the roof near the middle, on a fully interior 3x3 ----
{
  let cx = 0, cz = 0, n = 0;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    cx += x; cz += z; n++;
  }
  cx /= n; cz /= n;

  let best = null, bestD = Infinity;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (isEdge(x, z)) continue;
    const G = gr(x, z);
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++)
      for (let dz = -1; dz <= 1 && ok; dz++) {
        const nx = x + dx, nz = z + dz;
        if (!has(nx, nz) || isEdge(nx, nz) || gr(nx, nz) !== G) ok = false;
      }
    if (!ok) continue;
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (d < bestD) { bestD = d; best = { x, z, G }; }
  }

  if (best) {
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        put(best.x + dx, best.G + 11, best.z + dz, "light_gray_concrete");
        put(best.x + dx, best.G + 12, best.z + dz, "light_gray_concrete");
        put(best.x + dx, best.G + 13, best.z + dz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      }
  }
}

g.save(`${DIR}/${ID}.nbt`);
