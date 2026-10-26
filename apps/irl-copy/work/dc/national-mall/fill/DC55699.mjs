import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1611 16th St NW (Religious): a grey Gothic-revival stone church. Tower on the west corner, a gabled nave running east
// to a lower narthex with the entrance on the east face, low wings at the east corners and a west side aisle.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55699.cells.json`, "utf8"));   // [x, z, ground, roof]

const g = new Voxels([15, 25, 7]);

// materials: stone bricks walls, polished andesite trim, deepslate roof, glass in stone openings
const WALL = "stone_bricks", TRIM = "polished_andesite", SLATE = "deepslate_tiles", SLATE_STAIR = "deepslate_tile_stairs";
const GLOW = "glowstone";
const stair = (facing, half = "bottom") => ({ facing, half, shape: "straight", waterlogged: "false" });
const paneAlongX = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // window in a z-facing wall
const paneAlongZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // window in an x-facing wall
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// top block index per cell: the lidar roof height minus one, smoothed into clean tiers
const NAVE = [4, 5, 6, 6, 6, 5, 4];                         // by z for x 3..12: eaves at z 0 and 6, ridge at z 3
const EAST = { 0: [4, 2], 1: [4, 2], 5: [4, 3], 6: [3, 3] }; // x 13 and x 14 corner wings, stepping down to the corners
const TOWER = 10, WING = 5;
const topOf = (x, z) => {
  if (x <= 2) return z <= 2 ? TOWER : z === 3 ? 6 : WING;   // tower, the ridge running over its flank, west side aisle
  if (x <= 12) return NAVE[z];
  if (z >= 2 && z <= 4) return x === 13 ? 5 : 4;            // narthex
  return EAST[z][x - 13];
};
const isNave = (x, z) => x >= 3 && x <= 12;
const isTower = (x, z) => x <= 2 && z <= 2;

// 1. solid massing: plinth course, then stone up to each cell's top (foundations first; ground is 0 here, so none)
for (const [x, z, ground] of cells) {
  for (let y = 0; y < ground; y++) put(x, y, z, TRIM);
  const t = topOf(x, z);
  for (let y = 0; y <= t; y++) put(x, y, z, y === 0 ? TRIM : WALL);
}

// 2. roofs: slate caps on flat tops, pitched stairs on the nave (eaves outward, a full ridge course)
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (isTower(x, z) || isNave(x, z)) continue;
  put(x, topOf(x, z), z, SLATE);
}
for (let x = 3; x <= 12; x++) {
  for (let z = 0; z <= 6; z++) {
    const t = NAVE[z];
    if (z === 3) put(x, t, z, SLATE);
    else put(x, t, z, SLATE_STAIR, stair(z < 3 ? "north" : "south"));
  }
}

// 3. the tower: pilaster quoins, two bands, a crenellated crown on the slate centre
for (const y of range(1, TOWER)) for (const [x, z] of [[0, 0], [2, 0], [0, 2], [2, 2]]) put(x, y, z, TRIM);
for (const y of [4, 8]) for (const [x, z] of [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1]]) put(x, y, z, TRIM);
for (const [x, z] of [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1]]) put(x, 11, z, "stone_brick_wall");
put(1, 11, 1, SLATE);
for (const [x, z] of [[0, 0], [2, 0], [0, 2], [2, 2]]) put(x, 12, z, "stone_brick_wall");

// 4. the nave: pilasters on the long walls, a stone base, a rose window on the east gable
for (const z of [0, 6]) for (const x of [3, 5, 7, 9, 11]) for (const y of range(1, 3)) put(x, y, z, TRIM);
for (const z of [0, 6]) for (const x of [4, 6, 8, 10]) for (const y of range(1, 3)) put(x, y, z, "glass_pane", paneAlongX);
for (const [y, z] of [[1, 2], [2, 2], [3, 2], [1, 3], [2, 3], [3, 3], [1, 4], [2, 4], [3, 4]]) put(12, y, z, "glass_pane", paneAlongZ);
for (const x of [3, 4, 5, 6, 7, 8, 9, 10, 11]) for (const y of [1, 2, 3]) for (const z of [1, 2, 3, 4, 5]) put(x, y, z, "air");
put(12, 1, 3, "air"); put(12, 2, 3, "air");                 // the doorway from the nave to the narthex

// 5. the narthex: entrance on the east face, a canopy over the door, windows either side
for (const y of [1, 2, 3]) for (const z of [2, 3, 4]) put(13, y, z, "air");
put(14, 1, 3, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
put(14, 2, 3, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const z of [2, 4]) for (const y of [1, 2]) put(14, y, z, "glass_pane", paneAlongZ);
for (const z of [2, 3, 4]) put(14, 3, z, "polished_andesite_stairs", stair("east"));

// 6. the tower's openings with air behind them, and the belfry light
for (let y = 1; y <= 8; y++) put(1, y, 1, "air");           // the shaft behind the tower's windows
for (const y of [5, 6, 9, 10]) { put(0, y, 1, "glass_pane", paneAlongZ); put(1, y, 0, "glass_pane", paneAlongX); }
put(1, 10, 1, "lantern", { hanging: "true", waterlogged: "false" });

// 7. the west side aisle: a window on each face with a lamp behind
put(0, 2, 5, "glass_pane", paneAlongZ); put(0, 3, 5, "glass_pane", paneAlongZ);
put(1, 2, 5, GLOW); put(1, 3, 5, "air");
put(1, 2, 6, "glass_pane", paneAlongX);

// 8. warm lights behind the glass and hanging lanterns under the nave ceiling
for (const [x, y, z] of [[6, 2, 1], [10, 2, 1], [8, 2, 5], [11, 2, 3]]) put(x, y, z, GLOW);
for (const x of [5, 9]) put(x, 3, 3, "lantern", { hanging: "true", waterlogged: "false" });
put(13, 3, 3, "lantern", { hanging: "true", waterlogged: "false" });

g.save(`${DIR}/DC55699.nbt`);
console.log(`DC55699.nbt: ${g.count()} blocks, ${g.palette.length - 1} palette entries`);
