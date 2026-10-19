// SEA1270141928 - Seattle Center park kiosk / restroom-and-concession pavilion.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "SEA1270141928";
const BOX = { x0: 151, z0: 254, W: 12, D: 8, heightBlocks: 4 };
const H = BOX.heightBlocks + 6;
const manifest = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const b = manifest.buildings.find((q) => q.id === ID);
if (!b) throw new Error("no building " + ID);

const F = new Set(b.footprint.map(([x, z]) => `${x - BOX.x0},${z - BOX.z0}`));
if (F.size !== 69) throw new Error("footprint size " + F.size);
const inF = (x, z) => F.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const cells = [...F].map((k) => k.split(",").map(Number));

// depth: 1 = edge cell (has a non-footprint 4-neighbour), growing inward
const depth = new Map();
let frontier = [];
for (const [x, z] of cells) {
  if (Object.values(DIRS).some(([dx, dz]) => !inF(x + dx, z + dz))) { depth.set(`${x},${z}`, 1); frontier.push([x, z]); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of Object.values(DIRS)) {
    const nx = x + dx, nz = z + dz, k = `${nx},${nz}`;
    if (inF(nx, nz) && !depth.has(k)) { depth.set(k, d + 1); next.push([nx, nz]); }
  }
  frontier = next;
}
const dep = (x, z) => depth.get(`${x},${z}`);
const outwardDirs = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inF(x + dx, z + dz)).map(([n]) => n);
const towardEdge = (x, z) => Object.entries(DIRS).find(([, [dx, dz]]) => inF(x + dx, z + dz) && dep(x + dx, z + dz) === dep(x, z) - 1)?.[0];

const g = new Voxels([BOX.W, H, BOX.D]);
const OPP = { north: "south", south: "north", east: "west", west: "east" };

// foundation: stone bricks, y0-1 under the whole footprint
for (const [x, z] of cells) { g.set(x, 0, z, "stone_bricks"); g.set(x, 1, z, "stone_bricks"); }

// roof body: depth>=2 full at y4; depth 2 step at y5 (stairs toward eave), depth>=3 full at y5
for (const [x, z] of cells) {
  const d = dep(x, z);
  if (d >= 2) g.set(x, 4, z, "deepslate_tiles");
  if (d === 2) {
    const f = towardEdge(x, z);
    if (f) g.set(x, 5, z, "deepslate_tile_stairs", { facing: f, half: "bottom", shape: "straight", waterlogged: "false" });
    else g.set(x, 5, z, "deepslate_tiles");
  } else if (d >= 3) g.set(x, 5, z, "deepslate_tiles");
}

// walls (depth 1): tan terracotta, light-grey band at y3, light-grey corner pilasters, stone-brick eaves at y4
const edges = cells.filter(([x, z]) => dep(x, z) === 1);
for (const [x, z] of edges) {
  const outs = outwardDirs(x, z);
  const corner = outs.length >= 2;
  g.set(x, 2, z, corner ? "light_gray_terracotta" : "terracotta");
  g.set(x, 3, z, "light_gray_terracotta");
  const f = outs[0];
  g.set(x, 4, z, "stone_brick_stairs", { facing: f, half: "bottom", shape: "straight", waterlogged: "false" });
}

// doors: one on the north edge, one on the south edge (dark oak), each in the middle of its run
function doorOn(dir) {
  const run = edges.filter(([x, z]) => outwardDirs(x, z).includes(dir)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (!run.length) throw new Error("no " + dir + " edge");
  const [x, z] = run[Math.floor(run.length / 2)];
  const s = { facing: dir, hinge: "left", open: "false", powered: "false" };
  g.set(x, 2, z, "dark_oak_door", { ...s, half: "lower" });
  g.set(x, 3, z, "dark_oak_door", { ...s, half: "upper" });
  return [x, z];
}
const doorN = doorOn("north");
const doorS = doorOn("south");

// service window on the east edge: 3 consecutive east-facing edge cells, counter at y2, open y3, striped awning at y4
const eastRun = edges.filter(([x, z]) => outwardDirs(x, z).includes("east"));
let win = null;
for (const [x, z] of eastRun) {
  const trio = [[x, z - 1], [x, z], [x, z + 1]];
  if (trio.every(([tx, tz]) => eastRun.some(([ex, ez]) => ex === tx && ez === tz))) { win = trio; break; }
}
if (!win) throw new Error("no east window run");
const stripe = ["red_wool", "white_wool", "red_wool"];
win.forEach(([x, z], i) => {
  g.set(x, 2, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  g.set(x, 3, z, "air");
  g.set(x, 4, z, stripe[i]);
});

// chimney vent: depth>=3 cell near the middle-back; brick flue to y7, slab cap at y8
const flueCands = cells.filter(([x, z]) => dep(x, z) >= 3);
const [cx, cz] = flueCands.sort((a, b) => (Math.abs(a[0] - 6) + a[1]) - (Math.abs(b[0] - 6) + b[1]))[0];
g.set(cx, 6, cz, "bricks");
g.set(cx, 7, cz, "bricks");
g.set(cx, 8, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

g.save(`/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/${ID}.nbt`);
console.log(JSON.stringify({ id: ID, size: [BOX.W, H, BOX.D], footprint: F.size, edges: edges.length, doorN, doorS, window: win, chimney: [cx, cz] }));
