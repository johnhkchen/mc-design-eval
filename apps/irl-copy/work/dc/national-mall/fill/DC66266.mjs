// 1730 S St NW, Dupont Circle: a Romanesque-Revival brick rowhouse (c. 1890s). Footprint 5 x 10 cells; z 0 is the
// street front, z 7..9 the rear wing (lidar: 3 blocks), z 0..6 the main house (lidar: 6 blocks, two storeys of
// windows under a cornice, the lidar's 5s and 4s are noise and smooth to the tier).
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC66266.cells.json`, "utf8"));   // [x, z, ground, roof]
const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const has = (x, z) => foot.has(key(x, z));

const BRICK = "bricks", BASE = "stone_bricks", BAND = "smooth_sandstone", GLASS = "glass";
const FLOOR = "oak_planks", ROOF = "stone", TERRACE = "spruce_planks";     // a tar-and-gravel roof reads as a dark hole from the air in gray_concrete

// an exterior cell: any side open to the air, or the party line z 6 between the house and its rear wing
const edge = (x, z) => z === 6 || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !has(x + dx, z + dz));

const V = new Voxels([5, 18, 10]);
const put = (x, y, z, block, state) => { V.set(x, y, z, block, state); };

// lidar roof heights smoothed to two clean tiers: the main house at 6 blocks, the rear wing at 3
const tierOf = (z) => (z <= 6 ? 6 : 3);

const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

function mainWall(x, y, z) {
  if (y === 0) return [BASE];
  if (y === 3) return [BAND];                                               // the storey line between the two floors
  if (y === 5) return [z === 0 ? BAND : BASE];                              // the cornice course
  const win = (z === 0 && (x === 1 || x === 3)) || (z === 6 && (x === 1 || x === 3));
  if (y === 4) return [win ? GLASS : BRICK];                                // second-floor windows
  // y 1-2: the ground storey; the street front carries the door in the middle bay
  if (z === 0 && x === 2) return ["door", y === 1 ? "lower" : "upper"];
  if (z === 0 && (x === 1 || x === 3)) return [GLASS];
  return [BRICK];
}

function rearWall(x, y, z) {
  if (y === 0) return [BASE];
  if (y === 2) return [BASE];                                               // the rear cornice
  const win = (z === 9 && (x === 1 || x === 3)) || (z === 8 && x === 2);
  return [win ? GLASS : BRICK];
}

for (const [x, z, ground] of cells) {
  const top = tierOf(z);
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");                 // foundation up to the cell's ground
  const ring = edge(x, z);
  for (let y = 0; y < top; y++) {
    if (ring) {
      const wall = top === 6 ? mainWall(x, y, z) : rearWall(x, y, z);
      if (wall[0] === "door") put(x, y, z, "dark_oak_door", { ...DOOR, half: wall[1] });
      else put(x, y, z, wall[0]);
      continue;
    }
    // interior: a floor slab per storey and the roof deck on top; air between, so the glass has air behind it
    if (y === 0 || (top === 6 && y === 3)) put(x, y, z, FLOOR);
    else if (y === top - 1) put(x, y, z, top === 6 ? ROOF : TERRACE);
  }
}

// chimneys on the party walls rising through the roof, with a cap
for (const x of [0, 4]) {
  put(x, 6, 3, BRICK); put(x, 7, 3, BRICK); put(x, 8, 3, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// warm light behind glass: lanterns and shroomlight in the air gap
put(1, 1, 1, "lantern", { hanging: "false" });
put(3, 4, 1, "shroomlight");
put(1, 1, 8, "lantern", { hanging: "false" });
put(2, 1, 7, "glowstone");

V.save(`${DIR}/DC66266.nbt`);
