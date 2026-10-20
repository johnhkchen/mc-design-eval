import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-century commercial block: white concrete frame, quartz belt
// courses, glazed shopfront with a central door, upper-storey window grid,
// cornice and parapet, rooftop plant. Lanterns behind glass give dusk glow.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458002";
const W = 12, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Which face a perimeter cell sits on, its position along that face, and the inward direction.
function faceInfo(x, z) {
  if (!has(x, z - 1)) return { i: x, inward: [0, 1] };
  if (!has(x, z + 1)) return { i: x, inward: [0, -1] };
  if (!has(x - 1, z)) return { i: z, inward: [1, 0] };
  return { i: z, inward: [-1, 0] };
}

// Entrance: the front (lowest-z) edge cell at x = 5.
let entZ = null;
for (const [x, z] of cells) {
  if (x === 5 && !has(5, z - 1) && (entZ === null || z < entZ)) entZ = z;
}

const LANTERN = { hanging: "false", waterlogged: "false" };
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

// Pass 1: foundation, plinth, floor slabs, roof and cornice for every footprint cell.
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, edge ? "polished_granite" : "smooth_stone");          // base course / ground slab
  if (5 > gr) put(x, 5, z, edge ? "smooth_quartz" : "smooth_stone");   // storey line / floor slab
  if (10 > gr) put(x, 10, z, edge ? "smooth_quartz" : "light_gray_concrete"); // cornice / roof deck
  if (edge) put(x, 11, z, "white_concrete");                          // parapet
}

// Pass 2: walls, windows, door, canopy and lights on perimeter cells.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const { i, inward } = faceInfo(x, z);
  const pier = i % 3 === 0;
  const isEntrance = x === 5 && z === entZ;
  const onEntryFace = !has(x, z - 1) && z === entZ;

  // Storey 1: shopfront, y = gr+1 .. gr+4
  for (let y = gr + 1; y <= gr + 4; y++) {
    if (pier) { put(x, y, z, "white_concrete"); continue; }
    if (y === gr + 4) { put(x, y, z, "smooth_quartz"); continue; }
    put(x, y, z, "glass");
  }
  if (isEntrance) {
    put(x, gr + 1, z, "dark_oak_door", { ...DOOR, half: "lower" });
    put(x, gr + 2, z, "dark_oak_door", { ...DOOR, half: "upper" });
    put(x, gr + 3, z, "glass");
  }
  if (onEntryFace && i >= 4 && i <= 6) put(x, gr + 4, z, "dark_oak_planks"); // canopy lintel

  // Storey 2: window grid, y = 6 .. 9
  if (6 > gr) {
    put(x, 6, z, pier ? "white_concrete" : "smooth_quartz");
    put(x, 7, z, pier ? "white_concrete" : "light_blue_stained_glass");
    put(x, 8, z, pier ? "white_concrete" : "light_blue_stained_glass");
    put(x, 9, z, pier ? "white_concrete" : "smooth_quartz");
  }

  // Warm light behind some glass (lanterns standing on the interior floor).
  const ix = x + inward[0], iz = z + inward[1];
  if (has(ix, iz) && !isEdge(ix, iz)) {
    const igr = ground.get(`${ix},${iz}`);
    if (!pier && i % 6 === 1 && 6 > igr) put(ix, 6, iz, "lantern", LANTERN);
    if (!pier && i % 6 === 4 && gr + 1 > igr && gr + 1 < 5) put(ix, gr + 1, iz, "lantern", LANTERN);
  }
}

// Pass 3: rooftop plant on interior roof cells.
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  const onPlant =
    (x >= 3 && x <= 4 && z >= 4 && z <= 5) ||
    (x >= 7 && x <= 8 && z >= 9 && z <= 10);
  if (onPlant && 10 > gr) put(x, 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
