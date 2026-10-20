// Interior designer for "Gallery one" (room 26): a dark exhibition room. The focal piece is a stained-glass cluster on a
// deepslate pedestal at the north end, on the axis of the doorway (x 274..277). Side plinths with coloured glass and a
// lantern on top line both walls, lamp posts with lanterns light the middle, a stair bench faces the focal piece.
// Drawn as text: rows run along +x from x 259, successive rows along +z from z 6; y 1 is the floor layer.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 259;
const Z0 = 6;
const W = 36; // x 259..294
const D = 24; // z 6..29

const LEGEND = {
  P: "polished_deepslate",
  O: "orange_stained_glass",
  R: "red_stained_glass",
  Y: "yellow_stained_glass",
  S: "sea_lantern",
  F: "oak_fence",
  E: "end_rod",
  L: ["lantern", { hanging: "false" }],
  T: ["deepslate_tile_stairs", { facing: "south", half: "bottom" }],
};

// blank text grids, one per layer y 1..4
const blank = () => Array.from({ length: 4 }, () => Array.from({ length: D }, () => Array(W).fill(" ")));
const grid = blank();

// place(y, x, z, ch): y is the floor layer (1..4), x and z are global coordinates
const place = (y, x, z, ch) => {
  grid[y - 1][z - Z0][x - X0] = ch;
};

// the focal pedestal (x 274..277, z 7..10): a deepslate block with spotlights on its corners and a glass cluster
for (let x = 274; x <= 277; x++) for (let z = 7; z <= 10; z++) place(1, x, z, "P");
for (const [x, z] of [[274, 7], [277, 7], [274, 10], [277, 10]]) place(2, x, z, "L");
place(2, 275, 8, "O"); place(2, 276, 8, "Y");
place(2, 275, 9, "R"); place(2, 276, 9, "S");
place(3, 275, 8, "R"); place(3, 276, 9, "O");
place(4, 275, 8, "E"); place(4, 276, 9, "E");

// side plinths: one column on each wall, a coloured glass block and a lantern on top. The north-east corner is the
// gallery's wall bump (x 291..292 for z 6..11), so its east plinth steps in to x 288
const plinthZ = [8, 14, 20, 26];
const westGlass = ["O", "R", "Y", "O"];
const eastGlass = ["R", "Y", "O", "R"];
plinthZ.forEach((z, i) => {
  const eastX = z < 12 ? 288 : 292;
  for (const [x, glass] of [[261, westGlass[i]], [eastX, eastGlass[i]]]) {
    place(1, x, z, "P");
    place(2, x, z, glass);
    place(3, x, z, "L");
  }
});

// lamp posts: oak fence three high with a lantern on top, in the middle of the room and beside the focal lane.
// The north wall is z 12..13, so the posts on the north row stand at z 14, the first free row inside it
const posts = [[266, 14], [266, 22], [285, 14], [285, 22], [272, 17], [279, 17]];
for (const [x, z] of posts) {
  place(1, x, z, "F"); place(2, x, z, "F"); place(3, x, z, "F"); place(4, x, z, "L");
}

// stair bench facing the focal piece: seats with their back to the south door
for (let x = 267; x <= 270; x++) place(1, x, 25, "T");

// floor lanterns standing on the ground where the dark corners are (the south-west lobby corner and the east wall)
place(1, 271, 25, "L");
place(1, 284, 22, "L");
place(1, 286, 14, "L");

const rowsOf = (y) => grid[y - 1].map((r) => r.join(""));

export function build(g) {
  layers(g, [X0, 1, Z0], LEGEND, [1, 2, 3, 4].map(rowsOf));
}
