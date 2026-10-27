// Way 437261898: a 1920s-30s brick commercial block on a city fringe street (Stripped Classical, cream string courses,
// shopfront at street level). Four storeys on the north side stepping down through two storeys to a single-storey shop
// wing on the south (street) face. Lidar heights are smoothed into three flat tiers: 5, 8 and 16 blocks, the 16 with a parapet at 16.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_437261898.cells.json`, "utf8"));
const OUT = `${DIR}/way_437261898.nbt`;
const SIZE = [12, 29, 6];

// roof heights (blocks above y 0) smoothed into flat tiers; lidar noise (0 at x4 z5, 7, 15) snaps to its tier
const tier = (r) => (r >= 15 ? 16 : r >= 7 ? 8 : 5);
const TOP = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, tier(r)]));
const H = (x, z) => TOP.get(`${x},${z}`) ?? 0; // outside the footprint: 0
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const ALONG = { N: [1, 0], S: [1, 0], W: [0, 1], E: [0, 1] };

// a face is exposed when the cell beside it is outside the footprint or no higher than this row
const exposed = (x, z, y, d) => {
  if (y >= H(x, z)) return false;
  const [dx, dz] = DIRS[d];
  return H(x + dx, z + dz) <= y;
};
const exposures = (x, z, y) => Object.keys(DIRS).filter((d) => exposed(x, z, y, d));
const perpendicular = (ex) => ex.some((d) => d === "N" || d === "S") && ex.some((d) => d === "W" || d === "E");

// along its facade a window sits between piers: two windows, a pier, two windows, between the end piers
function windowAt(x, z, y, d) {
  const [ax, az] = ALONG[d];
  let s = 0;
  while (exposed(x - (s + 1) * ax, z - (s + 1) * az, y, d)) s++;
  let e = 0;
  while (exposed(x + (e + 1) * ax, z + (e + 1) * az, y, d)) e++;
  return s > 0 && e > 0 && (s - 1) % 3 !== 2;
}

// the plan: "x,y,z" -> { x, y, z, block, state?, d?, glass? }; anything absent is air
const plan = new Map();
const at = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, extra = {}) => plan.set(at(x, y, z), { x, y, z, block, ...extra });
const solidAt = (x, y, z) => plan.has(at(x, y, z));

// 1. the massing: floor slabs every 4 rows, a cornice on each tier's roof, facades of piers and window bands
for (const [key, h] of TOP) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < h; y++) {
    const ex = exposures(x, z, y);
    const row = y % 4;
    if (y === h - 1) { put(x, y, z, ex.length ? "smooth_stone" : "stone_bricks"); continue; }
    if (row === 0) { put(x, y, z, ex.length ? (y === 0 ? "stone_bricks" : "smooth_quartz") : "stone_bricks"); continue; }
    if (!ex.length) continue; // interior air between the floor slabs
    if (perpendicular(ex)) { put(x, y, z, "bricks"); continue; } // corner pier
    const d = ex.find((f) => windowAt(x, z, y, f));
    if (d) put(x, y, z, row === 3 ? "smooth_quartz" : "glass_pane", { d, glass: row !== 3 }); // lintel or glass
    else put(x, y, z, "bricks");
  }
}

// 2. the street face: a shopfront of glass across the single-storey wing, with a timber door and a dark canopy
for (let x = 5; x <= 10; x++) {
  if (H(x, 5) !== 5) continue;
  for (const y of [1, 2]) {
    if (x === 9) {
      const st = { facing: "south", hinge: "left", open: "false", powered: "false" };
      put(x, y, 5, "dark_oak_door", { state: { ...st, half: y === 1 ? "lower" : "upper" } });
    } else put(x, y, 5, "glass_pane", { d: "S", glass: true });
  }
}
for (const x of [8, 9, 10]) put(x, 3, 5, "dark_oak_slab", { state: { type: "bottom", waterlogged: "false" } });

// 3. a window needs air behind it: a pier directly inside a window is carved to a recess; a glass or door is not
for (const p of [...plan.values()]) {
  if (!p.glass) continue;
  const [dx, dz] = DIRS[p.d];
  const ix = p.x - dx, iz = p.z - dz, k = at(ix, p.y, iz), q = plan.get(k);
  if (q?.block === "bricks") plan.delete(k);
  else if (q) { p.glass = false; p.block = "bricks"; }
}

// 4. warm light: glowstone standing in the air behind some windows
for (const p of [...plan.values()]) {
  if (!p.glass || (p.x * 7 + p.y * 3 + p.z * 5) % 5 !== 0) continue;
  const [dx, dz] = DIRS[p.d];
  const ix = p.x - dx, iz = p.z - dz;
  if (H(ix, iz) > p.y && !solidAt(ix, p.y, iz)) put(ix, p.y, iz, "glowstone");
}

// 5. the four-storey tier: a brick parapet at y 16 on the perimeter, and a plant room on the roof behind it
const PLANT = new Set(["4,1", "5,1"]);
for (const [key, h] of TOP) {
  if (h !== 16 || PLANT.has(key)) continue;
  const [x, z] = key.split(",").map(Number);
  if (exposures(x, z, 15).length) put(x, 16, z, "bricks");
}
for (const key of PLANT) {
  const [x, z] = key.split(",").map(Number);
  put(x, 16, z, "stone_bricks");
  put(x, 17, z, "smooth_stone");
}

// 6. glass panes connect along their own facade plane to neighbouring solids and panes
const solidNear = (x, y, z) => { const p = plan.get(at(x, y, z)); return !!p && p.block !== "dark_oak_door"; };
for (const p of plan.values()) {
  if (p.block !== "glass_pane") continue;
  const z_axis = p.d === "N" || p.d === "S";
  p.state = z_axis
    ? { east: String(solidNear(p.x + 1, p.y, p.z)), west: String(solidNear(p.x - 1, p.y, p.z)), north: "false", south: "false", waterlogged: "false" }
    : { north: String(solidNear(p.x, p.y, p.z - 1)), south: String(solidNear(p.x, p.y, p.z + 1)), east: "false", west: "false", waterlogged: "false" };
}

const g = new Voxels(SIZE);
for (const p of plan.values()) g.set(p.x, p.y, p.z, p.block, p.state);
const { blocks, palette } = g.save(OUT);
console.log(`way_437261898: ${blocks} blocks, ${palette} palette entries -> ${OUT}`);
