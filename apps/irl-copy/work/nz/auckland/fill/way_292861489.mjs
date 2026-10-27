// Vulcan Building, Auckland CBD: an interwar commercial block. Plastered brick (quartz render), stone belts and
// cornice, timber and glass shopfronts on the flat street frontage, six storeys on the lidar's 24-block shoulder,
// stepped down to 20 and 16 on the wings, and a seven-storey core on the lidar's 30-block tower.
// Storeys are 4 blocks: a belt course at each storey line (y = 4k), 1 sill, 2 glass, the belt above. Walls are one
// block thick with an air gap behind the glass and a floor slab per storey; every wall stands on the cell below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_292861489.cells.json", "utf8"));

// lidar roof heights smoothed into flat tiers (12 / 16 / 20 / 24 / 30 blocks, i.e. 3, 4, 5, 6 and 7-storey)
const tier = (r) => (r >= 29 ? 30 : r >= 24 ? 24 : r >= 20 ? 20 : r >= 15 ? 16 : 12);
const key = (x, z) => x + "," + z;
const col = new Map();
for (const [x, z, gr, roof] of cells) col.set(key(x, z), { x, z, gr, R: tier(roof) });
const at = (x, z) => col.get(key(x, z));

const g = new Voxels([33, 43, 30]);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const FOUND = "polished_andesite";
const FLOOR = "smooth_stone";
const CAP = "smooth_stone";

// The faces of cell (x, y, z) that show: "street" = off the footprint, "setback" = the neighbour's roof is below y.
function exposures(x, y, z) {
  const c = at(x, z);
  if (!c || y < c.gr || y >= c.R) return [];
  const out = [];
  for (const [dir, [dx, dz]] of Object.entries(DIRS)) {
    const n = at(x + dx, z + dz);
    if (!n) out.push({ dir, kind: "street" });
    else if (y >= n.R) out.push({ dir, kind: "setback" });
  }
  return out;
}
const has = (x, y, z, dir) => exposures(x, y, z).some((e) => e.dir === dir);

// Entrance: the street face with the most flat-ground frontage, door at its middle cell.
const frontage = {};
for (const c of col.values()) {
  if (c.gr !== 0) continue;
  for (const e of exposures(c.x, 1, c.z)) if (e.kind === "street") (frontage[e.dir] ??= []).push(c);
}
let door = null;
const bestDir = Object.entries(frontage).sort((a, b) => b[1].length - a[1].length)[0];
if (bestDir) {
  const [dir, list] = bestDir;
  const along = dir === "north" || dir === "south" ? "x" : "z";
  list.sort((p, q) => p[along] - q[along]);
  const mid = list[Math.floor(list.length / 2)];
  door = { x: mid.x, z: mid.z, dir };
}

const panes = [];   // glass panes, joined to their neighbours afterwards
const windows = []; // lit-able windows: { x, y, z, dir }

