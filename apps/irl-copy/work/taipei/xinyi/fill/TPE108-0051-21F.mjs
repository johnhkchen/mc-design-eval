import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE108-0051-21F: 2019 mixed-use tower, Xinyi district, Taipei.
// Glass-and-white-concrete tower on a stone-plinth podium, three setback
// tiers and a mechanical crown. Roof about y=102, penthouse to 110, spire to 112.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE108-0051-21F";
const W = 72, H = 114, D = 58;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint and ground lookup ----
const ground = new Map();
const key = (x, z) => `${x},${z}`;
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.round(gr));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// ---- massing: nested tiers, each inset from the footprint bbox ----
const tiers = [
  { top: 25, inset: 0 },   // podium
  { top: 60, inset: 4 },   // lower tower
  { top: 88, inset: 10 },  // mid tower setback
  { top: 102, inset: 16 }, // upper tower, roof at 102
  { top: 110, inset: 22 }, // mechanical penthouse
];

function regionAt(y) {
  for (let k = 0; k < tiers.length; k++) if (y < tiers[k].top) return k;
  return -1;
}

function inRegion(k, x, z) {
  if (k < 0) return false;
  if (!ground.has(key(x, z))) return false;
  const i = tiers[k].inset;
  return x >= minX + i && x <= maxX - i && z >= minZ + i && z <= maxZ - i;
}

function present(x, z, y) {
  const gr = ground.get(key(x, z));
  if (gr === undefined || y < gr) return false;
  return inRegion(regionAt(y), x, z);
}

function perimeter(k, x, z) {
  return !inRegion(k, x - 1, z) || !inRegion(k, x + 1, z) ||
         !inRegion(k, x, z - 1) || !inRegion(k, x, z + 1);
}

function pick23(x, y, z) {
  let v = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647);
  v ^= v >>> 13;
  return (v >>> 0) % 23;
}

// ---- facade and element rules ----
function facadeBlock(k, x, y, z) {
  const onXFace = !inRegion(k, x - 1, z) || !inRegion(k, x + 1, z);
  const along = onXFace ? z : x;
  // full-height concrete piers every 6 blocks give the tower vertical rhythm
  if (along % 6 === 0) return "white_concrete";
  // slim mullions every 3 blocks between them
  if (along % 3 === 0) return "light_gray_concrete";
  if (y < 5) return "glass";
  if (y % 5 === 2 && pick23(x, y, z) === 0) return "glowstone";
  return "light_blue_stained_glass";
}

function elementAt(x, y, z) {
  const k = regionAt(y);
  const edge = perimeter(k, x, z);
  const r = y % 5;
  if (r === 0) return edge ? "white_concrete" : "light_gray_concrete";
  if (r === 4) return edge ? "white_concrete" : null;
  if (edge) return facadeBlock(k, x, y, z);
  return null;
}

// ---- foundation, body, and tier terraces ----
for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= 110 && y < H; y++) {
    if (present(x, z, y)) {
      const b = elementAt(x, y, z);
      if (b) g.set(x, y, z, b);
    } else if (y - 1 >= 0 && present(x, z, y - 1)) {
      const k = regionAt(y - 1);
      g.set(x, y, z, perimeter(k, x, z) ? "white_concrete" : "light_gray_concrete");
    }
  }
}

// ---- main entrance: recessed glazed lobby, door, and canopy on the south face ----
const cx = (minX + maxX) / 2;
const southCells = cells.filter(([, z]) => z === minZ);
if (southCells.length) {
  southCells.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  const [ex, ez] = southCells[0];
  const gr = ground.get(key(ex, ez));

  // glazed lobby across three cells, storey height, with a dark stone frame at the corners
  for (let dx = -1; dx <= 1; dx++) {
    const x = ex + dx;
    if (!ground.has(key(x, ez))) continue;
    const lg = ground.get(key(x, ez));
    for (let y = lg; y < lg + 4; y++) {
      if (y < 0 || y >= H) continue;
      if (dx === 0 && y <= gr + 1) continue; // door occupies this column
      g.set(x, y, ez, dx === 0 ? "glass" : "stone_bricks");
    }
  }

  // door pair
  const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  g.set(ex, gr, ez, "dark_oak_door", doorProps("lower"));
  g.set(ex, gr + 1, ez, "dark_oak_door", doorProps("upper"));
  g.set(ex, gr + 2, ez, "light_gray_concrete");

  // canopy over the entrance, three cells wide, at storey-line height
  for (let dx = -2; dx <= 2; dx++) {
    const x = ex + dx;
    if (!ground.has(key(x, ez))) continue;
    g.set(x, gr + 4, ez, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  }
}

// ---- crown: antenna on the penthouse centre ----
const crownCells = cells.filter(([x, z]) => inRegion(4, x, z));
if (crownCells.length) {
  const mx = crownCells.reduce((s, c) => s + c[0], 0) / crownCells.length;
  const mz = crownCells.reduce((s, c) => s + c[1], 0) / crownCells.length;
  let best = crownCells[0];
  for (const c of crownCells) {
    if (Math.hypot(c[0] - mx, c[1] - mz) < Math.hypot(best[0] - mx, best[1] - mz)) best = c;
  }
  for (let y = 110; y <= 112; y++) g.set(best[0], y, best[1], "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
