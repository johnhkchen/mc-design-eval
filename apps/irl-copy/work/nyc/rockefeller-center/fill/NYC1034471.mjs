// 67 West 47th Street, 1928: a stepped Art Deco office block on the lidar massing. Limestone-buff walls with
// chiseled storey bands, a granite base and shopfront, copper crown on the tiers, deep tar roofs, one glazed lobby.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1034471.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const W = 18, D = 28, HMAX = 66;

const roof = Array.from({ length: D }, () => Array(W).fill(-1));                  // -1 = not footprint
for (const [x, z, , r] of cells) roof[z][x] = r;
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && roof[z][x] >= 0;
// Lidar roof 0 inside the footprint is an open light well; roof 0 on the edge is a one-storey low wing.
const court = (x, z) => inFp(x, z) && roof[z][x] === 0 && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => inFp(x + dx, z + dz));
const DIR = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };

// Storey tiers: median of the 3x3 lidar roofs (noise out), then snapped to whole storeys (3 blocks).
function height(x, z) {
  if (!inFp(x, z) || court(x, z)) return 0;
  if (roof[z][x] === 0) return 3;
  // A 1-cell strip on the west edge at 66 blocks with open lidar inboard is spill from the building next door, not this one's massing.
  if (x === 0 && roof[z][x] >= 60 && roof[z][1] === 0) return 9;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (inFp(x + dx, z + dz) && roof[z + dz][x + dx] > 0) vals.push(roof[z + dz][x + dx]);
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  return Math.max(3, Math.min(HMAX, Math.round(med / 3) * 3));
}

const H = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => height(x, z)));
const hAt = (x, z) => (inFp(x, z) ? H[z][x] : 0);
// A neighbour is open at height y when it is outside the footprint or stands lower than y (a step or a light well).
const openAt = (x, z, y) => !inFp(x, z) || y >= H[z][x];
const exposures = (x, z, y) => Object.fromEntries(Object.entries(DIR).map(([d, [dx, dz]]) => [d, openAt(x + dx, z + dz, y)]));
const isWall = (ex) => ex.n || ex.s || ex.w || ex.e;

const g = new Voxels([W, 78, D]);

// Facade at one height: granite base, chiseled band at every storey line, glass between piers every third bay.
function facade(x, z, y, ex) {
  const ns = ex.n || ex.s, ew = ex.w || ex.e;
  const i = ns ? x : z;
  const pier = (ns && ew) || i % 3 === 0;
  if (y === 0) return "polished_granite";
  if (y % 3 === 0) return "chiseled_sandstone";
  if (pier) return y < 3 ? "polished_granite" : "smooth_sandstone";
  return "light_blue_stained_glass";
}

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z)) continue;
  if (court(x, z)) { g.set(x, 0, z, "stone_bricks"); continue; }                  // paved light well
  const h = H[z][x];
  for (let y = 0; y < h; y++) {
    const ex = exposures(x, z, y);
    if (isWall(ex)) g.set(x, y, z, facade(x, z, y, ex));                           // street or step face: solid
    else if (y % 3 === 0) g.set(x, y, z, "smooth_sandstone");                      // hollow inside: a floor per storey
    else if (y === h - 1) g.set(x, y, z, "deepslate_tiles");                       // tar roof over the hollow
  }
  if (Object.values(exposures(x, z, h)).some(Boolean)) {                           // a parapet where the roof has an edge
    g.set(x, h, z, h >= 48 ? "waxed_oxidized_cut_copper_slab" : "polished_andesite_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Warm lights in some lower-window bays: a lantern on the floor just inside the glass.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z) || court(x, z)) continue;
  for (let y = 1; y < H[z][x]; y += 3) {
    const ex = exposures(x, z, y);
    const ns = ex.n || ex.s, ew = ex.w || ex.e;
    if (!(ns !== ew) || facade(x, z, y, ex) !== "light_blue_stained_glass") continue;   // single-face bays only
    if ((x * 5 + z * 3 + y) % 7 !== 0) continue;
    const [ix, iz] = ex.n ? [0, 1] : ex.s ? [0, -1] : ex.w ? [1, 0] : [-1, 0];
    const nx = x + ix, nz = z + iz;
    if (!inFp(nx, nz) || court(nx, nz) || hAt(nx, nz) <= y || isWall(exposures(nx, nz, y))) continue;
    g.set(nx, y, nz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Lobby on the south face: granite piers, glazed vestibule, a double door, a copper canopy over it.
for (const x of [9, 10, 11]) {
  g.set(x, 0, 27, "polished_granite");
  g.set(x, 1, 27, "light_blue_stained_glass");
  g.set(x, 2, 27, "light_blue_stained_glass");
  g.set(x, 3, 27, "waxed_oxidized_cut_copper_slab", { type: "bottom", waterlogged: "false" });
}
for (const x of [8, 12]) g.set(x, 3, 27, "waxed_oxidized_cut_copper_slab", { type: "bottom", waterlogged: "false" });
const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(10, 0, 27, "dark_oak_door", { ...door, half: "lower" });
g.set(10, 1, 27, "dark_oak_door", { ...door, half: "upper" });
g.set(10, 1, 26, "lantern", { hanging: "false", waterlogged: "false" });

const { blocks, palette } = g.save(`${dir}/NYC1034471.nbt`);
console.log(`NYC1034471.nbt: ${blocks} blocks, ${palette} palette entries, tallest ${Math.max(...H.flat())} blocks`);
