import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831857632.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831857632.nbt";

// Record: 23 x 43 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey (about 5 blocks per storey) mid-century / 1990s-style
// commercial block: stone plinth, shopfront at street level, glazed upper
// storey with concrete piers, cornice band, parapet and rooftop plant.
const W = 23, H = 23, D = 43;
const LINE = 5;   // storey slab (top of ground storey)
const DECK = 10;  // roof deck
const ROOF = 11;  // parapet top

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const fp = new Map();
for (const [x, z, gr] of cells) fp.set(x + "," + z, gr);
const has = (x, z) => fp.has(x + "," + z);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Inward neighbour for a perimeter cell (the footprint cell opposite a missing neighbour).
function inward(x, z) {
  if (!has(x - 1, z) && has(x + 1, z)) return [x + 1, z];
  if (!has(x + 1, z) && has(x - 1, z)) return [x - 1, z];
  if (!has(x, z - 1) && has(x, z + 1)) return [x, z + 1];
  if (!has(x, z + 1) && has(x, z - 1)) return [x, z - 1];
  return null;
}

// Entrance: middle of the street-facing (lowest z) edge.
const minZ = Math.min(...cells.map(c => c[1]));
const doorXs = cells.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
const doorX = doorXs[Math.floor(doorXs.length / 2)];
const doorZ = minZ;
const doorG = fp.get(doorX + "," + doorZ);

// Pass 1: foundations, floor slabs, roof deck, walls.
for (const [x, z, gr] of cells) {
  const per = isPerim(x, z);

  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slab at the storey line and roof deck, across the whole footprint.
  if (gr < LINE) g.set(x, LINE, z, "smooth_stone");
  if (gr < DECK) g.set(x, DECK, z, "smooth_stone");

  if (!per) {
    // Rooftop plant on a grid of interior cells.
    if (gr < DECK && x % 5 === 2 && z % 7 === 3) {
      g.set(x, ROOF, z, "light_gray_concrete");
      g.set(x, ROOF + 1, z, "light_gray_concrete");
    }
    continue;
  }

  const corner = (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
  const pierG = corner || (x + z) % 4 === 0;
  const pierU = corner || (x + z) % 3 === 0;

  for (let y = gr; y <= ROOF; y++) {
    let id;
    if (y === gr) id = "stone_bricks";                       // base course
    else if (y < LINE) id = pierG ? "white_concrete" : "glass"; // shopfront
    else if (y === LINE) id = "smooth_stone";                  // storey line
    else if (y < DECK) {                                       // upper storey
      if (y === 6 || y === 9) id = "white_concrete";           // head and sill frames
      else id = pierU ? "white_concrete" : "glass_pane";
    }
    else if (y === DECK) id = "white_concrete";                // cornice
    else id = "stone_brick_wall";                              // parapet cap
    g.set(x, y, z, id);
  }

  // Warm light behind some upper windows, on the floor slab inside.
  if (!pierU && (x + z) % 6 === 1) {
    const inn = inward(x, z);
    if (inn && gr < LINE) g.set(inn[0], 6, inn[1], "glowstone");
  }
}

// Pass 2: entrance, door and lintel on the street face.
{
  const gy = doorG;
  g.set(doorX, gy, doorZ, "stone_bricks");
  g.set(doorX, gy + 1, doorZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, gy + 2, doorZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, gy + 3, doorZ, "smooth_stone");              // lintel over door
  g.set(doorX, gy + 4, doorZ, "smooth_stone");
  // Warm light just inside the entrance.
  const inn = inward(doorX, doorZ);
  if (inn) g.set(inn[0], Math.max(gy, 0) + 1, inn[1], "shroomlight");
}

g.save(OUT);
