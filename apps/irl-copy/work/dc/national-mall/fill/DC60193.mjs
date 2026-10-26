import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC60193 - 1300 I St NW, Washington DC. Commercial-Office-Large.
// 1980s Federal-era speculative office: red brick piers, stone base,
// quartz storey lines, blue-tinted glazing, lobby on the I Street (north) face.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC60193";
const W = 39, H = 33, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, ground, roof] of cells) info.set(key(x, z), { ground, roof });
const has = (x, z) => info.has(key(x, z));
const isPerim = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
const isColumn = (x, z) => !isPerim(x, z) && x % 6 === 3 && z % 5 === 2;
const inPent = (x, z) => !isPerim(x, z) && x >= 13 && x <= 21 && z >= 6 && z <= 12;

// Smooth lidar roofs over each cell's 3x3 neighbourhood, then quantise to 3-block storey tiers.
const plan = new Map();
for (const [k, { ground, roof }] of info) {
  const [x, z] = k.split(",").map(Number);
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const nb = info.get(key(x + dx, z + dz));
    if (nb) { s += nb.roof; n++; }
  }
  const avgRoof = s / n;
  const gr = Math.max(0, Math.min(H - 8, ground));
  let st = Math.max(1, Math.round((avgRoof - gr) / 3));
  while (gr + 3 * st > H - 4 && st > 1) st--;
  plan.set(k, { gr, st, capY: gr + 3 * st - 1 });
}

const glow = [];

for (const [k, { gr, st, capY }] of plan) {
  const [x, z] = k.split(",").map(Number);

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wd = !has(x - 1, z), E = !has(x + 1, z);
  const perim = N || S || Wd || E;

  if (!perim) {
    // Interior: air gap with a floor slab per storey; structural columns on a grid.
    for (let s = 0; s < st; s++) {
      const fy = gr + 3 * s;
      if (fy < capY) g.set(x, fy, z, "smooth_stone");
    }
    g.set(x, capY, z, "smooth_stone");
    if (isColumn(x, z)) {
      for (let y = gr; y < capY; y++) g.set(x, y, z, "polished_andesite");
    }
    // One solid rooftop penthouse block (mechanical room) with a parapet-height cap.
    if (inPent(x, z) && capY + 3 < H) {
      g.set(x, capY + 1, z, "light_gray_concrete");
      g.set(x, capY + 2, z, "light_gray_concrete");
      g.set(x, capY + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // Perimeter: brick piers, quartz storey lines, glazed bays, stone base course.
  const corner = (N || S) && (Wd || E);
  let idx = 0;
  if (!corner) idx = (N || S) ? x : z;
  const pier = corner || idx % 3 === 0;

  for (let y = gr; y < capY; y++) {
    const h = y - gr;
    let b;
    if (h === 0) b = "stone_bricks";
    else if (pier) b = "bricks";
    else if (h % 3 === 0) b = "quartz_block";
    else b = "light_blue_stained_glass_pane";
    g.set(x, y, z, b);

    if (!corner && !pier && h % 3 === 1 && (x * 5 + z * 3 + h) % 4 === 0) {
      let dx = 0, dz = 0;
      if (N) dz = 1; else if (S) dz = -1; else if (Wd) dx = 1; else if (E) dx = -1;
      const ix = x + dx, iz = z + dz;
      const pin = plan.get(key(ix, iz));
      if (pin && !isPerim(ix, iz) && !isColumn(ix, iz) && !inPent(ix, iz) &&
          y >= pin.gr && y < pin.capY && (y - pin.gr) % 3 !== 0) {
        glow.push([ix, y, iz]);
      }
    }
  }

  // Parapet cap and cornice line on the perimeter.
  g.set(x, capY, z, "quartz_block");
  if (capY - 1 > gr) g.set(x, capY - 1, z, "quartz_slab", { type: "top", waterlogged: "false" });
}

// Warm lights behind glass.
for (const [x, y, z] of glow) g.set(x, y, z, "glowstone");

// Lobby on the I Street (north) face: dark glazed bay, centre door, lantern inside.
const lobbyX = 19;
if (has(lobbyX, 0) && !has(lobbyX, -1)) {
  const p = plan.get(key(lobbyX, 0));
  for (const lx of [lobbyX - 1, lobbyX + 1]) {
    for (let y = p.gr; y <= p.gr + 2; y++) g.set(lx, y, 0, "gray_stained_glass_pane");
  }
  g.set(lobbyX, p.gr, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(lobbyX, p.gr + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(lobbyX, p.gr + 2, 0, "gray_stained_glass_pane");
  // Quartz lintel across the entrance bay.
  for (const lx of [lobbyX - 1, lobbyX, lobbyX + 1]) g.set(lx, p.gr + 3, 0, "quartz_block");
  // Lantern standing on the lobby floor just inside the door.
  if (has(lobbyX, 1) && !isColumn(lobbyX, 1)) {
    g.set(lobbyX, p.gr + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
