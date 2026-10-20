import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-district low-rise commercial block, c. 1980s: two storeys over a shop plinth,
// cream-white concrete frame with light-grey cornice, red/white shop awning, glazed
// shopfront, upper-floor glass panes with warm light, and a rooftop plant penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075546";
const W = 9, H = 20, D = 13;
const ROOF = 8;      // roof/parapet reference height (lidar: ~8 blocks above lowest ground)
const FLOOR = 4;     // upper floor slab level
const MAXG = H - 10; // keep roof and plant well inside the volume

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west",  dx: -1, dz: 0 },
  { n: "east",  dx: 1, dz: 0 },
];

// ---- footprint and ground ----
const ground = new Map();
let rows = null;
try {
  rows = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
} catch {
  rows = null;
}
if (rows) {
  for (const [x, z, gr] of rows) {
    if (x < 0 || z < 0 || x >= W || z >= D) continue;
    ground.set(`${x},${z}`, Math.max(0, Math.min(MAXG, Math.round(gr))));
  }
} else {
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) ground.set(`${x},${z}`, 0);
}

const inFp = (x, z) => ground.has(`${x},${z}`);
const edgeDirsOf = (x, z) => DIRS.filter((d) => !inFp(x + d.dx, z + d.dz));
const isEdge = (x, z) => edgeDirsOf(x, z).length > 0;

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// glass pane connection states: a pane on a north/south face joins east/west neighbours, and vice versa
const paneProps = (dir) => {
  const ns = dir.n === "north" || dir.n === "south";
  return {
    north: ns ? "false" : "true",
    south: ns ? "false" : "true",
    east: ns ? "true" : "false",
    west: ns ? "true" : "false",
    waterlogged: "false",
  };
};

// ---- 1. foundations, slabs, walls ----
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const dirs = edgeDirsOf(x, z);
  const edge = dirs.length > 0;
  const corner = dirs.length >= 2;
  const gg = gr;
  const cap = Math.max(ROOF - 1, gg); // roof slab / cornice level

  // solid foundation up to this cell's ground
  for (let y = 0; y < gg; y++) set(x, y, z, "stone_bricks");
  set(x, gg, z, edge ? "polished_andesite" : "stone_bricks"); // base course / plinth top

  // upper floor slab
  if (FLOOR > gg) set(x, FLOOR, z, "smooth_stone");

  if (!edge) {
    // interior: air behind glass, slabs only
    set(x, cap, z, "light_gray_concrete");
    continue;
  }

  // facade
  for (let y = gg + 1; y < cap; y++) {
    let id = "white_concrete";
    let p;
    if (y <= 2) {
      // shopfront: glass with mullions, solid corner piers
      if (corner) id = "white_concrete";
      else if ((x + z) % 3 === 0) id = "light_gray_concrete";
      else id = "glass";
    } else if (y === 3) {
      // awning band, red and white stripes
      id = (x + z) % 2 ? "red_concrete" : "white_concrete";
    } else if (y === FLOOR) {
      id = "smooth_stone"; // storey line
    } else if (y <= 6) {
      if (!corner && (x + z) % 2 === 0) {
        id = "glass_pane";
        p = paneProps(dirs[0]);
      }
    }
    set(x, y, z, id, p);
  }

  // cornice and parapet
  set(x, cap, z, "light_gray_concrete");
  if (cap + 1 < H) set(x, cap + 1, z, "white_concrete");
}

// ---- 2. warm lights behind upper-floor panes (only where the cell inside is interior) ----
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  const dirs = edgeDirsOf(x, z);
  if (!dirs.length || dirs.length >= 2) continue;
  if ((x + z) % 4 !== 0) continue;
  const d = dirs[0];
  const ix = x - d.dx, iz = z - d.dz;
  if (!inFp(ix, iz) || isEdge(ix, iz)) continue;
  if (5 <= Math.max(ground.get(`${ix},${iz}`), 0)) continue;
  set(ix, 5, iz, "glowstone");
}

// ---- 3. entrance: door on the street (south, +z) frontage nearest the centre ----
{
  let cx = 0, cz = 0, n = 0;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    cx += x; cz += z; n++;
  }
  cx /= n; cz /= n;

  let best = null;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    const dirs = edgeDirsOf(x, z);
    const south = dirs.find((d) => d.n === "south");
    if (!south) continue;
    const score = Math.abs(x - cx);
    if (!best || score < best.score) best = { x, z, d: south, score };
  }
  if (!best) {
    // fallback: any edge cell
    for (const k of ground.keys()) {
      const [x, z] = k.split(",").map(Number);
      const dirs = edgeDirsOf(x, z);
      if (!dirs.length) continue;
      const score = Math.abs(x - cx) + Math.abs(z - cz);
      if (!best || score < best.score) best = { x, z, d: dirs[0], score };
    }
  }
  if (best) {
    const gg = ground.get(`${best.x},${best.z}`);
    const cap = Math.max(ROOF - 1, gg);
    const lower = gg + 1, upper = gg + 2;
    if (upper < cap) {
      const dp = (half) => ({
        facing: best.d.n,
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      set(best.x, lower, best.z, "dark_oak_door", dp("lower"));
      set(best.x, upper, best.z, "dark_oak_door", dp("upper"));
    }
  }
}

// ---- 4. rooftop plant penthouse on the four interior cells nearest the centroid ----
{
  let cx = 0, cz = 0, n = 0;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    cx += x; cz += z; n++;
  }
  cx /= n; cz /= n;

  const interior = [];
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (isEdge(x, z)) continue;
    const gg = ground.get(k);
    if (Math.max(ROOF - 1, gg) !== ROOF - 1) continue; // only on the standard roof level
    interior.push({ x, z, d: Math.hypot(x - cx, z - cz) });
  }
  interior.sort((a, b) => a.d - b.d);
  for (const c of interior.slice(0, 4)) {
    const cap = ROOF - 1;
    set(c.x, cap + 1, c.z, "white_concrete");
    set(c.x, cap + 2, c.z, "white_concrete");
    set(c.x, cap + 3, c.z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
