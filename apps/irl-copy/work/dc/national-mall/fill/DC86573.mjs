import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86573.cells.json`, "utf8"));

// 1400 I St NW: 1960s-70s precast and tinted-glass office block.
// Granite-look base, bays of glass between white precast mullions,
// spandrel bands, three clean tiers (podium, mid setback, tower),
// smooth-quartz cornice, a single plant room with parapet, and a
// double-door lobby entrance with canopy on the north (street) face.
const W = 16, H = 32, D = 19;
const g = new Voxels([W, H, D]);

const cm = new Map();
for (const [x, z, gr, ro] of cells) {
  cm.set(`${x},${z}`, { g: Math.round(gr), r: Math.round(ro) });
}
const has = (x, z) => cm.has(`${x},${z}`);
const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from the outside edge of the footprint (1 = perimeter).
const depth = new Map();
let frontier = [];
for (const k of cm.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (nb.some(([dx, dz]) => !has(x + dx, z + dz))) {
    depth.set(k, 1);
    frontier.push([x, z]);
  }
}
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) {
    const d = depth.get(`${x},${z}`);
    for (const [dx, dz] of nb) {
      const nx = x + dx, nz = z + dz, k = `${nx},${nz}`;
      if (has(nx, nz) && !depth.has(k)) {
        depth.set(k, d + 1);
        next.push([nx, nz]);
      }
    }
  }
  frontier = next;
}

// Tier heights from the lidar's main roof level, not per-cell noise.
const rVals = [...cm.values()].map((c) => c.r).sort((a, b) => a - b);
const rMax = rVals[Math.floor(rVals.length * 0.9)];   // robust tower top
const tierTower = Math.min(rMax, 26);
const tierMid = Math.round(tierTower * 0.8 / 2) * 2;   // even-numbered tier lines
const tierPodium = Math.round(tierTower * 0.55 / 2) * 2;

const topOf = (k) => {
  const c = cm.get(k);
  const d = depth.get(k) || 1;
  const gr = c.g;
  // Genuinely low wings keep a smoothed lower roof.
  if (c.r < tierPodium - 2) {
    return Math.max(gr + 4, Math.round(c.r / 2) * 2);
  }
  let T = d === 1 ? tierPodium : d === 2 ? tierMid : tierTower;
  return Math.max(T, gr + 4);
};

const cellInfo = new Map();
for (const k of cm.keys()) {
  cellInfo.set(k, { g: cm.get(k).g, T: topOf(k), d: depth.get(k) || 1 });
}

const outward = (x, z) => nb.find(([dx, dz]) => !has(x + dx, z + dz));

// 1. Foundations and building columns
for (const [k, info] of cellInfo) {
  const [x, z] = k.split(",").map(Number);
  const { g: gr, T, d } = info;
  const per = d === 1;
  const along = (z === 0 || z === D - 1) ? x : z;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < T; y++) {
    const ly = y - gr;
    if (y === T - 1) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (!per) {
      if (y % 4 === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (ly === 0) { g.set(x, y, z, "polished_andesite"); continue; }
    if (ly < 4) {
      // Lobby: tinted glass between stone mullions, lintel on top
      if (ly === 3 || along % 3 === 0) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, "light_blue_stained_glass");
      continue;
    }
    if (y % 4 === 0 || y % 4 === 3) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (along % 2 === 0) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "light_blue_stained_glass_pane", { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
  }
}

// 2. Warm lights behind some window bays (air gap, lantern inside)
for (const [k, info] of cellInfo) {
  if (info.d !== 1) continue;
  const [x, z] = k.split(",").map(Number);
  const [ox, oz] = outward(x, z);
  const ix = x - ox, iz = z - oz;
  if (!has(ix, iz)) continue;
  for (let y = info.g + 4; y < info.T - 1; y++) {
    const r = y % 4;
    if (r !== 1 && r !== 2) continue;
    const along = (z === 0 || z === D - 1) ? x : z;
    if (along % 2 !== 1) continue;
    if (((x * 7 + z * 13 + y * 5) % 9) !== 0) continue;
    g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 3. One plant room on the tower roof, with a parapet ring
{
  const x0 = 5, x1 = 10, z0 = 6, z1 = 12;
  const yTop = tierTower;
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z) || (depth.get(`${x},${z}`) || 1) < 3) continue;
      const edge = x === x0 || x === x1 || z === z0 || z === z1;
      g.set(x, yTop, z, edge ? "smooth_stone" : "light_gray_concrete");
      g.set(x, yTop + 1, z, edge ? "smooth_stone" : "light_gray_concrete");
      if (edge) g.set(x, yTop + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// 4. Lobby entrance on the north (z = 0) face: double doors, stone surround, canopy
{
  const doorX = [7, 8];
  if (doorX.every((x) => has(x, 0))) {
    const gr = cellInfo.get("7,0").g;
    // Canopy: slab band across the lintel above the doors
    for (let x = 5; x <= 10; x++) {
      if (has(x, 0)) g.set(x, gr + 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
    // Stone surround at the sides of the doorway
    for (const x of [6, 9]) {
      if (has(x, 0)) {
        g.set(x, gr, 0, "stone_bricks");
        g.set(x, gr + 1, 0, "stone_bricks");
        g.set(x, gr + 2, 0, "stone_bricks");
      }
    }
    // Double iron doors, lower and upper halves
    g.set(7, gr, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(7, gr + 1, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(8, gr, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
    g.set(8, gr + 1, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
    // Lanterns flanking the entrance at the lintel line
    for (const x of [6, 9]) {
      if (has(x, 0)) g.set(x, gr + 2, 0, "sea_lantern");
    }
  }
}

g.save(`${DIR}/DC86573.nbt`);
