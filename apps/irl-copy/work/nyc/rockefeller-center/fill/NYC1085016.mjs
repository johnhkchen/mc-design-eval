// 153 West 44th Street (Millennium Broadway Hotel, 1988): a 45-storey glass tower on a stone podium, with a
// two-storey shop base on the west, a 12-storey wing, a 34-storey accent at the south-west corner, and a mechanical
// penthouse on the crown. Massing follows the lidar roof, smoothed into 3-block storeys and stepped back at 102 and 120.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 32, D = 11, H = 147;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1085016.cells.json`, "utf8"));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Footprint, and the lidar with its zero holes filled from their neighbours.
const lidar = Array.from({ length: D }, () => Array(W).fill(null));
const ground = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, g, r] of cells) { lidar[z][x] = r; ground[z][x] = g; }
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && lidar[z][x] !== null;
const roof = lidar.map((row) => row.slice());
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z) || lidar[z][x] !== 0) continue;
  const v = NB.map(([dx, dz]) => [x + dx, z + dz]).filter(([a, b]) => inFp(a, b) && lidar[b][a] > 0)
    .map(([a, b]) => lidar[b][a]).sort((p, q) => p - q);
  roof[z][x] = v.length ? v[v.length >> 1] : 0;
}

// Roof heights as clean tiers: tower 129 (north) and 135 (crown), accent 102, podium and wings in whole storeys.
function tier(r) {
  if (r >= 127 && r <= 131) return 129;
  if (r >= 132) return 135;
  if (r >= 100) return 102;
  return Math.max(6, Math.round(r / 3) * 3);
}
const T0 = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => (inFp(x, z) ? tier(roof[z][x]) : null)));
const isTower = (x, z) => inFp(x, z) && T0[z][x] >= 60;

// Ring: 0 = tower cells on the edge of the tower mass, growing inward. Setbacks cap the rings.
const ring = Array.from({ length: D }, () => Array(W).fill(-1));
const rq = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (isTower(x, z) && NB.some(([dx, dz]) => !isTower(x + dx, z + dz))) { ring[z][x] = 0; rq.push([x, z]); }
}
for (let i = 0; i < rq.length; i++) {
  const [x, z] = rq[i];
  for (const [dx, dz] of NB) {
    const a = x + dx, b = z + dz;
    if (isTower(a, b) && ring[b][a] < 0) { ring[b][a] = ring[z][x] + 1; rq.push([a, b]); }
  }
}
const TOP = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => {
  if (!inFp(x, z)) return 0;
  let t = T0[z][x];
  if (isTower(x, z)) {
    if (ring[z][x] === 0) t = Math.min(t, 102);        // rim steps back at 34 storeys
    else if (ring[z][x] <= 2) t = Math.min(t, 120);    // middle ring steps back at 40 storeys
  }
  return t;
}));

const inL = (x, z, y) => inFp(x, z) && TOP[z][x] > y;   // is the cell still standing at height y
const maxY = Math.max(...TOP.flat());

// Depth of each cell inside its own layer at height y: 0 = exposed to outside air, 1 = behind the skin, 2+ = core.
const depth = [];
for (let y = 0; y < maxY; y++) {
  const d = new Int8Array(W * D).fill(-1);
  const q = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (inL(x, z, y) && NB.some(([dx, dz]) => !inL(x + dx, z + dz, y))) { d[z * W + x] = 0; q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    for (const [dx, dz] of NB) {
      const a = x + dx, b = z + dz;
      if (inL(a, b, y) && d[b * W + a] < 0) { d[b * W + a] = d[z * W + x] + 1; q.push([a, b]); }
    }
  }
  depth.push(d);
}
const dep = (x, z, y) => (inL(x, z, y) ? depth[y][z * W + x] : -1);

// Exposed skin: which face it is on (z faces read x along the street, x faces read z), and what the face shows.
const paneState = (zFace) => (zFace
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" });
function skin(x, z, y) {
  const zFace = !inL(x, z - 1, y) || !inL(x, z + 1, y);
  const u = zFace ? x : z;
  const podium = TOP[z][x] < 60;
  if (y === 0) return { kind: "plinth", block: "polished_granite" };
  const doorCell = (x === 15 && z === 10) || (x === 26 && z === 0);
  if (doorCell && (y === 1 || y === 2)) {
    return { kind: y === 1 ? "door-lower" : "door-upper", block: "iron_door",
      state: { facing: z === 10 ? "south" : "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  if (y < 3) {
    if (y === 2) return { kind: "spandrel", block: "polished_andesite" };
    return u % 3 === 0 ? { kind: "shopPier", block: "cut_copper" }
      : { kind: "shopGlass", block: "glass_pane", state: paneState(zFace) };
  }
  if (y % 3 === 0) return { kind: "spandrel", block: "polished_andesite" };
  if (u % 3 === 0) return { kind: "pier", block: podium ? "smooth_quartz" : "light_gray_concrete" };
  const accent = (u * 5 + y) % 11 === 0;
  return { kind: "glass", block: accent ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane", state: paneState(zFace) };
}
const isGlass = (k) => k === "glass" || k === "shopGlass";
// A warm light behind some lower-row panes, in the air gap.
const lit = (x, z, y) => y % 3 === 1 && (x * 31 + z * 17 + y * 7) % 6 === 0 &&
  NB.some(([dx, dz]) => dep(x + dx, z + dz, y) === 0 && isGlass(skin(x + dx, z + dz, y).kind));

const g = new Voxels([W, H, D]);
const LANTERN_CELLS = [[15, 9, 2], [26, 1, 1]];

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z)) continue;
  const T = TOP[z][x];
  for (let y = 0; y < ground[z][x]; y++) g.set(x, y, z, "stone");
  for (let y = ground[z][x]; y < T; y++) {
    const d = dep(x, z, y);
    if (y === T - 1) { g.set(x, y, z, d === 0 ? "smooth_stone" : "stone"); continue; }   // cornice on the edge, roof inside
    if (d === 0) {
      const s = skin(x, z, y);
      g.set(x, y, z, s.block, s.state);
      continue;
    }
    if (d === 1) {
      if (y % 3 === 0) g.set(x, y, z, "smooth_stone");                       // floor slab
      else if (inL(x, z, y + 1) && dep(x, z, y + 1) === 0) g.set(x, y, z, "smooth_stone");   // a tier starts above: stand it on solid
      else if (LANTERN_CELLS.some(([a, b, c]) => a === x && b === z && c === y)) g.set(x, y, z, "lantern", { hanging: y === 2 ? "true" : "false" });
      else if (lit(x, z, y)) g.set(x, y, z, "glowstone");
      continue;                                                              // air gap behind the glass
    }
    g.set(x, y, z, "stone");                                                  // structure core
  }
}

// Mechanical penthouse on the crown, standing on the roof.
for (let z = 3; z <= 5; z++) for (let x = 16; x <= 19; x++) {
  const T = TOP[z][x];
  for (let y = T; y < T + 3; y++) g.set(x, y, z, y === T + 2 ? "oxidized_cut_copper" : "light_gray_concrete");
}

const out = `${DIR}/NYC1085016.nbt`;
const info = g.save(out);
console.log(`saved ${out}: ${info.blocks} blocks, ${info.palette} palette entries, tallest ${Math.max(...TOP.flat())} blocks + penthouse`);
