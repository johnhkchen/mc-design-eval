// Evening Star Building, 1101 Pennsylvania Ave NW (Commercial-Office-Large), footprint 14 x 31 at 0.42 blocks/m.
// Read from the lidar roof record: a six-storey north block (roof 20), a five-storey south wing (roof 17), a central
// crown one course above the north cornice (21), and a penthouse on the wing roof (18). Ground is flat (0).
// Brick walls on a stone plinth, limestone piers and spandrel bands, a cornice on every roof edge, glass in the
// windows with an air gap behind (interiors are hollow between solid floor slabs), a recessed entrance on the west
// (x = 0) front, and warm light behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66316.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66316.nbt";

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const k = (x, z) => `${x},${z}`;

// Smoothed roof tiers (top surface, blocks above y 0). Lidar noise (16-19, stray 21s) folds into these four tiers.
const tops = new Map();
for (const [x, z] of cells) {
  let R = z <= 13 ? 20 : 17;                                       // north block 20, south wing 17
  if (z <= 13 && x >= 4 && x <= 7 && z >= 4 && z <= 8) R = 21;      // central crown, inset from the north block
  if (z >= 14 && x >= 4 && x <= 9 && z >= 17 && z <= 23) R = 18;    // penthouse set back on the wing roof
  tops.set(k(x, z), R);
}
const top = (x, z) => tops.get(k(x, z)) ?? -1;                     // outside the footprint: -1, so every edge is exposed

// Floor slabs (the top of each storey's spandrel row). Ground floor 0..3, then 3-high storeys above.
const floorsOf = (R) => [0, 4, 7, 10, 13, ...(R >= 20 ? [16] : [])];
// The cell's outward faces at height y: a neighbour column that is lower than y (or outside) leaves the face open.
const exposure = (x, z, y) => DIRS.filter(([dx, dz]) => top(x + dx, z + dz) <= y);

const WIN_N = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // pane on an x-face runs along z
const WIN_E = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };  // pane on a z-face runs along x

// What stands at (x, y, z): [block, state?] or null for air. Pure: used for the build and for the light placements.
function spec(x, y, z) {
  const R = top(x, z);
  if (R < 0 || y < 0 || y >= R) return null;
  const ex = exposure(x, z, y), outer = ex.length > 0;
  if (y === 0) return ["stone_bricks"];                                            // plinth on the flat ground
  if (y === R - 1) return [outer ? "smooth_sandstone" : "smooth_stone"];           // cornice / roof deck
  if (DIRS.some(([dx, dz]) => top(x + dx, z + dz) === R - 1) && y === R - 2) return ["smooth_stone"]; // deck of a step-in tier
  const floors = floorsOf(R);
  if (floors.includes(y)) return [outer ? "smooth_sandstone" : "smooth_stone"];   // floor slab; exposed = spandrel band
  if (!outer) return null;                                                         // interior air behind the wall
  const f = Math.max(...floors.filter((v) => v <= y));                              // this storey's floor
  const rel = y - f;
  const xFace = ex.some(([dx]) => dx !== 0), zFace = ex.some(([, dz]) => dz !== 0);
  const t = xFace ? z : x;                                                         // position along the wall
  if (f === 0 && rel === 3) return ["smooth_sandstone"];                           // shopfront transom band
  if (xFace && zFace) return ["calcite"];                                          // limestone quoin at the corners
  if (t % 3 === 0) return ["bricks"];                                              // brick pier every 3 blocks between the panes
  if (f === 0) return ["glass"];                                                   // shopfront glazing
  return ["glass_pane", xFace ? WIN_N : WIN_E];
}

// The entrance: a recessed portal on the west front at z 3..5 (door at z 4), glass sidelights and transom.
function entrance(x, y, z) {
  if (x !== 0 || z < 3 || z > 5 || y < 1 || y > 3) return null;
  if (z === 4 && y <= 2) {
    const half = y === 1 ? "lower" : "upper";
    return ["dark_oak_door", { facing: "east", half, hinge: "left", open: "false", powered: "false" }];
  }
  return ["glass"];
}

const g = new Voxels([14, 33, 31]);
const put = (x, y, z, s) => { if (s) g.set(x, y, z, s[0], s[1]); };
for (const [x, z] of cells) {
  const R = top(x, z);
  for (let y = 0; y < R; y++) put(x, y, z, entrance(x, y, z) ?? spec(x, y, z));
}

// Warm light behind some panes (the inside cell next to a window, in the air gap) and shopfront lanterns.
for (const [x, z] of cells) {
  const R = top(x, z);
  for (let y = 1; y < R; y++) {
    const s = spec(x, y, z);
    if (!s || s[0] !== "glass_pane") continue;
    const ex = exposure(x, z, y);
    if (!ex.length) continue;
    const f = Math.max(...floorsOf(R).filter((v) => v <= y)), t = ex.some(([dx]) => dx !== 0) ? z : x;
    const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
    if (spec(ix, y, iz) !== null) continue;                                       // only into the air gap
    if (y === f + 1 && (f === 7 || f === 13) && (t + f) % 6 === 1) g.set(ix, y, iz, "glowstone");
    if (y === f + 1 && f === 16 && t % 6 === 4) g.set(ix, y, iz, "shroomlight");
  }
  if (R > 0 && spec(x, 1, z)?.[0] === "glass") {                                     // shopfront lanterns, hung from the floor above
    const ex = exposure(x, z, 1);
    if (ex.length && (((ex.some(([dx]) => dx !== 0) ? z : x) % 6) === 4)) {
      const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
      if (spec(ix, 3, iz) === null && spec(ix, 4, iz)) g.set(ix, 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// Roof equipment and crown lanterns, each standing on a roof surface.
for (const [x, y, z] of [[9, 20, 3], [10, 20, 3], [9, 20, 7], [10, 20, 7], [11, 17, 20], [12, 17, 20]]) g.set(x, y, z, "iron_block");
for (const [x, z] of [[4, 4], [7, 4], [4, 8], [7, 8]]) g.set(x, 21, z, "lantern", { hanging: "false", waterlogged: "false" });

const stats = g.save(OUT);
console.log("saved", OUT, stats);
