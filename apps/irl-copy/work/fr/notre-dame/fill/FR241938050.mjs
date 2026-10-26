// FR241938050: a residential block, built 1700, seven storeys on a 20 x 18 footprint. Walls are cream limestone render
// over a rubble base course, storeys are four blocks (the lidar roof is 28 above the lowest ground), windows are glass
// panes in calcite piers with a timber lintel, the top storey is capped by a slate roof and a stone cornice. The
// massing is the lidar roof median-smoothed over each cell's 3 x 3 neighbourhood and quantised to storey heights, so
// the setbacks land on the storey lines and every column stands from its own ground up to its own tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR241938050.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];

// the massing: one column per footprint cell, its top a storey line (4 blocks each) under the smoothed roof
const massing = new Map();
for (const [x, z, g] of cells) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = raw.get(key(x + dx, z + dz)); if (c) near.push(c.r); }
  const h = Math.max(12, 4 * Math.floor((median(near) + 2) / 4));
  massing.set(key(x, z), { x, z, g, h });
}

const SIDES = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];
// the sides a block needs a wall on: no footprint cell beside it, or the neighbour's roof is below this height
const openSides = (x, z, y) => SIDES.filter(([, dx, dz]) => { const n = massing.get(key(x + dx, z + dz)); return !n || y >= n.h; }).map(([s]) => s);
// bays three blocks wide: a calcite pier, then two glass panes
const isWindow = (side, x, z) => ((side === "east" || side === "west") ? z : x) % 3 !== 0;

const DOOR = { x: 9, z: 1, side: "north" };     // the street door, on the -z face
const blocks = new Map();
const k3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, name, state) => blocks.set(k3(x, y, z), { x, y, z, name, state });

const blockFor = (x, y, z, c) => {
  if (y < c.g) return ["stone_bricks"];                                             // foundation under the ground
  if (x === DOOR.x && z === DOOR.z && (y === 2 || y === 3)) {
    const st = { facing: "north", hinge: "left", open: "false", powered: "false", half: y === 2 ? "lower" : "upper" };
    return ["dark_oak_door", st];
  }
  const sides = openSides(x, z, y);
  if (y === c.g) return sides.length ? ["stone_bricks"] : ["smooth_stone"];         // floor, base course outside
  if (y === c.h - 1) return sides.length ? ["stone_bricks"] : [c.h >= 28 ? "deepslate_tiles" : "smooth_stone"]; // cornice / roof
  if (!sides.length) return y % 4 === 0 ? ["smooth_stone"] : null;                 // interior: floor slabs, air otherwise
  if (y < 2) return ["stone_bricks"];                                              // rubble base course
  if (y % 4 === 0) return ["smooth_stone"];                                        // storey line
  const win = isWindow(sides[0], x, z);
  if (y % 4 === 3) return win ? ["oak_planks"] : ["calcite"];                     // timber lintel, lighter than dark oak
  return win ? ["glass_pane", {}] : ["calcite"];
};

for (const c of massing.values()) {
  for (let y = 0; y < c.h; y++) {
    const b = blockFor(c.x, y, c.z, c);
    if (b) put(c.x, y, c.z, b[0], b[1]);
  }
}

// glass panes connect to their in-wall neighbours (any solid block counts, as in the game)
for (const b of blocks.values()) {
  if (b.name !== "glass_pane") continue;
  const side = openSides(b.x, b.z, b.y)[0];
  const has = (x, z) => blocks.has(k3(x, b.y, z));
  b.state = (side === "east" || side === "west")
    ? { north: String(has(b.x, b.z - 1)), south: String(has(b.x, b.z + 1)), east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: String(has(b.x + 1, b.z)), west: String(has(b.x - 1, b.z)), waterlogged: "false" };
}

// warm light behind some panes, in the air gap inside the glass (a fixed pattern, so the run is repeatable)
for (const b of [...blocks.values()]) {
  if (b.name !== "glass_pane" || b.y % 4 !== 2) continue;
  const k = Math.floor(b.y / 4);
  if ((b.x + 2 * b.z + k) % 5 !== 0) continue;
  const side = openSides(b.x, b.z, b.y)[0];
  const [ix, iz] = { east: [b.x - 1, b.z], west: [b.x + 1, b.z], south: [b.x, b.z - 1], north: [b.x, b.z + 1] }[side];
  if (massing.has(key(ix, iz)) && !blocks.has(k3(ix, b.y, iz))) put(ix, b.y, iz, "glowstone");
}

// chimney stacks on the slate roof, and rooftop plant boxes on the five-storey tier
for (const [x, z] of [[5, 4], [12, 4], [16, 8], [3, 9]]) {
  const c = massing.get(key(x, z));
  if (!c || c.h !== 28 || openSides(x, z, 27).length) continue;
  for (let y = 28; y <= 30; y++) put(x, y, z, "bricks");
  put(x, 31, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
let boxes = 0;
for (const c of massing.values()) {
  if (boxes >= 2 || c.h !== 20 || c.x % 4 !== 1 || openSides(c.x, c.z, 19).length) continue;
  put(c.x, 20, c.z, "light_gray_concrete"); put(c.x, 21, c.z, "light_gray_concrete"); boxes++;
}

const g = new Voxels([20, 44, 18]);
for (const b of blocks.values()) g.set(b.x, b.y, b.z, b.name, b.state);
const res = g.save(`${DIR}/FR241938050.nbt`);
console.log(JSON.stringify({ columns: massing.size, ...res }));
