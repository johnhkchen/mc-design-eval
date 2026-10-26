// DC65384: a 3-storey brick commercial block with a calcite cornice, on a Mall-side street (c. 1900-1910 shop-and-office row).
// 3 x 10 footprint. Shopfront on the west face (the downhill side, where the ground is lowest), 2-tall bays above, air behind every pane.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65384.cells.json", "utf8"));
const TOP = 7;                  // cornice top: the record's ~7 blocks above the lowest ground (lidar roof 5-7, median 6, parapet ring 7)

const WALL = "bricks", STONE = "calcite", BASE = "stone_bricks", FLOOR = "smooth_stone";
const W = 0, M = 1, E = 2;      // x: west (street, downhill) face, middle column (air behind glass), east face
const ZE = [0, 9];              // the two short end walls
const GLASS = new Set();        // "x,y,z" of every pane, so the panes can connect to their neighbours

const g = new Voxels([3, 19, 10]);

// 1. foundation: solid from y 0 up to each cell's ground, and a base course on the whole footprint
for (const [x, z, gr] of cells) for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);
for (const [x, z] of cells) g.set(x, 0, z, BASE);

// 2. the body: a solid shell from y 1 up to the cornice, a floor slab across the footprint at y 3 (the storey belt) and the roof deck at y 6
for (const [x, z] of cells) for (let y = 1; y < TOP; y++) g.set(x, y, z, WALL);
for (const [x, z] of cells) g.set(x, 3, z, FLOOR);
for (const [x, z] of cells) g.set(x, TOP - 1, z, FLOOR);

// 3. interior air: the middle column is empty behind every window (y 1-2 ground, y 4-5 upper)
for (let z = 1; z <= 8; z++) for (const y of [1, 2, 4, 5]) g.set(M, y, z, "air");

// quoins of calcite at the corners (z 0, 9); brick piers between the bays (z 3, 6); calcite storey belt at y 3 on both long faces
for (const x of [W, E]) for (const z of [0, 9]) for (let y = 1; y <= 5; y++) g.set(x, y, z, STONE);
for (const x of [W, E]) for (let z = 0; z <= 9; z++) g.set(x, 3, z, STONE);

// 4. the cornice: stepped stone stairs on the outer edge of the top course, calcite at the corners
for (let z = 1; z <= 8; z++) {
  g.set(W, TOP - 1, z, "stone_brick_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
  g.set(E, TOP - 1, z, "stone_brick_stairs", { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });
}
for (const z of [0, 9]) for (const x of [W, E]) g.set(x, TOP - 1, z, STONE);

// 5. shopfront on the west face (ground y 1-2): glass bays under a dark oak fascia, a door at z 4
for (const z of [1, 2, 5, 7, 8]) {
  pane(W, 1, z);
  g.set(W, 2, z, "dark_oak_planks");
}
g.set(W, 1, 4, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(W, 2, 4, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });

// 6. east face ground floor: 2-tall glass bays with a service door at z 4
for (const z of [1, 2, 5, 7, 8]) for (const y of [1, 2]) pane(E, y, z);
g.set(E, 1, 4, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(E, 2, 4, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });

// 7. upper bays: 2 wide by 2 tall (y 4-5) on both long faces
for (const x of [W, E]) for (const z of [1, 2, 4, 5, 7, 8]) for (const y of [4, 5]) pane(x, y, z);

// 8. warm light, each on a solid block: lanterns on the base course behind the shopfront, a glowstone on the storey slab
g.set(M, 1, 2, "lantern", { hanging: "false", waterlogged: "false" });
g.set(M, 1, 7, "lantern", { hanging: "false", waterlogged: "false" });
g.set(M, 4, 5, "glowstone");

// A glass pane. The faces run along z, so a pane joins its neighbours north and south only.
function pane(x, y, z) {
  GLASS.add(`${x},${y},${z}`);
  g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
}
// Second pass: each pane's connections, from the panes that exist
for (const k of GLASS) {
  const [x, y, z] = k.split(",").map(Number);
  const has = (zz) => GLASS.has(`${x},${y},${zz}`);
  g.set(x, y, z, "glass_pane", { north: has(z - 1) ? "true" : "false", south: has(z + 1) ? "true" : "false", east: "false", west: "false", waterlogged: "false" });
}

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65384.nbt"));
