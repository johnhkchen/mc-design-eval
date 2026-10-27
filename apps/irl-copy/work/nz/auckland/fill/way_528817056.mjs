// BDO Centre, Auckland (Queen Street end of the CBD). A late-1980s concrete office: a seven-storey shoulder with an
// eight-storey core, a stone base, pale concrete piers and spandrels, tinted glass in 2-wide bays with a 1-block air gap
// behind each pane, warm lights in some gaps, a lobby door on the street face, and a plant room on the core's roof.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_528817056.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..38, z 0..75
const g = new Voxels([39, 49, 76]);

const key = (x, z) => x + "," + z;
const F = new Map();                                   // footprint cell -> { ground, raw roof }
for (const [x, z, ground, roof] of cells) F.set(key(x, z), { ground, roof });
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];       // east, west, south, north (+z is south)

// Two tiers from the lidar: the shoulder (roof 31-33) and the core (34-36), with the core smoothed to a clean block
// (a cell is core when most of its 3x3 neighbourhood reads 34+). Roof tops are the parapet heights: 32 and 36.
const rawCore = (x, z) => F.get(key(x, z))?.roof >= 34;
const smooth = new Set();
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  let n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (rawCore(x + dx, z + dz)) n++;
  if (n >= 5) smooth.add(k);
}
// Keep the one main core: the lidar's stray high cells on the wings would otherwise stand up as lone towers.
const seen = new Set(); let main = [];
for (const k of smooth) {
  if (seen.has(k)) continue;
  const part = [], stack = [k]; seen.add(k);
  while (stack.length) {
    const cur = stack.pop(); part.push(cur);
    const [x, z] = cur.split(",").map(Number);
    for (const [dx, dz] of DIRS) { const nk = key(x + dx, z + dz); if (smooth.has(nk) && !seen.has(nk)) { seen.add(nk); stack.push(nk); } }
  }
  if (part.length > main.length) main = part;
}
const mainCore = new Set(main);
const top = new Map();
for (const [k] of F) top.set(k, mainCore.has(k) ? 36 : 32);
const T = (x, z) => top.get(key(x, z));

// Per cell: the directions it is exposed to (outside the footprint, or a lower tier next to it) and the height it is
// exposed from (0 on the outside, the lower tier's top on a setback).
const info = new Map();
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number), t = T(x, z);
  const out = [], low = [];
  for (const [dx, dz] of DIRS) {
    if (!F.has(key(x + dx, z + dz))) out.push([dx, dz]);
    else if (T(x + dx, z + dz) < t) low.push([dx, dz, T(x + dx, z + dz)]);
  }
  const exposed = out.length ? out : low.map(([dx, dz]) => [dx, dz]);
  const from = out.length ? 0 : Math.min(...low.map((l) => l[2]));
  info.set(k, { t, exposed, from, wall: exposed.length > 0 });
}
const isWall = (x, z) => info.get(key(x, z))?.wall;

// Solid massing: a stone base to y 2 (the plinth, which also covers every foundation up to the lidar ground, 0-3), then
// solid concrete up to the roof, with the walls and windows cut into it below. The roof is a membrane one block under
// the parapet; the parapet is the lidar's height.
const pane = [];                                         // glass pane positions with their inward direction
const pierAt = (x, z, dirs) => (dirs.length > 1 ? true : dirs[0][0] !== 0 ? z % 3 === 0 : x % 3 === 0);
for (const [k, c] of info) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.t; y++) g.set(x, y, z, y < 3 ? "stone_bricks" : "light_gray_concrete");
  g.set(x, c.t - 1, z, "gray_concrete");                 // roof membrane
  if (!c.wall) continue;
  g.set(x, c.t, z, "white_concrete");                    // parapet / coping
  for (let y = 3; y < c.t - 1; y++) {
    const r = (y - 3) % 4;                               // 0 spandrel, 1-2 window bay, 3 head band
    if (r === 3 && y >= c.from) g.set(x, y, z, "white_concrete");
    if ((r === 1 || r === 2) && y >= c.from) {
      if (pierAt(x, z, c.exposed)) g.set(x, y, z, "white_concrete");
      else { g.set(x, y, z, "light_blue_stained_glass_pane"); pane.push({ x, y, z, dir: c.exposed[0] }); }
    }
  }
}

// Each glass bay gets a one-block air gap behind it; glowstone and lanterns in some of those gaps.
pane.forEach((p, i) => {
  const [dx, dz] = p.dir, ix = p.x - dx, iz = p.z - dz;
  if (!isWall(ix, iz) && F.has(key(ix, iz))) {
    g.set(ix, p.y, iz, "air");
    if (i % 9 === 0) g.set(ix, p.y, iz, "glowstone");
    if (i % 9 === 5) g.set(ix, p.y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
});

// Lobby: the street-face door is the wall cell with the highest ground on the north face (near the middle of it).
let door = null;
for (const [k, c] of info) {
  const [x, z] = k.split(",").map(Number);
  if (!c.exposed.some(([dx, dz]) => dx === 0 && dz === -1) || c.from > 0 || c.t !== 32) continue;
  const score = F.get(k).ground * 100 - Math.abs(x - 19);
  if (!door || score > door.score) door = { x, z, score };
}
if (door) {
  const { x, z } = door;
  g.set(x, 3, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 4, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, 5, z, "white_concrete");
  g.set(x, 3, z + 1, "air"); g.set(x, 4, z + 1, "air");
  g.set(x, 3, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
  g.set(x, 4, z + 1, "air");
}

// Plant room and a short mast on the core's roof.
for (const [k, c] of info) {
  const [x, z] = k.split(",").map(Number);
  if (c.t === 36 && x >= 16 && x <= 23 && z >= 27 && z <= 33) { g.set(x, 36, z, "light_gray_concrete"); g.set(x, 37, z, "light_gray_concrete"); }
}
for (let y = 38; y <= 41; y++) g.set(19, y, 30, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// Glass panes take their connections from what they touch: a pane, a full block, or open air.
const SIDES = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];
for (const p of pane) {
  if (g.get(p.x, p.y, p.z)?.block !== "minecraft:light_blue_stained_glass_pane") continue;
  const st = { waterlogged: "false" };
  for (const [name, dx, dz] of SIDES) st[name] = g.get(p.x + dx, p.y, p.z + dz) ? "true" : "false";
  g.set(p.x, p.y, p.z, "light_blue_stained_glass_pane", st);
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_528817056.nbt");
console.log(JSON.stringify({ footprint: F.size, core: [...top.values()].filter((t) => t === 36).length, panes: pane.length, door, ...out }));
