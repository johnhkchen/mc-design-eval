import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, Xinyi, c. 1980s:
// dark granite base, white-tiled piers, glass-and-spandrel bays,
// red sign fascia on the ground floor, parapet roof with plant boxes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343784";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Bounds-checked setter; props optional.
function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Outward faces of a footprint cell (sides with no neighbour in footprint).
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}
const isEdge = (x, z) => has(x, z) && faces(x, z).length > 0;

// Inward neighbour across the facade (for light placement behind glass).
function inward(x, z, f) {
  let dx = 0, dz = 0;
  if (f.includes("north")) dz = 1;
  else if (f.includes("south")) dz = -1;
  else if (f.includes("west")) dx = 1;
  else if (f.includes("east")) dx = -1;
  return [x + dx, z + dz];
}

// 1. Foundations, floor slabs (storey lines) and roof slab on every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr + 5, z, "smooth_quartz");   // second-floor slab / storey line
  put(x, gr + 10, z, "smooth_quartz");  // roof slab
}

// 2. Facade walls on edge cells, rows relative to each cell's ground b.
for (const [x, z, b] of cells) {
  const f = faces(x, z);
  if (f.length === 0) continue;

  const ns = f.includes("north") || f.includes("south");
  const ew = f.includes("east") || f.includes("west");
  const corner = ns && ew;
  const along = ns ? x : z;
  const pier = corner || along % 3 === 0;

  // Glass panes connect along the wall they sit in.
  const paneProps = ns
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  put(x, b + 1, z, "polished_granite");   // base course
  put(x, b + 4, z, "red_concrete");       // ground-floor sign fascia
  put(x, b + 9, z, "smooth_quartz");      // second-floor spandrel / head

  if (pier) {
    put(x, b + 2, z, "white_concrete");
    put(x, b + 3, z, "white_concrete");
    put(x, b + 6, z, "white_concrete");
    put(x, b + 7, z, "white_concrete");
    put(x, b + 8, z, "white_concrete");
  } else {
    put(x, b + 2, z, "glass_pane", paneProps);
    put(x, b + 3, z, "glass_pane", paneProps);
    put(x, b + 6, z, "light_gray_concrete");  // window sill
    put(x, b + 7, z, "glass_pane", paneProps);
    put(x, b + 8, z, "glass_pane", paneProps);
  }
}

// 3. Entrance: steel street door on the south-facing bay nearest x = 6.
let door = null;
let bestScore = Infinity;
for (const [x, z, b] of cells) {
  if (!isEdge(x, z)) continue;
  const f = faces(x, z);
  if (f.length !== 1) continue;                     // not a corner
  if (!f.includes("south")) continue;
  if (x % 3 === 0) continue;                        // keep it on a window bay
  const score = Math.abs(x - 6);
  if (score < bestScore) { bestScore = score; door = [x, z, b, f[0]]; }
}
if (!door) {
  // Fallback: any non-corner edge bay nearest x = 6.
  for (const [x, z, b] of cells) {
    if (!isEdge(x, z)) continue;
    const f = faces(x, z);
    if (f.length !== 1 || x % 3 === 0 && f[0] !== "west" && f[0] !== "east") continue;
    const score = Math.abs(x - 6) + Math.abs(z - 14);
    if (score < bestScore) { bestScore = score; door = [x, z, b, f[0]]; }
  }
}
if (door) {
  const [x, z, b, face] = door;
  put(x, b + 1, z, "iron_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, b + 2, z, "iron_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, b + 3, z, "lantern", { hanging: "true", waterlogged: "false" }); // lamp under fascia
}

// 4. Warm light behind glass: shroomlights upstairs, glowstone in the shop bays.
for (const [x, z, b] of cells) {
  if (!isEdge(x, z)) continue;
  const f = faces(x, z);
  if (f.length !== 1) continue;
  if (x % 3 === 0 || z % 3 === 0) continue;         // only window bays
  const [ix, iz] = inward(x, z, f);
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  if ((x + z) % 3 === 0) put(ix, b + 7, iz, "shroomlight");
  else if ((x + z) % 4 === 1) put(ix, b + 2, iz, "glowstone");
}

// 5. Roof: parapet cap on edge cells, plant/AC enclosure in the middle.
for (const [x, z, b] of cells) {
  if (isEdge(x, z)) {
    put(x, b + 11, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else if (x >= 4 && x <= 5 && z >= 5 && z <= 6) {
    put(x, b + 11, z, "light_gray_concrete");
    if (x === 4 && z === 5) put(x, b + 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
