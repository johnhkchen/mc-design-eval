// DC62191: 555 E Street SW, Southwest Washington. A vacant-with-permit mid-century block of the Southwest
// redevelopment era: brick piers, a concrete spandrel band at every floor, glass in between, a stone base, a
// stepped massing (the lidar's tall north wing over a lower body and wings), and a plant room on the north roof.
// Storeys are 2 blocks (window row + slab row) because a storey is about 1.5 blocks at 0.42 blocks per metre.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC62191.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 25, D = 23, H = 13;

const lidar = Array.from({ length: D }, () => Array(W).fill(1));
for (const [x, z, , roof] of cells) lidar[z][x] = roof;

// Lidar noise out: two passes of a 3x3 median of the roof heights (one pass left single-block spikes and
// notches on the skyline); the top block of each column is roof - 1.
const smooth = (src) => Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const xx = x + dx, zz = z + dz;
    if (xx >= 0 && xx < W && zz >= 0 && zz < D) v.push(src[zz][xx]);
  }
  return v.sort((a, b) => a - b)[v.length >> 1];
}));
const T = smooth(smooth(lidar)).map((row) => row.map((r) => r - 1));

// A neighbour is open at height y when it is off the footprint or its top is below y: that face is exterior.
const top = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? -1 : T[z][x]);
const exposure = (x, z, y) => ({
  n: top(x, z - 1) < y, s: top(x, z + 1) < y, w: top(x - 1, z) < y, e: top(x + 1, z) < y,
});
const isEdge = (x, z, y) => { const e = exposure(x, z, y); return e.n || e.s || e.w || e.e; };

const pane = (alongX) => (alongX
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });

const g = new Voxels([W, H, D]);
const glow = [];   // interior cells behind a window that get a warm light

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const t = T[z][x];
  for (let y = 0; y <= t; y++) {
    if (y === t) { g.set(x, y, z, t === 0 ? "smooth_stone" : "light_gray_concrete"); continue; }   // roof / cornice
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                                    // base course
    const e = exposure(x, z, y);
    const edge = e.n || e.s || e.w || e.e;
    if (y % 2 === 1) { g.set(x, y, z, "white_concrete"); continue; }                              // floor slab / spandrel band
    if (!edge) continue;                                                                          // interior: air behind the glass
    const corner = (e.n || e.s) && (e.w || e.e);
    const alongX = (e.n || e.s) && !(e.w || e.e);
    const i = alongX ? x : z;
    if (corner || i % 3 === 0) { g.set(x, y, z, "bricks"); continue; }                            // brick piers
    g.set(x, y, z, "cyan_stained_glass_pane", pane(alongX));
    // a warm light just inside some windows, in the lit storeys
    if ((y === 4 && i % 6 === 1) || (y === 6 && i % 6 === 4)) {
      const inner = e.n ? [x, z + 1] : e.s ? [x, z - 1] : e.w ? [x + 1, z] : [x - 1, z];
      if (inner[0] >= 0 && inner[1] >= 0 && inner[0] < W && inner[1] < D && !isEdge(inner[0], inner[1], y)) glow.push([inner[0], y, inner[1]]);
    }
  }
}

for (const [x, y, z] of glow) g.set(x, y, z, "glowstone");

// South entrance: an iron door under a stone lintel, a lantern each side.
const S = D - 1;
g.set(11, 2, S, "smooth_stone");
g.set(13, 2, S, "smooth_stone");
g.set(12, 2, S, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(12, 3, S, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(10, 2, S, "lantern", { hanging: "false", waterlogged: "false" });
g.set(14, 2, S, "lantern", { hanging: "false", waterlogged: "false" });
for (let x = 10; x <= 14; x++) g.set(x, 4, S, "smooth_stone");

// Plant room on the top tier of the north wing: brick walls, a concrete roof, and a vent stack.
for (let z = 0; z <= 1; z++) for (let x = 8; x <= 10; x++) {
  if (T[z][x] !== 9) continue;
  g.set(x, 10, z, "bricks");
  g.set(x, 11, z, "light_gray_concrete");
}
if (T[0][9] === 9) g.set(9, 12, 0, "iron_bars");   // a vent stack, only on a plant-room cap

const out = `${dir}/DC62191.nbt`;
const { blocks, palette } = g.save(out);
console.log(`DC62191: ${blocks} blocks, ${palette} palette entries -> ${out}`);
