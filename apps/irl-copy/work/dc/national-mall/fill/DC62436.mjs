// 9 Hillyer Court NW: a Kalorama brick block (Georgian/Beaux-Arts Revival, the 1920s line) turned into a museum, library and
// gallery. Red brick walls on a stone-brick foundation, limestone (calcite) quoins, belt courses and cornice, glass panes
// in a grid with a brick pier between each, a slate-tiled core roof, and a parapet on the top tier. Lidar roof heights are
// smoothed into flat tiers (10 / 9 / 8 / 6 / 5 / 3); the ground step comes from the cells file. The core is a one-cell
// shell with an air gap behind every window, a floor slab per storey, and a roof cap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62436.cells.json", "utf8"));

// roof top per cell (y of the roof surface), lidar noise smoothed into tiers
const TOP = {
  "0,0": 10, "1,0": 10, "2,0": 10,
  "0,1": 10, "1,1": 10, "2,1": 10,
  "0,2": 9, "1,2": 9, "2,2": 9,
  "0,3": 9, "1,3": 8, "2,3": 8,
  "0,4": 9, "1,4": 8, "2,4": 5,
  "0,5": 8, "1,5": 6, "2,5": 5,
  "0,6": 6, "1,6": 6, "2,6": 3,
};

const X = 3, Y = 22, Z = 7;
const g = new Voxels([X, Y, Z]);
const ground = {};
for (const [x, z, gr] of cells) ground[`${x},${z}`] = gr;

const BRICK = "bricks", LIMESTONE = "calcite", FOUNDATION = "stone_bricks", FLOOR = "stone_bricks";
const BELT = "stone_brick_slab", CAP = "deepslate_tiles", PARAPET = "stone_brick_wall", GLASS = "glass_pane";
const GLOW = "glowstone", LANTERN = "lantern", DOOR = "dark_oak_door";

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const gr = ground[`${x},${z}`], top = TOP[`${x},${z}`];
  const edgeX = x === 0 || x === X - 1, edgeZ = z === 0 || z === Z - 1;
  const facade = edgeX || edgeZ, corner = edgeX && edgeZ;

  // foundation: solid from y 0 up to the ground under this cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  // belt courses (base course on the ground, then every 3 blocks) and the cornice at the roof
  const belts = [gr, gr + 3, gr + 6].filter((b) => b < top - 1);
  const isDoorCell = z === Z - 1 && x === 1;
  const windowCol = ((x === 0 || x === X - 1) && !corner && z % 2 === 1) || (z === 0 && x === 1);

  for (let y = gr; y < top; y++) {
    if (isDoorCell && y <= 1) {
      const half = y === 0 ? "lower" : "upper";
      g.set(x, y, z, DOOR, { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoorCell && y === 2) { g.set(x, y, z, LIMESTONE); continue; }
    if (!facade) {
      // interior: floor slab per storey, roof cap, air between
      if (belts.includes(y)) g.set(x, y, z, FLOOR);
      else if (y === top - 1) g.set(x, y, z, CAP);
      continue;
    }
    if (y === top - 1 || y === gr) { g.set(x, y, z, LIMESTONE); continue; }     // cornice and base course
    if (belts.includes(y)) { g.set(x, y, z, BELT, { type: "bottom", waterlogged: "false" }); continue; }   // thin storey lines
    if (corner) { g.set(x, y, z, y % 2 === 0 ? LIMESTONE : BRICK); continue; }   // quoins, laid alternately with the brick
    const b = Math.max(...belts.filter((v) => v < y), gr - 1);
    const inWindow = windowCol && y - b >= 1 && y - b <= 2 && y <= top - 2;
    if (inWindow) {
      // a pane along the wall: arms north/south on the east and west faces, east/west on the north face
      const state = z === 0
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, GLASS, state);
    } else g.set(x, y, z, BRICK);
  }

  // parapet on the top tier's perimeter, standing on its cornice
  if (facade && top === 10) g.set(x, top, z, PARAPET);
}

// warm light in the core behind some windows, and lanterns on the core roof
for (const z of [1, 3, 5]) for (let k = 0; k < 3; k++) {
  const y = ground[`1,${z}`] + 3 * k + 1;     // the window row just above this storey's floor slab
  if ((z + k) % 3 === 0 && y <= TOP[`1,${z}`] - 2) g.set(1, y, z, GLOW);
}
g.set(1, 10, 1, LANTERN, { hanging: "false", waterlogged: "false" });
g.set(1, 8, 3, LANTERN, { hanging: "false", waterlogged: "false" });
g.set(1, 6, 5, LANTERN, { hanging: "false", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62436.nbt");
