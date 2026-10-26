// DC66629: a 1920s Beaux-Arts office block on the Mall's edge, Portland-stone clad. A 13 x 7 footprint open to the north
// (a light court) with a 14-block tower on the east corner, a 9-block podium stepping down to a 7-block central bar and
// a 5-block back wing. Solid massing with a one-block skin: windows are glass in the skin with an air pocket behind,
// and some pockets hold a warm light. Built only on the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC66629.cells.json`, "utf8"));

const K = (x, y, z) => `${x},${y},${z}`;
const FOOT = new Set(cells.map(([x, z]) => `${x},${z}`));
const inF = (x, z) => FOOT.has(`${x},${z}`);

// The lidar roof (y 0 up) smoothed into flat tiers: the body is 6 (the back wing 5, the central bar 7), the east podium 9,
// the tower corner 14, a 11 step on the tower's north cell.
function tier(x, z) {
  if (z === 0) return { 1: 6, 11: 11, 12: 9 }[x];
  if (z <= 2) {
    if (x === 0) return 7;
    if (x <= 9) return 6;
    if (x === 10) return 9;
    return z === 1 ? 14 : 9;
  }
  if (z <= 4) return 7;
  if (z === 5) return x >= 1 && x <= 9 ? 6 : 7;
  return x >= 1 && x <= 9 ? 5 : x === 11 ? 9 : 7;
}
const R = (x, z) => (inF(x, z) ? tier(x, z) : 0);
const solid = (x, y, z) => y >= 0 && y < R(x, z);

const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "east", dx: 1, dz: 0 }, { name: "west", dx: -1, dz: 0 },
];
// string courses (storey lines); y 0 is the base, the top course is the cornice
const STRINGS = new Set([3, 6, 9]);

const B = new Map();                    // "x,y,z" -> { block, state }, or null for an air pocket
const put = (x, y, z, block, state) => B.set(K(x, y, z), { block, state });
const pockets = [];

for (const key of FOOT) {
  const [x, z] = key.split(",").map(Number);
  const top = R(x, z);
  for (let y = 0; y < top; y++) {
    const ex = DIRS.filter((d) => !solid(x + d.dx, y, z + d.dz));
    const isTop = y === top - 1;
    if (!ex.length) { put(x, y, z, isTop ? "smooth_stone" : "calcite"); continue; }   // mass; the top is the roof
    if (isTop || ex.length >= 2) { put(x, y, z, "smooth_quartz"); continue; }        // cornice and quoins
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                          // base course
    if (STRINGS.has(y)) { put(x, y, z, "smooth_quartz"); continue; }                  // storey line
    const d = ex[0];
    const u = d.dz ? x : z;                                                           // position along the facade
    if (d.name === "north" && x === 6 && z === 1 && y <= 2) {                         // the entrance, centred on the court
      put(x, y, z, "iron_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (u % 2 === 0) {                                                                // a window: glass, air behind it
      // panes join along the facade: east-west on a north/south wall, north-south on an east/west one
      const pane = d.dz
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, "glass_pane", pane);
      pockets.push([x - d.dx, y, z - d.dz, x + y + z]);
    } else put(x, y, z, "calcite");                                                   // pier between windows
  }
}

// Air behind each window, except a warm light in some of them (a glowing block in the pocket, enclosed by the solid).
for (const [x, y, z, n] of pockets) {
  if (!solid(x, y, z)) continue;
  if (n % 5 === 0) put(x, y, z, y <= 2 ? "glowstone" : "shroomlight");
  else B.set(K(x, y, z), null);
}

// Roof: a copper cap on the tower with a lantern, and a stone plant box on the central bar.
put(11, 14, 1, "oxidized_cut_copper_slab", { type: "bottom", waterlogged: "false" });
put(12, 14, 1, "oxidized_cut_copper_slab", { type: "bottom", waterlogged: "false" });
put(11, 15, 1, "lantern", { hanging: "false", waterlogged: "false" });
for (const [x, z] of [[6, 3], [7, 3], [6, 4], [7, 4]]) {
  put(x, 7, z, "stone_bricks");
  put(x, 8, z, "stone_bricks");
  put(x, 9, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Check: nothing hangs. Every block must be face-connected to the ground through blocks (a storey slab over a window
// gap is held by the solid mass beside it, so a block-under test would wrongly flag it).
const seen = new Set(), stack = [];
for (const [k, v] of B) if (v && k.split(",")[1] === "0") stack.push(k);
while (stack.length) {
  const k = stack.pop(); if (seen.has(k)) continue; seen.add(k);
  const [x, y, z] = k.split(",").map(Number);
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const n = K(x + dx, y + dy, z + dz), v = B.get(n);
    if (v && !seen.has(n)) stack.push(n);
  }
}
const hanging = [...B].filter(([k, v]) => v && !seen.has(k)).length;
if (hanging) throw new Error(`${hanging} blocks are not attached to the ground`);

const g = new Voxels([13, 26, 7]);
for (const [k, v] of B) {
  if (!v) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${DIR}/DC66629.nbt`);
console.log(`DC66629.nbt: ${out.blocks} blocks, palette ${out.palette}`);
