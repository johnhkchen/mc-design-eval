import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000037";
const W = 32, H = 37, D = 19;

const key = (x, z) => `${x},${z}`;
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// ---- footprint --------------------------------------------------------------
const cells = new Map();
for (const c of raw) {
  const [x, z, g, r] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.set(key(x, z), { g: Math.round(g), r: Math.round(r) });
}
const has = (x, z) => cells.has(key(x, z));

// ---- roof tiers: heavy smoothing, then snap to a flat base with a setback ----
const smooth = new Map();
for (const [k] of cells) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const o = cells.get(key(x + dx, z + dz));
    if (o) { sum += o.r; n++; }
  }
  smooth.set(k, sum / n);
}
const sorted = [...smooth.values()].sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)];
// flat base tier, snapped to a 2-block storey line
const BASE = Math.max(12, Math.min(H - 8, 2 * Math.round(median / 2)));

// ---- depth from the outside edge (0 = facade ring) --------------------------
const depth = new Map();
const queue = [];
for (const [k] of cells) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1)) {
    depth.set(k, 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz)) continue;
    const nk = key(nx, nz);
    if (!depth.has(nk)) { depth.set(nk, d + 1); queue.push([nx, nz]); }
  }
}

// roof per cell: flat base, with a stepped penthouse tier over deep interior
// cells whose smoothed lidar roof rises well above the base
const roofOf = new Map();
for (const [k] of cells) {
  const d = depth.get(k) ?? 0;
  const s = smooth.get(k);
  let R = BASE;
  if (d >= 4 && s > median + 3) R = Math.min(H - 5, BASE + 4);
  roofOf.set(k, R);
}

// ---- build ------------------------------------------------------------------
const g = new Voxels([W, H, D]);

// entrance: facade cell on the street-side edge (lowest z), nearest the middle
let entrance = null;
{
  let best = Infinity;
  for (const [k] of cells) {
    if (depth.get(k) !== 0) continue;
    const [x, z] = k.split(",").map(Number);
    const outward = !has(x, z - 1) ? "north" : !has(x, z + 1) ? "south"
      : !has(x - 1, z) ? "west" : "east";
    const pref = outward === "north" ? 0 : 25;
    const score = pref + Math.abs(x - W / 2) + z * 0.5;
    if (score < best) { best = score; entrance = { x, z, facing: outward }; }
  }
}

for (const [k, c] of cells) {
  const [x, z] = k.split(",").map(Number);
  const d = depth.get(k) ?? 2;
  const R = roofOf.get(k);
  const gr = c.g;

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const missX = !has(x - 1, z) || !has(x + 1, z);
  const missZ = !has(x, z - 1) || !has(x, z + 1);
  const corner = missX && missZ;
  const idx = missX && !missZ ? z : x;
  const winCol = d === 0 && !corner && idx % 3 === 1;

  // inward neighbour (air gap behind facade glass)
  const mxIn = !has(x - 1, z) ? 1 : !has(x + 1, z) ? -1 : 0;
  const mzIn = !has(x, z - 1) ? 1 : !has(x, z + 1) ? -1 : 0;
  const inX = x + mxIn, inZ = z + mzIn;
  const inDeep = mxIn !== 0 || mzIn !== 0 ? (depth.get(key(inX, inZ)) ?? 2) : 2;

  for (let y = gr; y < R; y++) {
    const rel = y - gr;
    const isTopRow = y >= R - 2;

    if (d === 0) {
      if (rel === 0) {
        g.set(x, y, z, y === gr ? "stone_bricks" : "smooth_stone");
      } else if (rel % 2 === 1 && winCol && !isTopRow) {
        const props = missX
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
        g.set(x, y, z, "glass_pane", props);
        if (idx % 4 === 0 && inDeep === 1) g.set(inX, y, inZ, "glowstone");
      } else {
        g.set(x, y, z, "bricks");
      }
    } else if (d === 1 && rel % 2 === 1 && !isTopRow) {
      // air gap behind the facade glass
    } else {
      g.set(x, y, z, rel % 2 === 0 ? "smooth_stone" : "stone");
    }
  }

  // roof: parapet on the facade, black roof membrane inside
  g.set(x, R, z, d === 0 ? "stone_bricks" : "black_concrete");

  // roof equipment on deep interior cells
  if (d >= 3 && x % 7 === 3 && z % 7 === 3) {
    g.set(x, R, z, "light_gray_concrete");
    g.set(x, R + 1, z, "light_gray_concrete");
  }
}

// entrance: dark oak door under a blackstone canopy, lit lobby behind
if (entrance) {
  const { x, z, facing } = entrance;
  const gr = cells.get(key(x, z)).g;
  g.set(x, gr, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "blackstone_slab", { type: "bottom", waterlogged: "false" });
  const inX = x + (facing === "east" ? -1 : facing === "west" ? 1 : 0);
  const inZ = z + (facing === "south" ? -1 : facing === "north" ? 1 : 0);
  if (has(inX, inZ)) g.set(inX, gr + 1, inZ, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
