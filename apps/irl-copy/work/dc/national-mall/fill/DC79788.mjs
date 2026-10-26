// DC79788: a 7 x 3 block brick commercial terrace on the Mall's east end, c. 1910. Two floors of glazing on a granite
// base, a stone band between them, a stone cornice and a crenellated parapet on the street (z 0) face. The rear wings
// step down, and the roof plant sits on the rear block. The middle row is a one-cell air gap behind the glazing, with
// a floor slab at y 0, 2 and under the roof cap. Each cell's column stops at its lidar roof height.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC79788.cells.json`, "utf8"));

const roof = new Map(), ground = new Map();
for (const [x, z, gnd, r] of cells) { roof.set(`${x},${z}`, r); ground.set(`${x},${z}`, gnd); }

const g = new Voxels([7, 18, 3]);
const pane = { north: "false", south: "false", east: "true", west: "true" };
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

// 1. Columns: each cell solid from its ground up to its roof height, with the storey structure
for (const [key, R] of roof) {
  const [x, z] = key.split(",").map(Number);
  const G = ground.get(key);
  const perimeter = x === 0 || x === 6 || z === 0 || z === 2;
  for (let y = 0; y < R; y++) {
    let b = null;
    if (y < G) b = "stone_bricks";                       // foundation under a slope (none on this flat site)
    else if (y === 0) b = "polished_granite";            // base course and ground floor slab
    else if (y === R - 1) b = "smooth_stone";            // roof cap / top course
    else if (y === 2) b = perimeter ? "bricks" : "smooth_stone"; // floor slab; walls stay brick between the storeys
    else if (y === 4 && z === 0) b = "smooth_stone";     // street-face cornice
    else if (perimeter) b = "bricks";                    // walls
    // interior: air gap at y 1 and y 3 (behind the glazing)
    if (b) g.set(x, y, z, b);
  }
}

// 2. Street face (z 0): quoined piers, glazed bays, the entrance, the parapet
for (const x of [0, 6]) { g.set(x, 1, 0, "smooth_stone"); g.set(x, 3, 0, "smooth_stone"); }
for (const x of [1, 2, 4, 5]) g.set(x, 1, 0, "glass_pane", pane);
for (const x of [1, 2, 3, 4]) g.set(x, 3, 0, "glass_pane", pane);
g.set(3, 1, 0, "dark_oak_door", door("lower"));
g.set(3, 2, 0, "dark_oak_door", door("upper"));
// parapet: merlons on the odd bays, low coping between them
for (const x of [1, 3, 5]) g.set(x, 5, 0, "stone_bricks");
for (const x of [2, 4]) g.set(x, 5, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

// 3. Rear wings (z 2): glazed bays step down with the roof
for (const x of [1, 2, 3, 4, 5]) g.set(x, 1, 2, "glass_pane", pane);
for (const x of [1, 2, 3, 4]) g.set(x, 3, 2, "glass_pane", pane);
// roof plant on the rear block
g.set(1, 5, 2, "light_gray_concrete");
g.set(2, 5, 2, "light_gray_concrete");

// 4. Warm light behind the glass, inside the air gap
g.set(2, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
g.set(4, 3, 1, "glowstone");
g.set(1, 3, 1, "shroomlight");

g.save(`${DIR}/DC79788.nbt`);
