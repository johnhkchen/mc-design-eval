// NYC1035725: 1 East 53rd Street, a 1927 midtown setback office, 6 x 24 blocks, roof 52 above its lowest ground.
// The lidar steps the lot down at both ends (about 25 on the north front, 30 on the south) and rises to a 52-block
// tower in the middle, so it reads as Zoning Resolution setbacks: cream limestone piers and storey belts, dark glass
// between them, a granite-dark base with a shopfront and an iron door on the north face, and a copper crown with a
// lantern. The skin is one block thick; behind every pane sits a one-deep air gap (lit in some), and the rest is solid
// core, so every block stands on something.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 6, D = 24, H = 64;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035725.cells.json`, "utf8"));

// Lidar roof per footprint cell; zeros inside the mass are drop-outs, so they take the median of their standing neighbours.
const raw = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, , r] of cells) raw[z][x] = r;
const at = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : raw[z][x]);
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const TIERS = [24, 30, 36, 42, 52];
const tier = (h) => TIERS.reduce((best, t) => (Math.abs(t - h) < Math.abs(best - h) ? t : best));
const filled = raw.map((row, z) => row.map((r, x) => {
  if (r) return r;
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const v = at(x + dx, z + dz); if (v) nb.push(v); }
  return nb.length ? median(nb) : 0;
}));
// Smooth each cell with its 3 x 3 neighbourhood, then snap to a storey tier: flat setback roofs, no lidar wobble.
const R = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => {
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const xx = x + dx, zz = z + dz;
    if (xx >= 0 && zz >= 0 && xx < W && zz < D && filled[zz][xx]) nb.push(filled[zz][xx]);
  }
  return tier(median(nb));
}));

const GLASS = "gray_stained_glass_pane";
const perimeter = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const onWE = (x) => x === 0 || x === W - 1;                         // the long 24-block faces
const pier = (x, z) => (onWE(x) ? z % 3 === 0 || z === D - 1 : x === 3);   // mullions between bays; corners are piers
const door = (x, z) => z === 0 && x === 2;                           // the entrance, north face
const inward = (x, z) => [x === 0 ? 1 : x === W - 1 ? -1 : 0, z === 0 ? 1 : z === D - 1 ? -1 : 0];
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

// The skin of a perimeter cell at height y in a tier of roof r: a base course, a shopfront, storey belts, piers, glass.
function skin(x, z, y, r) {
  if (y === r - 1) return ["smooth_quartz"];                          // cornice: the tier's top course
  if (y === 0) return door(x, z) ? ["iron_door", doorState("lower")] : ["polished_andesite"];
  if (door(x, z) && y === 1) return ["iron_door", doorState("upper")];
  if (z === 0 && y === 3 && x >= 1 && x <= 4) return ["dark_oak_planks"];   // entrance canopy
  if (y <= 2) return pier(x, z) ? ["quartz_pillar"] : [GLASS];        // shopfront glass on the ground floor
  if (y % 3 === 0) return ["chiseled_quartz_block"];                  // storey line
  return pier(x, z) ? ["quartz_pillar"] : [GLASS];
}

// Air directly behind every pane (one block deep, inside the skin, below the cornice).
const gap = new Set();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!perimeter(x, z) || pier(x, z)) continue;
  const [ix, iz] = inward(x, z);
  for (let y = 0; y < R[z][x] - 1; y++) if (skin(x, z, y, R[z][x])[0] === GLASS) gap.add(`${x + ix},${y},${z + iz}`);
}

const g = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const r = R[z][x];
  for (let y = 0; y < r; y++) {
    if (perimeter(x, z)) { const [block, state] = skin(x, z, y, r); g.set(x, y, z, block, state); continue; }
    if (!gap.has(`${x},${y},${z}`)) { g.set(x, y, z, "stone"); continue; }
    // A warm light in some of the windows: on the lower row of each storey, standing on the solid core below.
    if (y % 3 === 1 && (x * 7 + z * 5 + Math.floor(y / 3)) % 4 === 0) g.set(x, y, z, (x + z) % 2 ? "glowstone" : "shroomlight");
  }
  // Balustrade on the open roof of every lower setback, along its outer edge.
  if (perimeter(x, z) && r < 52) g.set(x, r, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
}

// Crown on the 52-block tower: two copper setbacks and a lantern on top.
for (let z = 9; z <= 14; z++) for (let x = 2; x <= 3; x++) if (R[z][x] === 52) {
  g.set(x, 52, z, "waxed_oxidized_copper");
  g.set(x, 53, z, "waxed_oxidized_copper");
  if (z >= 10 && z <= 13) { g.set(x, 54, z, "waxed_oxidized_copper"); g.set(x, 55, z, "waxed_oxidized_copper"); }
}
g.set(2, 56, 11, "lantern", { hanging: "false", waterlogged: "false" });

// Plant boxes on the 42-block setback, sitting on its roof.
for (let z = 17; z <= 18; z++) for (let x = 1; x <= 2; x++) if (R[z][x] === 42) {
  g.set(x, 42, z, "smooth_quartz");
  g.set(x, 43, z, "smooth_quartz");
}

const { blocks, palette } = g.save(`${DIR}/NYC1035725.nbt`);
console.log(`NYC1035725.nbt: ${blocks} blocks, palette ${palette}`);
