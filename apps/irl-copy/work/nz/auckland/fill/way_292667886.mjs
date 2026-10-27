// Shine Building, Auckland (way 292667886): a 1980s concrete-frame office tower, about 16 storeys (64 blocks, roughly
// 53 m) on a basalt plinth. The lidar roof is taken as a median of each 3x3 neighbourhood, then snapped to one flat tier:
// 64 for the tower roof (58-69), 72 for a lift core and plant (70 and up), and the nearest 4-block storey below that
// (the lower wings). Every tier is at least two storeys above its own ground. Each column is solid from y 0 to its
// ground, then the storeys stack on the same column, so nothing floats. The facade is a 4-block storey rhythm: a
// cream spandrel band at each floor line, light-grey concrete piers on a 3-block bay, a grey andesite head course,
// blue-tinted glass panes between. The ground storey is a shopfront of full glass, and the entrance (on the longest
// street-facing face) is a dark-oak door under a lintel. A parapet caps the roof edge, and a plant room stands on the
// tower roof. Interiors are air with a floor slab per storey; glowstone sits on the slab behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292667886.cells.json", "utf8"));
const W = 42, D = 25, HMAX = 85;
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), R = grid(0), T = grid(0);       // ground, lidar roof, flat roof top (y of the top surface)
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const along = (x, z, dx) => (dx ? z : x);       // the coordinate that runs along a face

const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z), g = G[x][z];
  const tier = r >= 70 ? 72 : r >= 58 ? 64 : 4 * Math.round(r / 4);
  T[x][z] = Math.max(tier, 4 * Math.ceil((g + 8) / 4));
}

// the air-facing sides of a cell at height y: outside the footprint, or the neighbour's top is at or below y
const exposures = (x, z, y) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || y >= T[x + dx][z + dz]);
const roofEdge = (x, z) => DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || T[x + dx][z + dz] < T[x][z]);

// the plant room: a 3 x 3 box on the tower roof (top 64), far from the core and the edges
const isTower = (x, z) => inside(x, z) && T[x][z] === 64;
const far = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!isTower(x, z)) continue;
  let ok = true;
  for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) if (!isTower(x + dx, z + dz)) ok = false;
  if (ok) far.push([x, z]);
}
const cx = far.reduce((s, c) => s + c[0], 0) / far.length, cz = far.reduce((s, c) => s + c[1], 0) / far.length;
const plant = new Set();
if (far.length) {
  const [px, pz] = far.reduce((best, c) => ((c[0] - cx) ** 2 + (c[1] - cz) ** 2 < (best[0] - cx) ** 2 + (best[1] - cz) ** 2 ? c : best));
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (isTower(px + dx, pz + dz)) plant.add((px + dx) * D + pz + dz);
}

// the entrance: the middle of the longest street-facing run at the first storey, on the face the lidar shows most
const faces = DIRS.map(([dx, dz, name]) => ({ dx, name, cells: [] }));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && G[x][z] + 1 < T[x][z]) {
  for (const e of exposures(x, z, G[x][z] + 1)) faces.find((f) => f.name === e[2]).cells.push([x, z]);
}
const face = faces.reduce((a, b) => (b.cells.length > a.cells.length ? b : a));
face.cells.sort((a, b) => along(a[0], a[1], face.dx) - along(b[0], b[1], face.dx));
const [ex0, ez0] = face.cells[face.cells.length >> 1];
const entrance = { x: ex0, z: ez0, dir: face.name };

function facadeName(x, z, y, ex) {
  const g = G[x][z];
  if (x === entrance.x && z === entrance.z && (y === g + 1 || y === g + 2)) return "dark_oak_door";
  if (y % 4 === 0) return "smooth_quartz";                          // the spandrel band at each floor line
  if (y % 4 === 3) return "polished_andesite";                      // head course over each window row
  const pier = ex.length > 1 || along(x, z, ex[0][0]) % 4 === 0;   // corners and every fourth cell are piers (3-wide glass bays)
  if (pier) return "light_gray_concrete";
  return y < 8 ? "light_blue_stained_glass" : "light_blue_stained_glass_pane";
}

// a warm light on the slab just inside a glass pane (about one in four of them), never in a corridor of its own
function lightBehind(x, z, y) {
  if (((x * 7 + z * 11 + y * 3) % 4) !== 0) return false;
  return DIRS.some(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz) || !exposures(nx, nz, y).length) return false;
    const n = nameAt(nx, nz, y);
    return n !== null && n.includes("glass");
  });
}

function nameAt(x, z, y) {
  if (!inside(x, z)) return null;
  const g = G[x][z], t = T[x][z];
  if (plant.has(x * D + z) && y >= t && y < t + 2) return "light_gray_concrete";
  if (y < g) return "polished_basalt";                               // the foundation, from y 0 to the ground
  if (y >= t) return y === t && roofEdge(x, z) ? "polished_andesite_slab" : null;
  const ex = exposures(x, z, y);
  if (y === g) return ex.length ? "polished_basalt" : "smooth_stone"; // the plinth course and the floor slab
  if (ex.length) return facadeName(x, z, y, ex);
  if (y % 4 === 0 || y === t - 1) return "smooth_stone";             // interior floor slabs and the roof slab
  if (y % 4 === 1 && lightBehind(x, z, y)) return "glowstone";
  return null;
}

const out = new Voxels([W, HMAX, D]);
const counts = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < HMAX; y++) {
  const name = nameAt(x, z, y);
  if (!name) continue;
  let state;
  if (name === "dark_oak_door") {
    state = { facing: entrance.dir, half: y === G[x][z] + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
  } else if (name === "light_blue_stained_glass_pane") {
    const [dx] = exposures(x, z, y)[0];
    const conn = (ax, az) => nameAt(x + ax, z + az, y) !== null;
    state = dx
      ? { north: String(conn(0, -1)), south: String(conn(0, 1)), east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: String(conn(1, 0)), west: String(conn(-1, 0)), waterlogged: "false" };
  } else if (name === "polished_andesite_slab") {
    state = { type: "bottom", waterlogged: "false" };
  }
  out.set(x, y, z, name, state);
  counts[name] = (counts[name] || 0) + 1;
}

const res = out.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292667886.nbt");
const tiers = {};
for (const row of T) for (const t of row) if (t) tiers[t] = (tiers[t] || 0) + 1;
console.log("cells", cells.length, "tiers", JSON.stringify(tiers), "plant", plant.size, "entrance", JSON.stringify(entrance));
console.log("blocks", res.blocks, "palette", res.palette, JSON.stringify(counts));
