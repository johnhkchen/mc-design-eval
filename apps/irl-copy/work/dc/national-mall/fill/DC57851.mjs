// 75 C Street SE, Washington DC 20515 (Commercial-Office-Large): the Rayburn House Office Building on the Capitol's south
// side. Read from the lidar record: a 17-block central body with 15-block wings and 13-block inner rings, a 4-6 block
// podium at the south and east edges, a courtyard in the middle, and the footprint's hollows open to the sky. Era and
// materials: a mid-century limestone office, cream calcite walls between tinted glass, polished-andesite spandrel bands
// on every storey line, smooth-quartz cornice, a grey roof deck and a light penthouse box on the central body.
// Storeys are 3 blocks on absolute lines (y % 3 == 0 is the spandrel), so every floor line runs straight across the
// facade. Lidar roofs are median-smoothed over 3x3 and snapped to flat tiers. Every block is built from the layers below:
// foundation to each cell's ground, then the body to its tier; behind each glass band is one air cell with a slab above
// and below, and a few of those cells hold glowstone. Double doors sit on the north face of the forecourt notch, the main entrance.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57851.cells.json`, "utf8"));
const W = 97, D = 59, H = 20;

const key = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inF = (x, z) => cell.has(key(x, z));
const G = (x, z) => cell.get(key(x, z)).g;

// Lidar roof per cell: median of its 3x3 footprint neighbours, then snapped to flat tiers (podium 4, low 6, 13, 15, 17).
const median = (v) => { v = [...v].sort((a, b) => a - b); return v[v.length >> 1]; };
const snap = (r) => (r <= 4 ? 4 : r <= 6 ? 6 : r <= 13 ? 13 : r <= 15 ? 15 : 17);
const T = new Map();
for (const [k, { g, r }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) v.push(cell.get(key(x + dx, z + dz)).r);
  T.set(k, Math.max(snap(median(v)), g + 1));
}
const top = (x, z) => T.get(key(x, z));

// Penthouse: a 9 x 7 mechanical box on the deepest part of the central 17-block body, two blocks higher.
const dist = new Map();
const queue = [];
for (const k of T.keys()) if (T.get(k) !== 17) { dist.set(k, 0); queue.push(k); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i].split(",").map(Number);
  for (const [dx, dz] of DIRS) {
    const n = key(x + dx, z + dz);
    if (inF(x + dx, z + dz) && !dist.has(n)) { dist.set(n, dist.get(queue[i]) + 1); queue.push(n); }
  }
}
let [cx, cz, best] = [0, 0, -1];
for (const k of T.keys()) if (T.get(k) === 17 && dist.get(k) > best) { best = dist.get(k); [cx, cz] = k.split(",").map(Number); }
const mech = new Set();
for (const k of T.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (T.get(k) === 17 && Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 3) { mech.add(k); T.set(k, 19); }
}

// Outside air at (x, y, z): no footprint cell there, or the neighbour's column has ended below y.
const outsideAt = (x, y, z) => !inF(x, z) || y >= top(x, z);

// Classify every block of every column: foundation, base course, cornice, roof deck, core, spandrel, pier, glass, mech wall.
const cls = new Map();
const K3 = (x, y, z) => `${x},${y},${z}`;
for (const [k, { g }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    if (y < g) { cls.set(K3(x, y, z), { k: "found" }); continue; }
    const ex = DIRS.filter(([dx, dz]) => outsideAt(x + dx, y, z + dz));
    if (!ex.length) { cls.set(K3(x, y, z), { k: y === t - 1 ? "roof" : "core" }); continue; }
    ex.sort((a, b) => (inF(x + a[0], z + a[1]) ? 1 : 0) - (inF(x + b[0], z + b[1]) ? 1 : 0));
    const [dx, dz] = ex[0];
    const along = dx !== 0 ? z : x;
    const isMech = mech.has(k);
    if (y === t - 1) { cls.set(K3(x, y, z), { k: "cornice" }); continue; }
    const stepFoot = ex.some(([ax, az]) => inF(x + ax, z + az) && y === top(x + ax, z + az));
    if (y === g || stepFoot) { cls.set(K3(x, y, z), { k: "base" }); continue; }
    if (isMech) { cls.set(K3(x, y, z), { k: "mechwall" }); continue; }
    if (y % 3 === 0) { cls.set(K3(x, y, z), { k: "spandrel" }); continue; }
    if (along % 3 === 0) { cls.set(K3(x, y, z), { k: "pier" }); continue; }
    cls.set(K3(x, y, z), { k: "glass", dx, dz });
  }
}

