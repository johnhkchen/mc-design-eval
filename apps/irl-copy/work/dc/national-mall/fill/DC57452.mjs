// DC57452: a 1920s Classical Revival office block on the Mall (Indiana-limestone walls, granite-grey base and
// string courses, a 2-storey body under a roof terrace with a parapet, and a 10-block corner tower at the north-west).
// Footprint from DC57452.cells.json: y 0 is the ground (all cells at 0); storeys are 2 blocks (window row + floor slab).
// Walls are the footprint's perimeter cells; interior cells are air apart from the floor slabs, so windows sit in front
// of air. Lidar's 5-6 body heights are smoothed to one tier of 6; the 10-high tower stands on the 2 north-west cells.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57452.cells.json", "utf8"));
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => foot.has(`${x},${z}`);
const perim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const corner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
const tower = (x, z) => foot.get(`${x},${z}`).roof > 6;

const BODY = 6, SIZE_Y = 11;
const DOOR = { x: 1, z: 6 };                                    // the south face's only footprint cell: the entrance
const glassAt = (x, z) => !corner(x, z) && (x + z) % 2 === 0;   // every other bay on a face is glass, corners are pilasters
const litAt = (x, y, z) => y === 3 && glassAt(x, z) && (2 * x + z) % 5 === 0;   // a few warm lit windows on the upper storey

// placements: [x, y, z, block, state?]; panes are connected after, so they are collected first
const out = new Map();
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, { x, y, z, block, state });

for (const [key, { ground }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const edge = perim(x, z), top = tower(x, z) ? 10 : BODY;
  const storeyRow = (y) => {
    if (!edge) return;
    if (glassAt(x, z)) put(x, y, z, litAt(x, y, z) ? "glowstone" : "glass_pane");
    else put(x, y, z, "calcite");
  };
  for (let y = ground; y < BODY; y++) {
    if (y === 0) edge ? put(x, y, z, "stone_bricks") : put(x, y, z, "smooth_stone");   // base course / ground slab
    else if (y === 1 || y === 3) { if (edge) storeyRow(y); }                             // storey rows: windows and pilasters
    else if (y === 2) edge ? put(x, y, z, "stone_bricks") : put(x, y, z, "smooth_stone");   // string course / floor slab
    else if (y === 4) edge ? put(x, y, z, "chiseled_stone_bricks") : put(x, y, z, "smooth_stone"); // cornice / roof deck
    else if (y === 5 && edge) put(x, y, z, "stone_bricks");                               // parapet
  }
  if (top === 10) {                                                                       // the tower: 5 blocks above the body
    for (let y = BODY; y < 10; y++) {
      if (y === 6 || y === 8) put(x, y, z, "glass");   // a 2-wide tower reads as a stack of gaps with thin panes: full glass
      else put(x, y, z, y === 9 ? "chiseled_stone_bricks" : "stone_bricks");
    }
  }
}

// the entrance: a dark-oak door in the south wall, lower and upper half, opening onto the air behind it
put(DOOR.x, 1, DOOR.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(DOOR.x, 2, DOOR.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
// a lit tower window and the roof equipment: a lantern and a lightning rod on the tower, two AC units on the terrace
put(0, 6, 0, "glowstone");
put(0, 10, 0, "lantern", { hanging: "false", waterlogged: "false" });
put(1, 10, 0, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
put(2, 5, 3, "stone_bricks");   // two plant boxes on the terrace (iron blocks read as stray white cubes)
put(3, 5, 4, "stone_bricks");

// pane connections: a pane joins any neighbour in its plane (a pane, a wall block, a glowstone)
const at = (x, y, z) => out.get(`${x},${y},${z}`);
for (const p of out.values()) {
  if (p.block !== "glass_pane") continue;
  p.state = {
    north: String(!!at(p.x, p.y, p.z - 1)), south: String(!!at(p.x, p.y, p.z + 1)),
    east: String(!!at(p.x + 1, p.y, p.z)), west: String(!!at(p.x - 1, p.y, p.z)), waterlogged: "false",
  };
}

const g = new Voxels([5, SIZE_Y, 7]);
for (const p of out.values()) g.set(p.x, p.y, p.z, p.block, p.state);
const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57452.nbt");
console.log(`DC57452: ${blocks} blocks, ${palette} palette entries`);
