import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1970s-80s Taipei commercial block: two storeys of white tiled
// concrete over a stone plinth, shopfront glazing at street level, punched
// window bands above, a light spandrel line per storey, a grey parapet and a
// small plant box on the roof. Each cell is its own column on its own ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612586";
const W = 20, H = 23, D = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const DOOR_LOWER = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [x, z, gr] of cells) {
  const gc = Math.round(gr);

  // Foundation under every cell, then ground-level floor slab.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");
  put(x, gc, z, "smooth_stone");

  const xEdge = !has(x - 1, z) || !has(x + 1, z);
  const zEdge = !has(x, z - 1) || !has(x, z + 1);
  const boundary = xEdge || zEdge;

  // Floor and roof slabs on every cell (interior floors, roof deck).
  put(x, gc + 5, z, "light_gray_concrete");
  put(x, gc + 10, z, "light_gray_concrete");
  put(x, gc + 11, z, "light_gray_concrete");

  if (!boundary) continue;

  const corner = xEdge && zEdge;
  // Windows: on north/south faces use x pattern, on east/west faces use z pattern.
  let winPos = false;
  let inDx = 0, inDz = 0;
  if (!corner) {
    if (zEdge) {
      winPos = x % 3 !== 0;
      inDz = z === 0 ? 1 : -1;
    } else {
      winPos = z % 3 !== 0;
      inDx = x === 0 ? 1 : -1;
    }
  }

  // Walls: tiled concrete, piers at corners, spandrel bands per storey.
  for (let y = gc + 1; y <= gc + 10; y++) {
    put(x, y, z, corner ? "light_gray_concrete" : "white_concrete");
  }
  put(x, gc + 5, z, "light_gray_concrete");
  put(x, gc + 10, z, "light_gray_concrete");

  // Ground floor shopfront: glazing in bays, stone piers between.
  for (let y = gc + 1; y <= gc + 3; y++) {
    if (corner) put(x, y, z, "stone_bricks");
    else if (winPos) put(x, y, z, "glass_pane");
    else put(x, y, z, "stone_bricks");
  }
  // Upper storey windows.
  if (!corner && winPos) {
    for (let y = gc + 6; y <= gc + 9; y++) put(x, y, z, "glass_pane");
  }

  // Parapet along the roof edge.
  put(x, gc + 12, z, "gray_concrete");

  // Warm lights behind some glass, on interior cells just inside the wall.
  const ix = x + inDx, iz = z + inDz;
  if (!corner && winPos && has(ix, iz)) {
    if ((x + z) % 4 === 0) put(ix, gc + 7, iz, "glowstone");
    else if (x % 6 === 1 && ((x + z) % 4 !== 0)) put(ix, gc + 2, iz, "shroomlight");
  }
}

// Entrance on the front (south, high-z) face: two-leaf door bay with a lintel.
for (const [x, z, gr] of cells) {
  const gc = Math.round(gr);
  if (!(x === 9 || x === 10)) continue;
  if (has(x, z + 1)) continue;
  put(x, gc + 1, z, "air");
  put(x, gc + 2, z, "air");
  put(x, gc + 1, z, "dark_oak_door", DOOR_LOWER);
  put(x, gc + 2, z, "dark_oak_door", DOOR_UPPER);
  put(x, gc + 3, z, "dark_oak_planks");
}

// Roof plant box on interior roof cells near the middle.
for (const [x, z, gr] of cells) {
  const gc = Math.round(gr);
  const interior = has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
  if (!interior) continue;
  if (x >= 7 && x <= 8 && z >= 4 && z <= 5) {
    put(x, gc + 12, z, "iron_block");
    put(x, gc + 13, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
