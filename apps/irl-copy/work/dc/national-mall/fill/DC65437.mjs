// DC65437: 1721 7th St NW (Religious). A brick Gothic Revival church, early 20th century. The nave runs east-west
// under a slate roof with its gable ends to the street (west), a stone-trimmed tower on the NW corner to 9 blocks,
// a lean-to aisle along the south side, a low annex on the SW corner and a short apse stub to the east.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65437.cells.json`, "utf8"));
const raw = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const has = (x, z) => raw.has(`${x},${z}`);

// Clean heights (blocks above y 0). The nave ridge runs east-west, so the lidar's profile along z (x 2..14) is the
// roof: eaves at z 0 and 7, ridge at z 4. The x=1 and x=15 columns read 1 and 4 at the laser's edge, so the gable
// ends take the same profile. The NW tower is 9 blocks, the lean-to and apse stub 4, the annex as lidar gives it.
const NAVE = [4, 6, 7, 8, 9, 8, 7, 5];
const TOWER = [[1, 0], [2, 0], [1, 1], [2, 1]];
const inTower = (x, z) => TOWER.some(([a, b]) => a === x && b === z);
function roofH(x, z) {
  if (inTower(x, z)) return 9;
  if (z <= 7 && x >= 1 && x <= 15) return NAVE[z];
  if (z === 8 && x >= 5 && x <= 15) return 4;
  if (x === 16) return 4;
  return raw.get(`${x},${z}`);
}

const g = new Voxels([17, 21, 11]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// The outer shell: the street-facing gables (x 1 and 15), the eaves (z 0 and 7, the lean-to is against z 7), and any
// cell with a neighbour missing from the footprint. The rest is interior: air y1..3, a floor at y4, a deck to the roof.
const perimeter = (x, z) => x === 1 || x === 15 || z === 0 || z === 7 || !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const pitched = (x, z) => z <= 7 && x >= 2 && x <= 14;   // the nave's slope; gables and flat parts take a slab

function cap(x, z, H) {
  if (pitched(x, z)) put(x, H - 1, z, "deepslate_tile_stairs", { facing: z <= 3 ? "north" : "south", half: "bottom", shape: "straight", waterlogged: "false" });
  else put(x, H - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (inTower(x, z)) continue;
  const H = roofH(x, z);
  const gable = x === 1 || x === 15;
  put(x, 0, z, "stone_bricks");                                   // base course, the floor of the ground storey
  if (perimeter(x, z)) {
    for (let y = 1; y <= (gable ? H - 1 : H - 2); y++) put(x, y, z, "bricks");   // gables stand solid to their top
    if (!gable) cap(x, z, H);
  } else if (H >= 6) {
    put(x, 4, z, "stone_bricks");                                 // floor slab
    for (let y = 5; y <= H - 2; y++) put(x, y, z, "stone_bricks"); // deck under the roof
    cap(x, z, H);
  } else {
    for (let y = 1; y <= H - 1; y++) put(x, y, z, "stone_bricks"); // too low for a room: solid
    cap(x, z, H);
  }
}

// Tower: solid to 8 on a stone cornice, a deepslate top, belfry openings on the north and west faces.
for (const [x, z] of TOWER) {
  put(x, 0, z, "stone_bricks");
  for (let y = 1; y <= 6; y++) put(x, y, z, "bricks");
  put(x, 7, z, "stone_bricks");
  put(x, 8, z, "deepslate_tiles");
}
for (const y of [5, 6]) { put(2, y, 0, "air"); put(1, y, 1, "air"); }
put(1, 9, 0, "end_rod", { facing: "up" });

// Glazing: every pane has air or a room behind it (the nave interior, the annex, the aisle).
const panes = [];
const pane = (x, y, z) => { put(x, y, z, "glass_pane", {}); panes.push([x, y, z]); };

// North eave (z 0): six lancets in the wall, stone piers between, lanterns in the nave behind three of them.
for (const x of [4, 6, 8, 10, 12, 14]) for (const y of [1, 2]) pane(x, y, 0);
for (const x of [3, 5, 7, 9, 11, 13, 15]) for (const y of [1, 2]) put(x, y, 0, "stone_bricks");
for (const x of [4, 8, 12]) put(x, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

// South lean-to aisle: five windows, with the nave wall opened behind them so the glass has air behind it.
for (const x of [6, 8, 10, 12, 14]) {
  put(x, 1, 7, "air"); put(x, 2, 7, "air");
  for (const y of [1, 2]) pane(x, y, 8);
}
for (const x of [5, 7, 9, 11, 13, 15]) for (const y of [1, 2]) put(x, y, 8, "stone_bricks");

// SW annex: windows on its west and south faces, a lantern inside.
for (const z of [8, 9]) for (const y of [1, 2]) pane(0, y, z);
for (const x of [1, 2, 3]) for (const y of [1, 2]) pane(x, y, 10);
put(1, 1, 9, "lantern", { hanging: "false", waterlogged: "false" });

// West gable (the street facade): a double dark-oak door in a stone surround, a stone string course across the gable.
for (const z of [3, 4]) {
  const hinge = z === 3 ? "left" : "right";
  put(1, 1, z, "dark_oak_door", { facing: "west", half: "lower", hinge, open: "false", powered: "false" });
  put(1, 2, z, "dark_oak_door", { facing: "west", half: "upper", hinge, open: "false", powered: "false" });
  put(1, 3, z, "stone_bricks");
}
for (const z of [2, 5]) for (const y of [1, 2, 3]) put(1, y, z, "stone_bricks");
for (const z of [2, 3, 4, 5]) put(1, 4, z, "stone_bricks");
// the gable's stone lancet panel over the door: a pointed-looking stone light in the brick, with pilasters either side
for (const z of [3, 4]) for (const y of [5, 6]) put(1, y, z, "stone_bricks");
for (const z of [2, 3, 4, 5]) put(15, 4, z, "stone_bricks");
for (const y of [1, 2]) for (const z of [3, 4]) put(16, y, z, "stone_bricks");

// Each pane links to a neighbouring pane or a solid wall block, so the bars read as a frame in the wall.
const SOLID = new Set(["minecraft:bricks", "minecraft:stone_bricks", "minecraft:deepslate_tiles", "minecraft:glass_pane"]);
for (const [x, y, z] of panes) {
  const link = (dx, dz) => { const n = g.get(x + dx, y, z + dz); return String(!!n && SOLID.has(n.block)); };
  put(x, y, z, "glass_pane", { east: link(1, 0), west: link(-1, 0), north: link(0, -1), south: link(0, 1), waterlogged: "false" });
}

const info = g.save(`${DIR}/DC65437.nbt`);
console.log(`DC65437.nbt: ${info.blocks} blocks, ${info.palette} palette entries`);
