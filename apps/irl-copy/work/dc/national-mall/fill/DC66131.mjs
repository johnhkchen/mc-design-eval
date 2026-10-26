// 1300 6th St NW: a red-brick walk-up flat block of the early 20th century, the Mount Vernon Square kind. Its
// footprint is 6 x 4 cells (x 0..5, z 0..3); z 0 is the street front. The lidar roof is 6 blocks over the middle
// cells and 5 at the two end walls (x 0 and x 5), so the end walls stand one course lower, as the record says.
// Storeys: a stone plinth, a ground storey of windows and the door, a stone string course, an upper storey of
// windows, then a brick frieze and a stone cornice (the coping on the ends). Windows are flush glass in the walls
// with air behind (no interiors beyond the floor slabs), stone quoins at the corners, and a few warm lights.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC66131.cells.json`, "utf8"));   // [x, z, ground, roof]

const BRICK = "bricks", PLINTH = "stone_bricks", TRIM = "smooth_quartz", FLOOR = "oak_planks", ROOF = "smooth_stone";
const key = (x, y, z) => `${x},${y},${z}`;

// the window cells: flush glass in the front (z 0), back (z 3) and end (x 0, x 5) walls, two storeys each; a brick
// pier at x 3 on the front and back carries the bays up (the ground door at x 2), and each end has one window bay
const glass = new Set();
const win = (x, y, z) => glass.add(key(x, y, z));
for (const x of [1, 4]) win(x, 1, 0);                                             // ground storey, the door bay is x 2
for (const x of [1, 2, 4]) win(x, 3, 0);                                          // upper storey
for (const x of [1, 2, 4]) { win(x, 1, 3); win(x, 3, 3); }                        // rear
for (const y of [1, 3]) { win(0, y, 1); win(5, y, 1); }                           // ends

// the lidar roof per cell (y 0 is ground; every cell's ground is 0 here)
const roof = new Map(cells.map(([x, z, ground, r]) => [`${x},${z}`, { ground, r }]));

const g = new Voxels([6, 18, 4]);

for (const [k, { ground, r }] of roof) {
  const [x, z] = k.split(",").map(Number);
  const perim = x === 0 || x === 5 || z === 0 || z === 3;
  const corner = (x === 0 || x === 5) && (z === 0 || z === 3);
  for (let y = ground; y < r; y++) {
    if (!perim) {
      // interior: a floor slab per storey and the roof deck; air between (the rooms)
      if (y === 0) g.set(x, y, z, "stone");
      else if (y === 2 || y === 4) g.set(x, y, z, FLOOR);
      else if (y === r - 1) g.set(x, y, z, ROOF);
      continue;
    }
    if (x === 2 && z === 0 && y <= 1) continue;                                   // the door, set below
    if (glass.has(key(x, y, z))) continue;                                        // windows, set below
    if (corner) g.set(x, y, z, y === 0 ? PLINTH : TRIM);                          // stone quoins
    else if (y === 0) g.set(x, y, z, PLINTH);                                     // base course
    else if (y === 2) g.set(x, y, z, TRIM);                                       // string course
    else if (y === 4 && r === 5) g.set(x, y, z, TRIM);                            // coping on the lower end walls
    else if (y === 5) g.set(x, y, z, TRIM);                                       // cornice on the middle bays
    else g.set(x, y, z, BRICK);
  }
}

// the entrance: a door in the front bay, lower and upper halves
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(2, 0, 0, "oak_door", door("lower"));
g.set(2, 1, 0, "oak_door", door("upper"));

// glass panes, joined to any neighbouring pane in their wall
const pane = (x, y, z) => ({
  north: String(glass.has(key(x, y, z - 1))),
  south: String(glass.has(key(x, y, z + 1))),
  west: String(glass.has(key(x - 1, y, z))),
  east: String(glass.has(key(x + 1, y, z))),
  waterlogged: "false",
});
for (const k of glass) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, "glass_pane", pane(x, y, z)); }

// warm lights behind some of the glass
const lantern = { hanging: "false", waterlogged: "false" };
g.set(1, 1, 1, "lantern", lantern);
g.set(1, 3, 1, "lantern", lantern);
g.set(4, 3, 1, "shroomlight");
g.set(2, 1, 2, "glowstone");

console.log(g.save(`${DIR}/DC66131.nbt`));
