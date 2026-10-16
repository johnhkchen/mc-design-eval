// v2: the eight house stacks. In v1 the crew's chimney_stack (all-or-nothing, into air only) refused every one,
// because the brick footings at y1..2 filled the cell the hay goes in under each fire. Build them with chimney().
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const g = await load("v1.nbt");
const HEARTHS = [
  { wall: [4, 3, 16], into: "north", top: 10 }, { wall: [7, 3, 16], into: "north", top: 10 },
  { wall: [15, 3, 13], into: "east", top: 14 }, { wall: [27, 3, 12], into: "east", top: 16 },
  { wall: [41, 3, 16], into: "north", top: 16 }, { wall: [51, 3, 16], into: "north", top: 12 },
  { wall: [87, 3, 16], into: "north", top: 15 }, { wall: [92, 3, 16], into: "north", top: 15 },
];
for (const h of HEARTHS) chimney(g, { ...h, material: "bricks" });
// shutters hanging past plot 7's east edge (x96) fall outside every module: drop them so the row is 96 wide
for (const [k, c] of g.cells) if (c.pos[0] >= 96) g.cells.delete(k);
g.resize([96, g.size[1], g.size[2]], [0, 0, 0]);
g.save("v2.nbt");
