// Wilson Parking, Auckland CBD edge (way 401588404). A 1970s-80s cast-in-place concrete car park with a glazed
// office tower at its NW corner. Massing follows the lidar roof per cell, median-smoothed into flat tiers; each tier
// is a solid column from y 0 up (foundation fill below the ground). The facade is a window grid of glass panes in
// concrete frames, with a base course, storey slab lines, a transom under each band, a cornice, shopfront entrances
// with canopies, and warm lamps in some windows. Each window's glass has a one-block air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_401588404.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 68, D = 70, H = 51;

const raw = new Map();
for (const [x, z, g, r] of cells) raw.set(`${x},${z}`, { g, r });
const inside = (x, z) => raw.has(`${x},${z}`);

// lidar noise: median of the roof over the 3x3 footprint neighbourhood, then flat tiers (top = roof height in blocks)
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const tierTop = (m) => (m <= 11 ? 11 : m <= 13 ? 13 : m <= 19 ? 17 : m <= 24 ? 25 : m <= 30 ? 29 : 38);
const FACES = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // east, west, south, north (+z is south)
const FACE_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// tiers: each cell takes the most common tier of its 5x5 footprint neighbourhood, so tiers are contiguous blocks
// rather than one-cell spikes; the lidar's 31+ block tower line is widened by one cell into a 3-cell-wide core
const near = (x, z, r) => { const out = []; for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (inside(x + dx, z + dz)) out.push([x + dx, z + dz]); return out; };
const t0 = new Map();
for (const [x, z] of [...raw.keys()].map((k) => k.split(",").map(Number))) t0.set(`${x},${z}`, tierTop(median(near(x, z, 1).map(([a, b]) => raw.get(`${a},${b}`).r))));
const towerCore = new Set();
for (const [k, c] of raw) if (c.r >= 31) for (const [a, b] of near(...k.split(",").map(Number), 1)) towerCore.add(`${a},${b}`);
const modeTier = (x, z) => {
  const n = new Map();
  for (const [a, b] of near(x, z, 2)) { const t = towerCore.has(`${a},${b}`) ? 38 : t0.get(`${a},${b}`); n.set(t, (n.get(t) || 0) + 1); }
  return [...n].sort((p, q) => q[1] - p[1] || p[0] - q[0])[0][0];
};

const cols = [];
for (const [x, z, g] of cells) {
  const T = towerCore.has(`${x},${z}`) ? 38 : modeTier(x, z);
  const face = FACES.find(([dx, dz]) => !inside(x + dx, z + dz)) ?? null;   // outward normal of a boundary cell
  cols.push({ x, z, g: Math.min(g, T - 1), T, face, tower: T === 38 });
}
const colAt = new Map(cols.map((c) => [`${c.x},${c.z}`, c]));

const v = new Voxels([W, H, D]);

// 1. solid columns: foundation fill below the ground, then the envelope and frame
for (const c of cols) {
  const { x, z, g, T, face } = c, cap = T - 1;
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone");
  for (let y = g; y < T; y++) {
    let b = "white_concrete", s;
    if (face) {
      const [dx, dz] = face, along = dx ? z : x;
      if (y === g) b = "polished_andesite";                                  // base course
      else if (y === cap) b = "smooth_stone";                                 // coping
      else if (y % 4 === 0 || y % 4 === 3) b = "light_gray_concrete";         // storey slab line, transom
      else if (along % 3 === 0) b = "light_gray_concrete";                    // mullion
      else {
        b = c.tower ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
        const ns = dx !== 0;   // a pane on an east/west face joins its neighbours north and south
        s = { north: String(ns), south: String(ns), east: String(!ns), west: String(!ns), waterlogged: "false" };
      }
    }
    v.set(x, y, z, b, s);
  }
}

// 2. carve each window's air gap behind the glass, add warm lamps in some, and cut the entrances
const isGlass = (c, y) => c.face && y > c.g && y < c.T - 1 && y % 4 !== 0 && y % 4 !== 3 &&
  (c.face[0] ? c.z : c.x) % 3 !== 0;
for (const c of cols) {
  if (!c.face) continue;
  const [dx, dz] = c.face, along = dx ? c.z : c.x;
  const qx = c.x - dx, qz = c.z - dz;
  const q = colAt.get(`${qx},${qz}`);
  for (let y = c.g; y < c.T - 1; y++) {
    if (!isGlass(c, y) || !q || q.face || y >= q.T || y < q.g) continue;   // only inside a solid, non-wall cell
    const lamp = (c.x * 7 + c.z * 13 + y * 5) % 17;
    if (lamp === 0) v.set(qx, y, qz, (c.x + c.z) % 2 ? "glowstone" : "shroomlight");
    else v.set(qx, y, qz, "air");
  }
  // entrances on the low frontage: a 2-high glazed door, a recess behind it, and a canopy at the lintel
  if (c.g <= 1 && along % 12 === 6 && q && !q.face && c.T <= 17) {
    const facing = FACE_NAME[`${dx},${dz}`];
    for (const [y, half] of [[c.g + 1, "lower"], [c.g + 2, "upper"]]) {
      v.set(c.x, y, c.z, "oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      v.set(qx, y, qz, "air");
    }
    for (let k = 1; k <= 2; k++) for (let lat = -1; lat <= 1; lat++) {
      const ax = c.x + dx * k + (dx ? 0 : lat), az = c.z + dz * k + (dz ? 0 : lat);
      if (!inside(ax, az)) v.set(ax, c.g + 3, az, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // cornice: a lip on the outward side of each facade cell's coping
  const ox = c.x + dx, oz = c.z + dz;
  if (!inside(ox, oz)) v.set(ox, c.T - 1, oz, "smooth_stone_slab", { type: "top", waterlogged: "false" });
}

// 3. roof plant: packaged air units on the low and mid tiers, a tower plant room with lamps on the top
for (const c of cols) {
  if (c.face) continue;
  const interior = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => inside(c.x + dx, c.z + dz));
  if (!interior) continue;
  if (!c.tower && c.x % 9 >= 3 && c.x % 9 <= 4 && c.z % 9 >= 3 && c.z % 9 <= 4) v.set(c.x, c.T, c.z, "gray_concrete");
  if (c.tower && c.x % 6 >= 2 && c.x % 6 <= 3 && c.z % 6 >= 2 && c.z % 6 <= 3) {
    v.set(c.x, c.T, c.z, "stone_bricks");
    v.set(c.x, c.T + 1, c.z, c.x % 6 === 2 && c.z % 6 === 2 ? "lantern" : "stone_brick_slab", { hanging: "false", type: "bottom", waterlogged: "false" });
  }
}

const info = v.save(`${DIR}/way_401588404.nbt`);
const tiers = {};
for (const c of cols) tiers[c.T] = (tiers[c.T] || 0) + 1;
console.log(JSON.stringify({ blocks: info.blocks, palette: info.palette, tiers, boundary: cols.filter((c) => c.face).length }));
