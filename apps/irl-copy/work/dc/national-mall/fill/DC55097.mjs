// 1634 R St NW: a Dupont Circle brick row house with a tall east bay, lower wings, and a stone-banded front.
// Storeys are 3 blocks; y0 plinth, string courses at y3/y6, cornice on each roof's top layer.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55097.cells.json`, "utf8"));   // [x, z, ground, roof]

// lidar roof heights to clean tiers: the 10-block tower, one 4-block wing (3 and 5 read as lidar noise), a 3-block back
const tier = (r) => (r >= 8 ? 10 : r >= 4 ? 4 : 3);
const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { ground, top: tier(roof) });
const has = (x, z) => cell.has(key(x, z));

const FACES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// which exposed faces take a window bay: front bays at x 0 and 2 (x 1 is the door), a bay at the back, bays on the sides
const WINDOW = {
  N: (x) => x !== 1,
  S: (x) => x === 1,
  W: (x, z) => (x === 0 && (z === 1 || z === 3)) || (x === 1 && z === 5),
  E: (x, z) => x === 2 && (z === 1 || z === 3 || z === 5),
};
const exposed = (x, z) => Object.keys(FACES).filter((f) => !has(x + FACES[f][0], z + FACES[f][1]));
const windowFace = (x, z) => exposed(x, z).find((f) => WINDOW[f](x, z));
// glass pane lies in the wall's plane: N/S walls run east-west, W/E walls run north-south
const pane = (f) =>
  f === "N" || f === "S"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const g = new Voxels([3, 22, 8]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [k, { ground, top }] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");          // foundation up to the lowest ground (none needed here)
  const shell = exposed(x, z).length > 0;
  const wf = windowFace(x, z);
  for (let y = ground; y < top; y++) {
    const course = y === top - 1 || y % 3 === 0;                           // cornice/roof layer and storey lines
    if (shell) {
      if (course) put(x, y, z, "stone_bricks");
      else if (wf) put(x, y, z, "glass_pane", pane(wf));
      else put(x, y, z, "bricks");
    } else {
      // party floor and roof of an inner cell: an air gap behind the glass, one slab per storey
      if (course) put(x, y, z, "smooth_stone");
    }
  }
}

// entrance on the front bay x 1: a dark oak door with a hood over it
put(1, 0, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(1, 1, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(1, 2, 0, "dark_oak_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });

// the tall bay's penthouse, set back onto the cornice, glazed on its east face
for (const z of [2, 3]) {
  put(2, 10, z, "glass_pane", pane("E"));
  put(2, 11, z, "stone_bricks");
}

// a brick flue on the wing roof
put(1, 4, 2, "bricks"); put(1, 5, 2, "bricks"); put(1, 6, 2, "stone_bricks");

// warm lights in the inner air behind the front-side bays
put(1, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
put(1, 1, 3, "lantern", { hanging: "false", waterlogged: "false" });

const n = g.save(`${DIR}/DC55097.nbt`);
console.log(JSON.stringify(n));
