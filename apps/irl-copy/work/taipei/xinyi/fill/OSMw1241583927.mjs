import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1241583927";
const cells = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Per-cell ground, clamped so the parapet and penthouse stay inside the 23-high canvas.
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.max(0, Math.min(gr, 10)));
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

// Which sides of a cell face outside the footprint.
function sides(x, z) {
  const s = [];
  if (!has(x - 1, z)) s.push("west");
  if (!has(x + 1, z)) s.push("east");
  if (!has(x, z - 1)) s.push("north");
  if (!has(x, z + 1)) s.push("south");
  return s;
}

const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneNS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// Entrance: the north-facing facade cell nearest the middle of that run.
const northXs = [];
for (const [x, z] of cells) if (sides(x, z).includes("north")) northXs.push(x);
let door = null;
if (northXs.length) {
  const cx = northXs.reduce((a, b) => a + b, 0) / northXs.length;
  const dx = northXs.reduce((best, x) => (Math.abs(x - cx) < Math.abs(best - cx) ? x : best));
  door = { x: dx, z: Math.min(...cells.map(c => c[1])) };
}

for (const [x, z] of cells) {
  const gr = gnd(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const s = sides(x, z);
  if (s.length === 0) {
    // Interior: floor slabs and roof slab only, air between.
    g.set(x, gr, z, "smooth_stone");
    g.set(x, gr + 5, z, "smooth_stone");
    g.set(x, gr + 10, z, "smooth_stone");
    continue;
  }

  const face = s[0];
  const ew = face === "east" || face === "west";
  const along = ew ? z : x;
  const pier = s.length > 1 || along % 3 === 0;
  const pane = ew ? paneEW : paneNS;

  // Base course.
  g.set(x, gr, z, "polished_granite");

  // Ground storey: shopfront glass between white piers, lintel above.
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (pier) g.set(x, y, z, "white_concrete");
    else if (y === gr + 2 && along % 6 === 1) g.set(x, y, z, "glowstone");
    else g.set(x, y, z, "glass_pane", pane);
  }
  g.set(x, gr + 4, z, "light_gray_concrete");
  g.set(x, gr + 5, z, "light_gray_concrete");

  // Upper storey: window grid with piers.
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (pier) g.set(x, y, z, "white_concrete");
    else if (y === gr + 7 && along % 9 === 4) g.set(x, y, z, "glowstone");
    else g.set(x, y, z, "glass_pane", pane);
  }
  g.set(x, gr + 9, z, "light_gray_concrete");

  // Parapet and coping.
  g.set(x, gr + 10, z, "white_concrete");
  g.set(x, gr + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance door, set after the shopfront so it replaces a pier or pane.
if (door && has(door.x, door.z)) {
  const gr = gnd(door.x, door.z);
  g.set(door.x, gr + 1, door.z, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(door.x, gr + 2, door.z, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Rooftop penthouse ring with a steel water tank inside.
const inTank = (x, z) => x >= 9 && x <= 11 && z >= 8 && z <= 10;
for (let x = 7; x <= 13; x++) {
  for (let z = 6; z <= 12; z++) {
    if (!has(x, z)) continue;
    const gr = gnd(x, z);
    const ring = x === 7 || x === 13 || z === 6 || z === 12;
    if (ring) {
      g.set(x, gr + 11, z, "light_gray_concrete");
    }
    if (inTank(x, z)) {
      g.set(x, gr + 11, z, "iron_block");
      g.set(x, gr + 12, z, "iron_block");
    } else {
      g.set(x, gr + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${SRC}/${ID}.nbt`);
