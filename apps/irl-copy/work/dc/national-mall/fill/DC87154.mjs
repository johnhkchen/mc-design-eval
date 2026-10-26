import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87154";
const W = 50, D = 36, H = 35;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => `${x},${z}`;
const parse = (k) => k.split(",").map(Number);

// Per-cell ground and roof (roof is absolute height above y 0)
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gy = clamp(Math.round(gr), 0, H - 4);
  const r = clamp(Math.round(rf), gy + 3, H - 1);
  map.set(key(x, z), { gy, r });
}

// Depth from the outside edge: 1 = facade cell, 2 = gap cell, 3+ = core
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const depth = new Map();
let frontier = [];
for (const k of map.keys()) {
  const [x, z] = parse(k);
  if (NB.some(([dx, dz]) => !map.has(key(x + dx, z + dz)))) {
    depth.set(k, 1);
    frontier.push(k);
  }
}
let d = 1;
while (frontier.length) {
  const next = [];
  for (const k of frontier) {
    const [x, z] = parse(k);
    for (const [dx, dz] of NB) {
      const nk = key(x + dx, z + dz);
      if (map.has(nk) && !depth.has(nk)) {
        depth.set(nk, d + 1);
        next.push(nk);
      }
    }
  }
  frontier = next;
  d++;
}
for (const k of map.keys()) if (!depth.has(k)) depth.set(k, 3);

// Main entrance: facade cell near the middle of the footprint, lowest z
let doorKey = null;
{
  const cand = [...map.keys()]
    .filter((k) => depth.get(k) === 1)
    .map(parse)
    .filter(([x]) => x === 24 || x === 25)
    .sort((a, b) => a[1] - b[1]);
  if (cand.length) doorKey = key(cand[0][0], cand[0][1]);
}

// Build each footprint column
for (const [k, { gy, r }] of map) {
  const [x, z] = parse(k);
  const dep = depth.get(k);

  // Foundation
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gy; y < r; y++) {
    const rel = y - gy;
    const top = y === r - 1;
    const topCornice = top && dep === 1;
    const spandrel = rel >= 3 && (rel - 3) % 2 === 0;
    const glassRow = rel >= 1 && !spandrel && rel !== 0;
    const pilaster = (x % 6 === 0 || z % 6 === 0);
    let blk = null;

    if (dep === 1) {
      if (topCornice) blk = "quartz_block";                  // light cornice
      else if (rel === 0) blk = "polished_granite";           // dark base course
      else if (rel <= 2) {                                    // shopfront
        blk = pilaster ? "stone_bricks" : "light_blue_stained_glass";
      } else if (pilaster) {
        blk = "polished_granite";                             // vertical relief
      } else if (spandrel) {
        blk = "white_concrete";
      } else {                                                // curtain-wall glass
        blk = (x % 3 === 0 || z % 3 === 0) ? "quartz_pillar" : "light_blue_stained_glass";
      }
      // Cornice soffit one row below the top
      if (y === r - 2 && !pilaster) blk = "smooth_quartz";
    } else if (dep === 2) {
      const solidRow = rel === 0 || spandrel || top || y === r - 2;
      if (solidRow) blk = top ? "light_gray_concrete" : "light_gray_concrete";
      else if (glassRow && (x * 31 + z * 17 + rel * 7) % 13 === 0) blk = "glowstone";
      else blk = null;                                        // air gap behind glass
    } else {
      blk = top ? "light_gray_concrete" : "light_gray_concrete";
    }

    if (blk) g.set(x, y, z, blk);
  }

  // Roof plant: 2x2 penthouse blocks on the deep core, with a light cap
  const px = x % 8, pz = z % 8;
  if (dep >= 4 && (px === 4 || px === 5) && (pz === 4 || pz === 5) && r + 2 < H) {
    g.set(x, r, z, "white_concrete");
    if (px === 4 && pz === 4) {
      g.set(x, r + 1, z, "white_concrete");
      g.set(x, r + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Entrance: double-height door under a small canopy
if (doorKey) {
  const [x, z] = parse(doorKey);
  const gy = map.get(doorKey).gy;
  const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(x, gy + 1, z, "dark_oak_door", { ...base, half: "lower" });
  g.set(x, gy + 2, z, "dark_oak_door", { ...base, half: "upper" });
  g.set(x, gy + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