function wallBlock(x, y, z, ex, c) {
  const e = ex.find((f) => f.kind === "street") ?? ex[0];
  const street = e.kind === "street";
  const k = Math.floor(y / 4), r = y % 4;   // storey k, height r within it

  // entrance: a door in the middle of the street frontage, a timber hood over it
  if (door && door.x === x && door.z === z && ex.some((f) => f.dir === door.dir) && y <= 3) {
    if (y === 3) return g.set(x, y, z, "dark_oak_stairs", { facing: door.dir, half: "top", shape: "straight", waterlogged: "false" });
    return g.set(x, y, z, "dark_oak_door", { facing: door.dir, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  }

  if (y === c.R - 1) return g.set(x, y, z, "stone_bricks");   // cornice band under the roof cap

  // bays along the face: piers every 4th cell and at corners, windows in the two between, plaster in the last one
  const along = e.dir === "north" || e.dir === "south" ? [1, 0] : [0, 1];
  const a = along[0] * x + along[1] * z;
  const m = a % 4;
  const corner = !has(x - along[0], y, z - along[1], e.dir) || !has(x + along[0], y, z + along[1], e.dir);
  const pier = corner || m === 0;
  const ground = k === 0 && street;

  if (r === 0) return g.set(x, y, z, ground ? "polished_andesite" : "stone_bricks");   // base course / storey belt
  if (ground && r === 3) return g.set(x, y, z, "stone_bricks");                       // shopfront transom
  if (pier) return g.set(x, y, z, "chiseled_quartz_block");
  if (m === 3) return g.set(x, y, z, "quartz_block");
  if (r === 1 && !ground) return g.set(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" });   // sill
  panes.push({ x, y, z });
  if (r === 2) windows.push({ x, y, z, dir: e.dir });
  return g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
}

// the setback ceiling: a cell beside a lower roof has a slab at that roof's level so the taller wall above is supported
const ceilingOver = (c, y) => Object.values(DIRS).some(([dx, dz]) => {
  const n = at(c.x + dx, c.z + dz);
  return n && n.R < c.R && n.R - 1 === y && y >= c.gr;
});

for (const c of col.values()) {
  const { x, z } = c;
  for (let y = 0; y < c.gr; y++) g.set(x, y, z, FOUND);
  for (let y = c.gr; y < c.R; y++) {
    const ex = exposures(x, y, z);
    if (ex.length) wallBlock(x, y, z, ex, c);
    else if (y === c.R - 1) g.set(x, y, z, CAP);
    else if (y % 4 === 0) g.set(x, y, z, FLOOR);
    else if (ceilingOver(c, y)) g.set(x, y, z, CAP);
  }
}

// cornice and parapet on every wall top
for (const c of col.values()) {
  const ex = exposures(c.x, c.R - 1, c.z);
  if (!ex.length) continue;
  const e = ex.find((f) => f.kind === "street") ?? ex[0];
  g.set(c.x, c.R, c.z, "stone_brick_stairs", { facing: e.dir, half: "bottom", shape: "straight", waterlogged: "false" });
  g.set(c.x, c.R + 1, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// roof plant: two 2x2 units on the six-storey roof, set well in from the walls
const roofSq = (x, z) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => {
  const c = at(x + dx, z + dz);
  return c && c.R === 24 && exposures(x + dx, 23, z + dz).length === 0;
});
const plant = [];
for (const c of col.values()) {
  if (plant.length === 2) break;
  if (!roofSq(c.x, c.z) || plant.some((p) => Math.abs(p.x - c.x) < 6 && Math.abs(p.z - c.z) < 6)) continue;
  plant.push({ x: c.x, z: c.z });
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    g.set(c.x + dx, 24, c.z + dz, "light_gray_concrete");
    g.set(c.x + dx, 25, c.z + dz, "iron_block");
  }
}

// lightning rod on the tower's roof, over the core's centre
const tower = [...col.values()].filter((c) => c.R === 30);
if (tower.length) {
  const mx = tower.reduce((s, c) => s + c.x, 0) / tower.length, mz = tower.reduce((s, c) => s + c.z, 0) / tower.length;
  const t = tower.reduce((b, c) => (Math.hypot(c.x - mx, c.z - mz) < Math.hypot(b.x - mx, b.z - mz) ? c : b));
  g.set(t.x, 30, t.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// warm light behind about one window in five: glowstone on the room side of the glass
const lit = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
for (const w of windows) {
  if (lit(w.x, w.y, w.z) % 5 !== 0) continue;
  const [dx, dz] = DIRS[w.dir];
  const ix = w.x - dx, iz = w.z - dz;
  if (!at(ix, iz) || exposures(ix, w.y, iz).length) continue;
  g.set(ix, w.y, iz, "glowstone");
}

// glass panes join the panes and the solid wall beside them
const SOLID = (name) => !/(_stairs|_slab|_door|_pane|lightning_rod|lantern|air)$/.test(name);
for (const p of panes) {
  const st = {};
  for (const [dir, [dx, dz]] of Object.entries(DIRS)) {
    const n = g.get(p.x + dx, p.y, p.z + dz);
    st[dir] = n && (n.block === "minecraft:glass_pane" || SOLID(n.block)) ? "true" : "false";
  }
  g.set(p.x, p.y, p.z, "glass_pane", { ...st, waterlogged: "false" });
}

const out = DIR + "way_292861489.nbt";
const { blocks, palette } = g.save(out);
console.log(`Vulcan Building: ${cells.length} footprint cells, ${blocks} blocks, ${palette} palette entries, ${panes.length} panes, door ${JSON.stringify(door)} -> ${out}`);
