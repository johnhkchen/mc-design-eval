// Way 813759346: a two-storey Edwardian brick commercial block (c. 1910-1930) on a flat site, the Mt Eden / Dominion Road
// shopfront type. Plan from the cells file: 11 x 8 footprint; the main block roof reads 7 blocks above y 0, so the walls
// rise y 0..6, the quartz cornice and roof deck sit on y 7 (8 blocks tall). Cells the lidar reads at 0-1 are the rear
// yard and a single-course low wall. Front (north face, z 0) is the shopfront: dark-oak fascia, glass, a door at x 3.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_813759346.cells.json", "utf8"));
const g = new Voxels([11, 20, 8]);

const roof = new Map(), ground = new Map();
for (const [x, z, gr, r] of cells) { roof.set(`${x},${z}`, r); ground.set(`${x},${z}`, gr); }
const inF = (x, z) => roof.has(`${x},${z}`);
const tall = (x, z) => inF(x, z) && roof.get(`${x},${z}`) >= 5;       // the main block, not the yard or the low wall
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

// exterior faces of a tall cell: a side open to the air, the yard or a lower roof
const exposed = (x, z) => Object.keys(DIRS).filter(d => { const [dx, dz] = DIRS[d]; return !tall(x + dx, z + dz); });

const BRICK = "bricks", STONE = "stone_bricks", QUARTZ = "quartz_block", FLOOR = "smooth_stone", FASCIA = "dark_oak_planks";
const DOOR_X = 3;

for (const [x, z, gr] of cells) {
  const base = gr;                                 // every cell: solid from the ground up to its base course
  g.set(x, base, z, STONE);                        // plinth / yard paving
  if (!tall(x, z)) continue;                       // yard and low wall stop here
  const ext = exposed(x, z), front = ext.includes("north");
  const perim = ext.length > 0;

  g.set(x, 4, z, perim ? QUARTZ : FLOOR);          // string course and upper floor slab
  g.set(x, 7, z, perim ? QUARTZ : FLOOR);          // cornice and roof deck
  if (front) g.set(x, 8, z, QUARTZ);               // street parapet on the front

  if (!perim) continue;                            // interior: air behind the glass, floors only
  for (let y = 1; y <= 6; y++) {
    if (y === 4 || y === 7) continue;
    if (y === 3) { g.set(x, y, z, front ? FASCIA : BRICK); continue; }   // shopfront fascia / lintel band
    if (y <= 2) {
      if (front && x === DOOR_X) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (front || (x + z) % 2 === 0) g.set(x, y, z, "glass_pane");   // shopfront glass; side windows alternate
      else g.set(x, y, z, BRICK);
      continue;
    }
    // upper floor: the street face is ribbon glazing, the other faces a window per cell with brick piers between
    if (front || (x + z) % 2 === 0) g.set(x, y, z, "glass_pane"); else g.set(x, y, z, BRICK);
  }
}

// rooftop plant room on the interior cells (sits on the deck at y 7)
for (const [x, z] of [[3, 4], [4, 4], [3, 5], [4, 5]]) if (tall(x, z)) g.set(x, 8, z, STONE);

// warm light behind the upper windows of the front: a lantern on the interior floor, air around it
for (const [x, z] of cells) {
  if (!tall(x, z) || (x + z) % 2 !== 0 || !exposed(x, z).includes("north")) continue;   // only behind a glass pane
  const [ix, iz] = [x, z + 1];
  if (tall(ix, iz) && exposed(ix, iz).length === 0) g.set(ix, 5, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// glass panes connect to the solid neighbours they stand against (walls, panes, the door), as vanilla draws them
for (let x = 0; x < 11; x++) for (let y = 0; y < 20; y++) for (let z = 0; z < 8; z++) {
  const b = g.get(x, y, z);
  if (!b || b.block !== "minecraft:glass_pane") continue;
  const st = {};
  for (const [d, [dx, dz]] of Object.entries(DIRS)) st[d] = g.get(x + dx, y, z + dz) ? "true" : "false";
  g.set(x, y, z, "glass_pane", st);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_813759346.nbt");
