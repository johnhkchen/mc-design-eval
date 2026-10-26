// 1510 21st St NW: a Romanesque Revival brick house (c. 1890-1905) on a stone plinth, with a street-front porch,
// a corner tower on the west side and a stepped body. Storeys are one block; the window rows are the odd rows 1,2,4.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54025.cells.json", "utf8"));
const X = 11, Z = 6, Y = 20;

// lidar roof height (top face) -> top block row = roof - 1. Two lidar bumps on the body (8,2), (9,3) are noise: they drop to the body tier
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const TOP_FIX = { "8,2": 5, "9,3": 5 };
const top = (x, z) => {
  const k = `${x},${z}`;
  if (!foot.has(k)) return -1;                 // outside the footprint: exposed at every row
  if (k in TOP_FIX) return TOP_FIX[k];
  return foot.get(k).roof - 1;
};
const nbrs = (x, z) => [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]];

// a shell block is one with an exposed face at row y (outside the footprint, or the neighbour's roof is lower than this row)
const shell = (x, z, y) => top(x, z) >= y && nbrs(x, z).some(([nx, nz]) => top(nx, nz) < y);
// inside the shell but touching it at this row: the air gap behind the glass
const ring = (x, z, y) => top(x, z) >= y && !shell(x, z, y) && nbrs(x, z).some(([nx, nz]) => shell(nx, nz, y));

const glassEW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const glassNS = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
const WIN_COLS_FRONT = [3, 5, 7, 9];           // front and back windows (the porch takes x 0..2)
const WIN_ROWS_SIDE = [1, 3];                  // east and west windows, by z
const windowRow = (y) => y === 1 || y % 2 === 0;
const glowAt = new Set([
  "3,2,1", "7,4,1", "9,2,1",                   // front ring behind windows
  "5,4,4",                                     // back ring behind the rear window
]);

// which face of a shell row is exposed, in the order that wins at a corner: front, back, east, west
const face = (x, z, y) => {
  if (top(x, z - 1) < y) return "front";
  if (top(x, z + 1) < y) return "back";
  if (top(x + 1, z) < y) return "east";
  if (top(x - 1, z) < y) return "west";
  return null;
};

const v = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

for (const [x, z] of [...foot.keys()].map((k) => k.split(",").map(Number))) {
  const T = top(x, z);
  // foundation: a stone plinth under every cell, so nothing floats on the slope
  put(x, 0, z, "stone_bricks");

  for (let y = 1; y <= T; y++) {
    if (y === T) {
      // the roof: a calcite cornice on the shell, a light roof deck inside (a black deck reads as a hole from the air)
      put(x, y, z, shell(x, z, y) ? "calcite" : "smooth_stone");
      continue;
    }
    if (ring(x, z, y)) {
      if (glowAt.has(`${x},${y},${z}`)) put(x, y, z, "glowstone");
      continue;                                // air: the gap behind the glass
    }
    if (!shell(x, z, y)) { put(x, y, z, "stone"); continue; }   // core: the floor slab of each storey

    const f = face(x, z, y);
    const corner = (x === 0 || x === X - 1) && (z === 0 || z === Z - 1);
    if (corner) { put(x, y, z, y % 2 ? "calcite" : "bricks"); continue; }   // quoins
    if (f === "front" && x === 1 && z === 0 && (y === 1 || y === 2)) {
      put(x, y, z, "oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const win = windowRow(y);
    if ((f === "front" || f === "back") && win && WIN_COLS_FRONT.includes(x)) { put(x, y, z, "glass_pane", glassEW); continue; }
    if ((f === "east" || f === "west") && win && WIN_ROWS_SIDE.includes(z)) { put(x, y, z, "glass_pane", glassNS); continue; }
    put(x, y, z, y === 1 ? "stone_bricks" : "bricks");   // base course, then brick piers and spandrels
  }
}

// chimneys on the body roof, with a calcite cap
for (const x of [4, 7]) {
  put(x, 6, 3, "bricks"); put(x, 7, 3, "bricks"); put(x, 8, 3, "calcite");
}
// a lantern on the tower's crown
put(2, 9, 5, "lantern", { hanging: "false", waterlogged: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54025.nbt";
const r = v.save(out);
console.log(JSON.stringify(r));