// Air gap behind each glass band: the next cell in, on the same row, between the glass and the core. A few hold glowstone.
for (const [id, c] of [...cls]) {
  if (c.k !== "glass") continue;
  const [x, y, z] = id.split(",").map(Number);
  const ix = x - c.dx, iz = z - c.dz;
  const inner = cls.get(K3(ix, y, iz));
  if (!inner || inner.k !== "core") continue;
  const along = c.dx !== 0 ? z : x;
  cls.set(K3(ix, y, iz), { k: along % 6 === 1 && y % 3 === 2 ? "lamp" : "pocket" });
}

// Air reachable from outside the footprint's box: the courtyard is not part of it.
const outer = new Set(["-1,-1"]);
const open = ["-1,-1"];
for (let i = 0; i < open.length; i++) {
  const [x, z] = open[i].split(",").map(Number);
  for (const [dx, dz] of DIRS) {
    const n = key(x + dx, z + dz);
    if (x + dx < -1 || z + dz < -1 || x + dx > W || z + dz > D || inF(x + dx, z + dz) || outer.has(n)) continue;
    outer.add(n); open.push(n);
  }
}

// Main entrance: a pair of double doors in the middle of an outer face with the most storeys, bottom two rows at ground + 1.
const candidates = [];
for (const [k, { g }] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (const [dx, dz] of DIRS) {
    if (inF(x + dx, z + dz) || !outer.has(key(x + dx, z + dz)) || top(x, z) - g < 5) continue;
    candidates.push({ x, z, g, dx, dz, score: Math.abs(x - 48) + Math.abs(z - 29) });
  }
}
let door = null;
for (const a of candidates) {
  const b = candidates.find((c) => c.dx === a.dx && c.dz === a.dz && c.g === a.g && c.x === a.x + (a.dz !== 0 ? 1 : 0) && c.z === a.z + (a.dx !== 0 ? 1 : 0));
  if (!b) continue;
  const score = a.score + b.score;
  if (!door || score < door.score) door = { a, b, score };
}
if (door) {
  const { a, b } = door;
  const facing = DIR_NAME[`${a.dx},${a.dz}`];
  for (const [c, hinge] of [[a, "left"], [b, "right"]]) for (const half of ["lower", "upper"]) {
    cls.set(K3(c.x, c.g + (half === "lower" ? 1 : 2), c.z), { k: "door", facing, half, hinge });
  }
  console.log(`door: ${facing} face, cells (${a.x},${a.z}) (${b.x},${b.z}), ground ${a.g}`);
}

// Blocks.
const g = new Voxels([W, H, D]);
const BLOCK = {
  found: "stone_bricks", base: "stone_bricks", cornice: "smooth_quartz", roof: "stone", core: "stone",
  spandrel: "polished_andesite", pier: "calcite", glass: "light_blue_stained_glass", lamp: "glowstone",
  mechwall: "light_gray_concrete",
};
const counts = {};
for (const [id, c] of cls) {
  const [x, y, z] = id.split(",").map(Number);
  if (c.k === "pocket") continue;
  counts[c.k] = (counts[c.k] || 0) + 1;
  if (c.k === "door") g.set(x, y, z, "dark_oak_door", { facing: c.facing, half: c.half, hinge: c.hinge, open: "false", powered: "false" });
  else g.set(x, y, z, BLOCK[c.k]);
}
console.log("blocks by class", counts, "tiers", [...new Set(T.values())].sort((a, b) => a - b));

const out = g.save(`${DIR}/DC57851.nbt`);
console.log(out);
