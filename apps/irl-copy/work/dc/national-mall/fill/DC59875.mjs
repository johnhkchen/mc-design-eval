// 1416 R St NW: a brick Victorian-era walk-up on a flat roof. Two storeys of residential windows over a ground storey
// with a recessed entrance, a stone base course, a belt course at the storey line, a stone coping on the roofline and
// a dark roof membrane. The lidar roof reads 6 or 7 blocks, half and half: smoothed into one flat tier at 7.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC59875.cells.json`, "utf8"));   // [x, z, ground, roof]

const X = 7, Z = 13, TOP = 7;          // the roof surface is 7 blocks above y 0; walls and coping fill y 0..6
const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);
const wall = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
const isDoor = (x, z) => z === 0 && x === 3;

// Window spots: the front (z 0) has sash windows either side of the entrance, upstairs also over it; the back (z 12)
// has three; the side walls have five, one per bay. The corners and the piers between windows stay brick.
function windowAt(x, z, upper) {
  if (z === 0) return [1, 5].includes(x) || (upper && x === 3);
  if (z === Z - 1) return [1, 3, 5].includes(x);
  if (x === 0 || x === X - 1) return [2, 4, 6, 8, 10].includes(z);
  return false;
}

// A pane runs along the wall it sits in: east-west on the front and back, north-south on the sides.
const pane = (x, z) => (z === 0 || z === Z - 1)
  ? { east: "true", west: "true", north: "false", south: "false" }
  : { east: "false", west: "false", north: "true", south: "true" };

const g = new Voxels([X, 19, Z]);

for (const [x, z] of cells) {
  const w = wall(x, z);
  const door = isDoor(x, z);

  // Base course: stone at y 0 under everything, the entrance cut through it as the door's lower half.
  if (door) g.set(x, 0, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  else g.set(x, 0, z, "stone_bricks");

  // Ground storey (y 1..2): the entrance door and a lintel over it, sash windows, brick between.
  if (w) {
    if (door) {
      g.set(x, 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, 2, z, "chiseled_stone_bricks");
    } else for (const y of [1, 2]) {
      if (windowAt(x, z, false)) g.set(x, y, z, "glass_pane", pane(x, z));
      else g.set(x, y, z, "bricks");
    }
  }

  // Belt course at the storey line (y 3): a stone band on the walls, the floor slab of the upper storey inside.
  g.set(x, 3, z, w ? "smooth_stone" : "oak_planks");

  // Upper storey (y 4..5): sash windows on the walls, brick between, air inside.
  if (w) for (const y of [4, 5]) {
    if (windowAt(x, z, true)) g.set(x, y, z, "glass_pane", pane(x, z));
    else g.set(x, y, z, "bricks");
  }

  // Roofline (y 6): a stone coping on the walls with chiselled corbels every other block, a dark membrane inside.
  g.set(x, 6, z, w ? ((x + z) % 2 === 0 ? "chiseled_stone_bricks" : "stone_bricks") : "black_concrete");
}

// Lamps standing on the upper floor just inside four lit windows (y 4), so the glass glows at dusk.
for (const [x, z] of [[1, 1], [5, 1], [3, 11], [1, 6]]) {
  g.set(x, 4, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof equipment: a small condenser box on the membrane, one block above the coping.
for (const [x, z] of [[2, 9], [3, 9], [2, 10], [3, 10]]) g.set(x, TOP, z, "light_gray_concrete");

const out = g.save(`${DIR}/DC59875.nbt`);
console.log(`DC59875.nbt: ${out.blocks} blocks, palette ${out.palette}`);
