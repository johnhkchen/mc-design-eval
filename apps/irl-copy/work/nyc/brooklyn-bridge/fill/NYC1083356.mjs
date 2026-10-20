import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1083356.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1083356.nbt";
const W = 15, H = 26, D = 64;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const fp = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  fp.set(key(x, z), { g: Math.round(gr), r: Math.round(rf) });
}
const has = (x, z) => fp.has(key(x, z));

// One flat, storey-aligned roof for the whole building (median of lidar roofs),
// so the massing reads as a single clean block with a parapet.
const roofs = [...fp.values()].map(v => v.r).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const maxGround = Math.max(...[...fp.values()].map(v => v.g));
const T = Math.min(H - 4, Math.max(2 * Math.round(medRoof / 2), maxGround + 6));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outDirs = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isExterior = (x, z) => outDirs(x, z).length > 0;

// entrance: west-facing exterior cell nearest the middle of the long face
let entrance = null;
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (!outDirs(x, z).some(([dx, dz]) => dx === -1 && dz === 0)) continue;
  if (!entrance || Math.abs(z - 32) < Math.abs(entrance.z - 32)) entrance = { x, z };
}
const isEntranceZone = (x, z) => entrance && x === entrance.x && Math.abs(z - entrance.z) <= 2;

// ---- pass 1: foundations, facade shell, interior slabs, roof deck ----
for (const [k, v] of fp) {
  const [x, z] = k.split(",").map(Number);
  const gr = v.g;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  if (isExterior(x, z)) {
    const [dx, dz] = outDirs(x, z)[0];
    const u = dx !== 0 ? z : x;
    const uMax = dx !== 0 ? D - 1 : W - 1;
    const pier = u % 3 === 0 || u === 0 || u === uMax;
    for (let y = gr; y < T; y++) {
      let id;
      if (y === T - 1) id = "stone_bricks";              // parapet cap
      else if (y < gr + 2) id = "polished_andesite";     // distinct granite base
      else if (y % 2 === 0) id = "stone_bricks";         // storey string course
      else if (pier) id = "brick";                       // brick piers
      else id = "light_blue_stained_glass";              // window
      g.set(x, y, z, id);
    }
  } else {
    for (let y = gr; y < T - 1; y++) {
      if (y % 2 === 0) g.set(x, y, z, "smooth_stone");   // floor slabs
    }
    g.set(x, T - 1, z, "stone");                         // roof deck
  }
}

// ---- pass 2: air gap behind windows, occasional warm light ----
for (const [k, v] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (!isExterior(x, z)) continue;
  const [dx, dz] = outDirs(x, z)[0];
  const ix = x - dx, iz = z - dz;
  const u = dx !== 0 ? z : x;
  const uMax = dx !== 0 ? D - 1 : W - 1;
  const pier = u % 3 === 0 || u === 0 || u === uMax;
  if (pier) continue;
  if (!has(ix, iz) || isExterior(ix, iz)) continue;
  for (let y = v.g + 2; y < T - 1; y++) {
    if (y % 2 === 0) continue;
    const h = (x * 31 + y * 17 + z * 7) % 11;
    if (h === 0) g.set(ix, y, iz, "glowstone");
    else if (h === 4) g.set(ix, y, iz, "shroomlight");
  }
}

// ---- pass 3: entrance: stone surround, pilasters, double-height door, lantern ----
if (entrance) {
  const { x, z } = entrance;
  const gr = fp.get(key(x, z)).g;
  // stone pilasters flanking the doorway on the facade
  for (const dz of [-2, 2]) {
    const pz = entrance.z + dz;
    if (!has(x, pz)) continue;
    for (let y = gr; y < gr + 4; y++) g.set(x, y, pz, "polished_andesite");
  }
  // door opening (two blocks high) on the middle cell
  const props = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
  g.set(x, gr, z, "dark_oak_door", props("lower"));
  g.set(x, gr + 1, z, "dark_oak_door", props("upper"));
  // stone lintel over the door
  g.set(x, gr + 2, z, "stone_bricks");
  // warm light just inside the vestibule
  if (has(x + 1, z)) g.set(x + 1, gr + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// ---- pass 4: elevator bulkhead with glazed slits ----
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (isExterior(x, z)) continue;
  if (x < 4 || x > 10 || z < 18 || z > 46) continue;
  const edge = x === 4 || x === 10 || z === 18 || z === 46;
  for (let y = T; y <= T + 1; y++) {
    if (edge) g.set(x, y, z, "brick");
  }
  if (edge && (x === 4 || x === 10) && z % 4 === 0) {
    g.set(x, T, z, "light_blue_stained_glass");
  }
  g.set(x, T + 2, z, "stone_bricks");
}

g.save(OUT);
