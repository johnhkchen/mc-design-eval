// 50 Vanderbilt Avenue (NYC individual landmark, Commercial & Office, 1914): a 25 x 11 block court building.
// The lidar roof gives a 3-tier shaft (81 and 87 blocks, a crown on the east half), a 10-storey wing on the
// south-west corner, and 1-3 storey wings on the west; the north-east corner steps down to 75.
// Building = a one-cell-thick facade ring (piers, glass bays, belt courses, cornice) around hollow storeys
// with a solid floor slab per storey. The lidar gap in the tower and the two light courts (roof 0) are handled.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035374.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 25, D = 11, YMAX = 100;
const TIERS = [3, 6, 9, 30, 75, 81, 87];   // storey-aligned massing levels the lidar snaps to

// Raw lidar grids: roof[z][x] (null = outside the footprint), ground[z][x].
const roof = Array.from({ length: D }, () => Array(W).fill(null));
const ground = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, g, r] of cells) { roof[z][x] = r; ground[z][x] = g; }

const val = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? null : roof[z][x]);
const isBuilding = (x, z) => (val(x, z) ?? 0) > 0;

// 1. Lidar gaps: a roofless footprint cell ringed by building (8 of 8 is a hole, not a court) takes the neighbours' median.
// 2. Median of the 3x3 building neighbourhood, to drop lidar noise.
// 3. Snap to the nearest storey-aligned tier; roofless cells stay open (light courts).
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const H = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (val(x, z) === null) continue;
  let r = val(x, z);
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if ((dx || dz) && isBuilding(x + dx, z + dz)) nb.push(val(x + dx, z + dz));
  }
  if (r === 0) {
    if (nb.length < 8) continue;               // a light court, open to the sky
    r = median(nb);
  }
  const area = [r];
  for (const v of nb) area.push(v);
  const m = median(area);
  H[z][x] = TIERS.reduce((best, t) => (Math.abs(t - m) < Math.abs(best - m) ? t : best));
}
const hAt = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : H[z][x]);

// Facade material by height band: granite base (two storeys), brick shaft, limestone crown above 66.
const band = (y) => (y < 9 ? "base" : y < 66 ? "shaft" : "crown");
const MAT = {
  base: { pier: "polished_granite", belt: "stone_bricks" },
  shaft: { pier: "bricks", belt: "white_terracotta" },
  crown: { pier: "calcite", belt: "calcite" },
};
const WINDOW = "glass";
const LIGHTS = ["glowstone", "shroomlight"];

const g = new Voxels([W, YMAX, D]);

// Which sides of cell (x,z) are exterior at height y: neighbour outside the footprint, roofless, or lower.
const exposedDirs = (x, z, y) => [[0, -1], [0, 1], [-1, 0], [1, 0]].filter(([dx, dz]) => hAt(x + dx, z + dz) <= y);

// Warm light goes one cell behind a window (inside the hollow storey), only where that cell is open interior.
const interiorOpen = (x, z, y) => [[0, -1], [0, 1], [-1, 0], [1, 0]].every(([dx, dz]) => hAt(x + dx, z + dz) > y);

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const h = H[z][x];
  if (!h) continue;
  for (let y = 0; y < h; y++) {
    const ex = exposedDirs(x, z, y);
    const ring = ex.length > 0;
    const b = band(y);
    if (y === 0) { g.set(x, y, z, ring ? "stone_bricks" : "smooth_stone"); continue; }  // plinth, then ground floor slab
    if (y === h - 1) { g.set(x, y, z, ring ? "stone_bricks" : "smooth_stone"); continue; }  // cornice / roof
    if (y % 3 === 0) { g.set(x, y, z, ring ? MAT[b].belt : "smooth_stone"); continue; }  // belt course / floor slab
    if (!ring) continue;                                                                    // hollow storey behind the glass
    const onX = ex.some(([dx]) => dx !== 0), onZ = ex.some(([, dz]) => dz !== 0);
    const bay = onZ && !onX ? x : onX && !onZ ? z : null;
    const pier = bay === null || bay % 3 === 0;                                           // corners and every third bay
    if (pier) { g.set(x, y, z, MAT[b].pier); continue; }
    g.set(x, y, z, WINDOW);
    const seed = (x * 7 + z * 13 + y * 5) % 11;
    if (seed === 0 && ex.length === 1) {
      const [dx, dz] = ex[0];
      const ix = x - dx, iz = z - dz;                                                     // inward cell
      if (hAt(ix, iz) > y && interiorOpen(ix, iz, y)) g.set(ix, y, iz, LIGHTS[(x + y) % 2]);
    }
  }
}

// Entrances: a recessed three-bay portal on the south (Vanderbilt-side) face and a door on the north face.
const door = (x, z, facing) => {
  for (const half of ["lower", "upper"]) {
    g.set(x, half === "lower" ? 1 : 2, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
  }
};
for (const y of [1, 2]) { g.set(11, y, 10, "polished_granite"); g.set(13, y, 10, "polished_granite"); }
door(12, 10, "south");
door(22, 0, "north");

// Penthouse on the crown: a small limestone box with glass on each face, a roof over it, and a lantern on top.
for (let z = 4; z <= 6; z++) for (let x = 16; x <= 18; x++) for (let y = 87; y <= 89; y++) {
  const edge = x === 16 || x === 18 || z === 4 || z === 6;
  g.set(x, y, z, edge ? (y === 88 && (x === 17 || z === 5) ? WINDOW : "calcite") : "air");
}
for (let z = 4; z <= 6; z++) for (let x = 16; x <= 18; x++) g.set(x, 90, z, "stone_bricks");
g.set(17, 91, 5, "lantern", { hanging: "false", waterlogged: "false" });

g.save(`${DIR}/NYC1035374.nbt`);
