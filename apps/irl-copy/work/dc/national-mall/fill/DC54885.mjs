import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A red-brick church with a stone-trimmed cross plan: a 3-course nave down the middle (x 3..5), 2-course aisles either
// side, a 3-course transept across the back row (z 8), and a 1-course vestibule on the east notch (x 8). Lidar roof
// heights are the massing; the nave front has a recessed door under a cornice hood.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54885.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const roofAt = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
roofAt.set(key(2, 8), 3); // one noisy dip in the transept row, smoothed to its tier
const inF = (x, z) => roofAt.has(key(x, z));
const roof = (x, z) => roofAt.get(key(x, z)) ?? 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a face is exposed where its neighbour is outside the footprint or stands lower (the step down from a nave to an aisle)
const exposed = (x, z, dx, dz) => !inF(x + dx, z + dz) || roof(x + dx, z + dz) < roof(x, z);
const shell = (x, z) => DIRS.some(([dx, dz]) => exposed(x, z, dx, dz));
const corner = (x, z) => (exposed(x, z, 1, 0) || exposed(x, z, -1, 0)) && (exposed(x, z, 0, 1) || exposed(x, z, 0, -1));

const g = new Voxels([9, 15, 9]);
const BRICK = "bricks", PLINTH = "stone_bricks", PANEL = "stone_bricks", TRIM = "smooth_quartz", DECK = "smooth_stone";

for (const k of roofAt.keys()) {
  const [x, z] = k.split(",").map(Number);
  const R = roof(x, z);
  if (!shell(x, z)) {
    // interior: a floor slab, air above it (the glass has a gap behind), and the roof deck on top
    g.set(x, 0, z, "smooth_stone");
    if (R >= 2) g.set(x, R - 1, z, DECK);
    continue;
  }
  if (R === 1) { g.set(x, 0, z, PLINTH); continue; } // the vestibule: one course of stone, reading as the plinth
  g.set(x, 0, z, PLINTH);
  const along = z === 0 || z === 8 ? x : z; // position along the wall, for the bay rhythm
  let wall = BRICK;
  if (corner(x, z)) wall = TRIM;
  else if (R === 3 && z === 8 && along % 2 === 0) wall = "glass"; // transept bays: glazing with air behind
  else if (R === 2 && along % 2 === 0) wall = PANEL;
  g.set(x, 1, z, wall);
  if (R === 2) g.set(x, 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); // aisle cornice
  else g.set(x, 2, z, TRIM); // nave cornice: the storey line and the roof edge
}

// the recessed doorway in the nave front, under the cornice hood
g.set(4, 0, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(4, 1, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm light: one lamp inside the door, one behind the transept glazing
g.set(4, 1, 1, "glowstone");
g.set(4, 1, 7, "glowstone");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54885.nbt");
