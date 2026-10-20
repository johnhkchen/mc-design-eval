import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414145.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414145.nbt";

const W = 25, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Record: no name, lidar roof ~11 blocks above lowest ground, 25x15 footprint.
// Reads as a two-storey, tile-clad commercial block of the 1980s-90s Xinyi
// streetscape: stone plinth, warm quartz-white walls, glass shopfront,
// a stone band between storeys, a cornice and a plain parapet with roof plant.

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const cells = raw.map((c) => (Array.isArray(c) ? c : [c.x, c.z, c.ground]));

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, gr);
}
const inside = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// outward face of a perimeter cell (first found), or null
function outward(x, z) {
  if (!inside(x, z - 1)) return "north";
  if (!inside(x, z + 1)) return "south";
  if (!inside(x - 1, z)) return "west";
  if (!inside(x + 1, z)) return "east";
  return null;
}

const inwardStep = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Pick a single entrance: the north-face cell nearest the middle of the run.
let doorKey = null;
{
  const northCells = [];
  for (const [key] of ground) {
    const [x, z] = key.split(",").map(Number);
    if (outward(x, z) === "north") northCells.push(x);
  }
  if (northCells.length) {
    northCells.sort((a, b) => a - b);
    const mid = northCells[Math.floor(northCells.length / 2)];
    const zmin = Math.min(...northCells.map(() => 0));
    doorKey = `${mid},${findNorthZ(mid)}`;
  }
}
function findNorthZ(x) {
  for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1)) return z;
  return 0;
}

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundation, floors, roof deck, perimeter walls.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const face = outward(x, z);
  if (!face) {
    // interior: floor slabs for each storey and roof deck
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    continue;
  }

  // perimeter wall column, index along the run for pier rhythm
  const idx = face === "north" || face === "south" ? x : z;
  const pier = idx % 3 === 0;
  const isDoor = key === doorKey;

  // k = offset above this cell's ground
  // 0 plinth, 1 spandrel, 2-3 shopfront/window, 4 band,
  // 5 storey line, 6 spandrel, 7-8 windows, 9 spandrel,
  // 10 cornice, 11 parapet
  const wallId = "smooth_quartz";

  put(x, gr, z, "stone_bricks"); // plinth

  put(x, gr + 1, z, wallId); // lower spandrel / door base handled below

  if (isDoor) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "glass_pane", paneProps(face));
  } else if (pier) {
    put(x, gr + 2, z, wallId);
    put(x, gr + 3, z, wallId);
  } else {
    put(x, gr + 2, z, "glass_pane", paneProps(face));
    put(x, gr + 3, z, "glass_pane", paneProps(face));
  }

  put(x, gr + 4, z, "stone_bricks"); // fascia / band under storey 1
  put(x, gr + 5, z, wallId); // storey line

  put(x, gr + 6, z, wallId); // spandrel
  if (pier) {
    put(x, gr + 7, z, wallId);
    put(x, gr + 8, z, wallId);
  } else {
    put(x, gr + 7, z, "glass_pane", paneProps(face));
    put(x, gr + 8, z, "glass_pane", paneProps(face));
  }
  put(x, gr + 9, z, wallId);

  // cornice: quartz slab, top half, on the wall line
  put(x, gr + 10, z, "quartz_slab", { type: "top", waterlogged: "false" });
  // parapet
  put(x, gr + 11, z, wallId);
}

// Pass 2: warm light behind some ground and upper windows (one block inside the glass).
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const face = outward(x, z);
  if (!face) continue;
  const idx = face === "north" || face === "south" ? x : z;
  if (idx % 3 === 0) continue;
  if (key === doorKey) continue;
  if (idx % 6 !== 1 && idx % 6 !== 4) continue;
  const [dx, dz] = inwardStep[face];
  const ix = x + dx, iz = z + dz;
  if (!inside(ix, iz)) continue;
  put(ix, gr + 2, iz, "glowstone");
  if (idx % 2 === 0) put(ix, gr + 7, iz, "glowstone");
}

// Pass 3: roof plant on the deck, a couple of parapet-height boxes.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (outward(x, z)) continue;
  if (x % 5 === 2 && z % 4 === 1) {
    put(x, gr + 11, z, "stone_bricks");
  }
}

g.save(OUT);
