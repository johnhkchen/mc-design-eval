// FR245184825: a residential ring of 1500 on the Notre-Dame footprint (17 x 17 cells, an open courtyard in the middle).
// The lidar roof is one flat tier: 21 blocks above y 0 once each cell takes the median of its neighbourhood (131 cells at 21,
// 23 at 20, 2 at 19), so the massing is five storeys of 4 blocks under a stone cornice and a slate deck, not setbacks.
// The shell is the outer skin (cells touching outside the footprint or the courtyard): calcite walls on a stone-brick plinth,
// smooth-stone string courses, glass casements two blocks tall framed by calcite, stone-brick quoins at the corners, a door
// with stone surrounds, and a lantern in some rooms behind the glass. Inside the skin there is an air gap per room with an
// oak floor slab per storey, so nothing is solid behind the windows. Two chimney stacks rise from the deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184825.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184825.nbt";

const TOP = 21;                  // lidar roof tier: top of the cornice course is y 20, the roof plane sits at 21
const H = 24;                    // chimney caps reach y 23
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), g);
const inFp = (x, z) => ground.has(key(x, z));

// depth from the outside edge (1 = the skin: a neighbour is outside the footprint or the courtyard hole)
const depth = new Map();
const queue = [];
for (const [x, z] of cells) if (DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz))) { depth.set(key(x, z), 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = depth.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const k = key(x + dx, z + dz);
    if (inFp(x + dx, z + dz) && !depth.has(k)) { depth.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}
const isSkin = (x, z) => depth.get(key(x, z)) === 1;
const outDirs = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));

// Storey rhythm, counted from y 0: 0 plinth, 4s string course, 4s+1..4s+2 glass, 4s+3 lintel, TOP-1 cornice and deck.
const deepest = [...depth.entries()].sort((a, b) => b[1] - a[1]);
const chimneys = [];
for (const [k, d] of deepest) { if (d < 3) break; const [x, z] = k.split(",").map(Number); if (chimneys.length < 2 && chimneys.every(([cx, cz]) => Math.abs(cx - x) + Math.abs(cz - z) > 5)) chimneys.push([x, z]); }

const g = new Voxels([17, H, 17]);
const DOOR = [6, 0];             // the north face's middle bay, on the street side
let windowsSeen = 0;

for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground (the plinth course sits on it)
  for (let y = 0; y < Math.max(1, gr); y++) g.set(x, y, z, "stone_bricks");

  const exposed = outDirs(x, z);
  const exX = exposed.some(([dx]) => dx !== 0), exZ = exposed.some(([, dz]) => dz !== 0);
  const skin = isSkin(x, z);
  const axisX = exX && !exZ;                         // an x-facing face (the wall runs along z); a z-facing face otherwise
  const along = axisX ? z : x;                       // position along the face
  const quoin = skin && (along === 0 || along === 16);   // ends of a face: stone-brick quoins, not every stair step
  const isDoor = x === DOOR[0] && z === DOOR[1];

  for (let y = 1; y < TOP; y++) {
    const r = y % 4;
    if (y === TOP - 1) {                             // cornice course on the skin, deepslate deck over the rooms
      if (skin) g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      else g.set(x, y, z, "deepslate_tiles");
      continue;
    }
    if (r === 0) {                                   // storey line: string course on the skin, oak floor slab inside
      if (skin) g.set(x, y, z, quoin ? "stone_bricks" : "smooth_stone");
      else g.set(x, y, z, "oak_planks");
      continue;
    }
    if (!skin) continue;                             // the air gap behind the skin
    if (quoin) { g.set(x, y, z, "stone_bricks"); continue; }
    if (isDoor) {
      if (y <= 2) g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "calcite");
      continue;
    }
    if (z === DOOR[1] && (x === DOOR[0] - 1 || x === DOOR[0] + 1) && y <= 3) { g.set(x, y, z, "stone_bricks"); continue; }
    const lit = r === 1 || r === 2;
    const window = lit && along % 2 === 1;
    if (!window) { g.set(x, y, z, "calcite"); continue; }
    if (r === 1) windowsSeen++;
    const state = axisX
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
    g.set(x, y, z, "glass_pane", state);
    // a lantern on the room floor behind every fourth window, in the air gap (the window's inner neighbour)
    if (r === 1 && windowsSeen % 4 === 1) {
      const [dx, dz] = exposed[0];
      const ix = x - dx, iz = z - dz;
      if (inFp(ix, iz) && !isSkin(ix, iz)) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// a stone surround for the door's lintel, one course above the door
g.set(DOOR[0], 3, DOOR[1], "stone_brick_slab", { type: "top", waterlogged: "false" });

// two chimney stacks rising from the deck on the deepest room cells
for (const [x, z] of chimneys) {
  g.set(x, TOP, z, "stone_bricks"); g.set(x, TOP + 1, z, "stone_bricks");
  g.set(x, TOP + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(OUT);
console.log("built", OUT, "cells", g.count(), "skin cells", [...depth.values()].filter((d) => d === 1).length, "chimneys", JSON.stringify(chimneys));
