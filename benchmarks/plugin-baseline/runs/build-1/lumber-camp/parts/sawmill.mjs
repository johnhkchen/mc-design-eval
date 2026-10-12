// Part: Sawmill pole frame (plan.md elements 13, 14, 16): the plank floor, 12 stripped posts, the knee braces, the top plate,
// the west half walls, the boarded south back with its doorway lintel, and the saw carriage. The gables, the monitor and the
// loft door belong to the roof and fittings parts; the frame stays open on the north front and east side.
import {
  SPRUCE_PLANKS, STRIPPED_SPRUCE_WOOD, millPost, kneeBrace, topPlate, halfWall, boardBay, sawCarriage,
} from "../vocab.mjs";

// Frame footprint (plan.md SITE: sawmill 23..35 x 8..20, floor y=0, plate y=6).
const X0 = 23, X1 = 35, Z0 = 8, Z1 = 20;

// The 12 posts: corners and mid-bays on the north and south fronts, mid-bays on the long sides.
const POSTS = [
  [23, 8], [27, 8], [31, 8], [35, 8],
  [23, 12], [35, 12], [23, 16], [35, 16],
  [23, 20], [27, 20], [31, 20], [35, 20],
];

// Knee braces: one in each frame-edge cell beside a post, facing back toward it (plan: "either side of every post").
const DIRS = [[1, 0, "west"], [-1, 0, "east"], [0, 1, "north"], [0, -1, "south"]];
const onEdge = (x, z) => x >= X0 && x <= X1 && z >= Z0 && z <= Z1 && (x === X0 || x === X1 || z === Z0 || z === Z1);
const isPost = (x, z) => POSTS.some(([px, pz]) => px === x && pz === z);

export function build(g) {
  // The plank floor replaces the ground under the mill (the ground is laid before the parts).
  for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) g.set(x, 0, z, SPRUCE_PLANKS);

  for (const [x, z] of POSTS) millPost(g, x, z);
  topPlate(g, X0, Z0, X1, Z1);

  for (const [px, pz] of POSTS) {
    for (const [dx, dz, facing] of DIRS) {
      const nx = px + dx, nz = pz + dz;
      if (!onEdge(nx, nz) || isPost(nx, nz)) continue;
      kneeBrace(g, nx, nz, facing);
    }
  }

  // Lintel over the south doorway (y=4); placed before the boards so boardBay skips it.
  for (let x = 28; x <= 30; x++) g.set(x, 4, 20, STRIPPED_SPRUCE_WOOD, { axis: "x" });
  boardBay(g, X0, X1, 20, 1, 5, { doorway: [28, 1, 20, 30, 3, 20] });

  // West side: half walls between the posts (plan: z=9..11, 13..15, 17..19 at y=1..2).
  halfWall(g, X0, 8, 12);
  halfWall(g, X0, 12, 16);
  halfWall(g, X0, 16, 20);

  // Saw carriage down the centre line: rails at x=28 and x=30, log at z=9..11, saw at (29,1,14).
  sawCarriage(g, 29, 9, 19);
}
