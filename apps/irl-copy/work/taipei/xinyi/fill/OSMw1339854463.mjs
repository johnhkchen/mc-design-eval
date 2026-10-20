import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1970s-80s Xinyi commercial block: stone plinth, shopfront ground floor,
// white-tiled upper storeys with blue-tinted glass bands, cornice and parapet,
// a rooftop water tank, and warm lights behind the glass at dusk.
const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339854463";
const cells = JSON.parse(readFileSync(base + ".cells.json", "utf8"));

const W = 8, H = 19, D = 12;
const g = new Voxels([W, H, D]);

const k = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(k(x, z), gr);

const inside = (x, z) => ground.has(k(x, z));
const isEdge = (x, z) =>
  inside(x, z) && (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1));
const isCorner = (x, z) =>
  isEdge(x, z) &&
  (!inside(x - 1, z) || !inside(x + 1, z)) &&
  (!inside(x, z - 1) || !inside(x, z + 1));

// Entrance: on the lowest-z exterior face, nearest the middle of its run.
let entrance = null;
{
  const edgeCells = cells.filter(([x, z]) => isEdge(x, z));
  const minZ = Math.min(...edgeCells.map(([, z]) => z));
  const row = edgeCells.filter(([, z]) => z === minZ).map(([x, z]) => [x, z]);
  const xs = row.map(([x]) => x).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  const pick = row.reduce((best, c) =>
    Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best);
  entrance = { x: pick[0], z: pick[1], gr: ground.get(k(pick[0], pick[1])) };
}

const WALL = "white_concrete";
const TRIM = "light_gray_concrete";
const CAP = "smooth_stone";
const GLASS = "light_blue_stained_glass";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const DECK = "gray_concrete";
const FLOOR = "smooth_stone";

for (const [x, z, gr] of cells) {
  // Foundation fill from y 0 up to this cell's ground, then the plinth course.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Roof level: about 7 blocks above lowest ground, clamped to keep the tank in the world.
  const T = Math.min(Math.max(7, gr + 4), 16);

  if (!isEdge(x, z)) {
    // Interior: ground floor slab, storey floor, roof deck. No rooms, just air behind glass.
    g.set(x, gr, z, FLOOR);
    if (gr + 4 < T) g.set(x, gr + 4, z, FLOOR);
    g.set(x, T, z, DECK);
    // Warm light behind upper glass in a staggered pattern.
    if (((x + z) % 3 === 0) && gr + 6 <= T - 2) {
      g.set(x, gr + 6, z, "shroomlight");
    }
    continue;
  }

  const corner = isCorner(x, z);
  const isDoorCell = entrance && x === entrance.x && z === entrance.z;

  for (let y = gr; y < T; y++) {
    let b;
    if (y === gr) b = BASE;                                  // plinth course
    else if (y <= gr + 2) b = corner ? TRIM : GLASS;         // shopfront band
    else if (y === gr + 3) b = WALL;                         // transom / canopy band
    else if (y === gr + 4) b = TRIM;                         // storey line / cornice
    else if (y === T - 1) b = TRIM;                          // frieze under parapet
    else b = corner ? TRIM : GLASS;                          // upper windows
    g.set(x, y, z, b);
  }
  // Parapet cap.
  g.set(x, T, z, CAP);

  if (isDoorCell && gr + 2 < T) {
    g.set(x, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

// Shop lantern just inside the entrance.
if (entrance) {
  const ly = entrance.gr + 1;
  const lz = entrance.z + 1;
  if (inside(entrance.x, lz) && !isEdge(entrance.x, lz)) {
    g.set(entrance.x, ly, lz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Rooftop water tank on the deck, if the footprint has room for it.
{
  const T = Math.min(Math.max(7, 0), 16);
  // Find the highest deck among interior cells near the middle.
  const tankCells = [[2, 4], [3, 4], [2, 5], [3, 5]].filter(([x, z]) => inside(x, z) && !isEdge(x, z));
  for (const [x, z] of tankCells) {
    const gr = ground.get(k(x, z));
    const deck = Math.min(Math.max(7, gr + 4), 16);
    g.set(x, deck + 1, z, "oak_planks");
    g.set(x, deck + 2, z, "oak_planks");
  }
}

g.save(base + ".nbt");
