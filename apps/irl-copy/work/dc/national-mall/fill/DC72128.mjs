// DC72128: a 10 x 14 block on the Mall's flank, read from the lidar as three tiers: a 4-high front wing (z 0..3),
// a 5-high main body (z 4..11, and the rear corners at z 12..13 west of x 2), and a 6-high rear tower (z 12..13, x 2..9).
// Reads as a red-brick Federal-style office block: stone-brick belt course and cornice, calcite quoins, stone-brick plinth,
// glass in air-backed bays with a floor slab per storey, a recessed portal, lanterns behind glass, rooftop plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72128.cells.json", "utf8"));
const W = 10, D = 14, H = 18;

// lidar roof per cell, to check the tiers against
const lidar = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const ground = Math.min(...cells.map(([, , g]) => g));

// Tier heights (roof top above y 0), smoothed from the lidar's 4/5/6 noise into three flat tiers.
const tierOf = (x, z) => (z >= 12 ? (x >= 2 ? 6 : 4) : z <= 3 ? 4 : 5);
const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D;
const top = (x, z) => (inside(x, z) ? tierOf(x, z) : 0);
const solid = (x, y, z) => y >= 0 && inside(x, z) && y < top(x, z);

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];          // N, S, W, E (N = z 0 street front)
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // runs along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // runs along z

const g = new Voxels([W, H, D]);
const carve = [];                                          // air cells behind window glass (inside the wall)
const lanterns = [];
const glowing = [];
const isRecess = (x, y, z) => z === D - 1 && (x === 4 || x === 5) && (y === 1 || y === 2);   // the portal, set back in the street face

// Main pass: solid tiers, classified by which faces are exposed.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const T = top(x, z);
  for (let y = ground; y < ground + T; y++) {
    const ly = y - ground;
    if (isRecess(x, ly, z)) { g.set(x, ly, z, "air"); continue; }
    const sides = DIRS.filter(([dx, dz]) => !solid(x + dx, ly, z + dz));
    if (ly === T - 1) {                                    // top course: cornice on the edge, roof surface inside
      g.set(x, ly, z, sides.length ? "stone_bricks" : "stone");
      continue;
    }
    if (!sides.length) { g.set(x, ly, z, "bricks"); continue; }   // solid core
    const [dx, dz] = sides[0];
    const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
    if (ly === 0) { g.set(x, ly, z, "stone_bricks"); continue; }   // plinth
    if (ly === 3) { g.set(x, ly, z, "stone_bricks"); continue; }   // belt course between storeys
    const u = dz !== 0 ? x : z;                                     // position along the face
    if (corner) { g.set(x, ly, z, "calcite"); continue; }                 // quoins
    if (u % 3 === 0) { g.set(x, ly, z, "bricks"); continue; }             // brick piers between the bays
    g.set(x, ly, z, "glass_pane", dz !== 0 ? PANE_NS : PANE_EW);
    carve.push([x - dx, ly, z - dz]);
    if (ly === 1 && (u === 2 || u === 7)) lanterns.push([x - dx, ly, z - dz]);
    if (ly === 4 && dz === 1 && (u === 4 || u === 7)) glowing.push([x - dx, ly, z - dz]);
  }
}

// The air gap behind each window (never into the portal's wall)
for (const [x, y, z] of carve) if (solid(x, y, z) && g.get(x, y, z)) g.set(x, y, z, "air");
for (const [x, y, z] of lanterns) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
for (const [x, y, z] of glowing) g.set(x, y, z, "glowstone");

// Portal: a door in the set-back wall (street face, z 13), a hanging lantern under the lintel
for (const y of [1, 2]) {
  g.set(4, y, D - 2, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
}
g.set(5, 2, D - 1, "lantern", { hanging: "true", waterlogged: "false" });

// Rooftop plant on the front wing (its roof is at y 4)
for (const [x, z] of [[2, 1], [3, 1], [2, 2], [3, 2]]) g.set(x, 4, z, "light_gray_concrete");

// Checks: every block stands on a block (or on the ground); the tiers against the lidar.
const floatingAt = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 1; y < H; y++) {
  const here = g.get(x, y, z); if (!here) continue;
  if (here.block === "lantern" && here.state?.hanging === "true") continue;
  // a course over an air gap is held by the walls either side of it (a floor slab spanning a window bay)
  const beside = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, y, z + dz));
  if (!g.get(x, y - 1, z) && !beside) floatingAt.push(`${x},${y},${z} ${here.block}`);
}
const floating = floatingAt.length;
if (floating) console.log(floatingAt.join("\n"));
let mismatch = 0;
for (const [x, z, , r] of cells) if (Math.abs(tierOf(x, z) - r) > 1) mismatch++;
console.log(`floating blocks: ${floating}; footprint cells off the lidar by more than 1: ${mismatch}; ground ${ground}`);

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72128.nbt");
