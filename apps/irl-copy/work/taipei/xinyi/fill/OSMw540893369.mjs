import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 13 x 10, roof ~11 blocks above lowest ground.
// Read as a 1990s mid-rise Taipei commercial/residential block: two storeys of
// 5 blocks, cream quartz and grey-stone base, light-blue glazing in quartz piers,
// a shopfront at street level with a red canopy over the entrance, a grey roof
// deck with a plain parapet and a few AC units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540893369";
const W = 13, H = 23, D = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const B = Math.max(0, ...ground.values()); // floor level = highest footprint ground
let maxZ = 0;
for (const k of ground.keys()) maxZ = Math.max(maxZ, Number(k.split(",")[1]));

// guarded placement: footprint cells only, inside the volume
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const slab = (type) => ({ type, waterlogged: "false" });

// Perimeter: a footprint cell with a neighbour outside the footprint.
const isEdgeZ = (x, z) => !has(x, z - 1) || !has(x, z + 1); // north/south face
const isEdgeX = (x, z) => !has(x - 1, z) || !has(x + 1, z); // east/west face
const isPerim = (x, z) => isEdgeZ(x, z) || isEdgeX(x, z);
// Piers (quartz columns) at corners and every third bay; glazing between.
function isPier(x, z) {
  if (isEdgeZ(x, z) && isEdgeX(x, z)) return true;
  if (isEdgeZ(x, z)) return x % 3 === 0;
  return z % 3 === 0;
}
// Inward neighbour, used for lamps behind the glass.
function inward(x, z) {
  if (!has(x, z - 1)) return [x, z + 1];
  if (!has(x, z + 1)) return [x, z - 1];
  if (!has(x - 1, z)) return [x + 1, z];
  return [x - 1, z];
}

// 1. Foundation: solid from y 0 up to the floor level under every cell.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");
}

// 2. Floor slabs (interior and perimeter) at B, B+5, B+10 (roof deck).
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  put(x, B, z, "smooth_quartz");
  put(x, B + 5, z, "smooth_quartz");
  put(x, B + 10, z, "gray_concrete");
}

// 3. Storey walls.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const pier = isPier(x, z);

  // Ground storey: base course, glazed shopfront, spandrel.
  put(x, B + 1, z, "polished_andesite");
  for (const y of [B + 2, B + 3]) {
    put(x, y, z, pier ? "smooth_quartz" : "light_blue_stained_glass_pane");
  }
  put(x, B + 4, z, "smooth_quartz");

  // Upper storey: glazing between quartz spandrels.
  put(x, B + 6, z, "smooth_quartz");
  for (const y of [B + 7, B + 8]) {
    put(x, y, z, pier ? "smooth_quartz" : "light_blue_stained_glass_pane");
  }
  put(x, B + 9, z, "smooth_quartz");

  // Parapet and cap.
  put(x, B + 11, z, "smooth_quartz");
  put(x, B + 12, z, "smooth_quartz_slab", slab("bottom"));
}

// 4. Entrance on the south (max z) face: door, red canopy over it.
const doorX = 6;
if (has(doorX, maxZ)) {
  put(doorX, B + 1, maxZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, B + 2, maxZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}
for (const x of [doorX - 1, doorX, doorX + 1]) {
  put(x, B + 4, maxZ, "red_concrete");
}

// 5. Warm light behind some windows (glowstone one cell inside the glass).
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z) || isPier(x, z)) continue;
  if ((x + z) % 4 !== 0) continue;
  const [ix, iz] = inward(x, z);
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  put(ix, B + 2, iz, "glowstone");
}

// 6. Roof equipment: AC plant and a small mast.
for (const [x, z] of [[3, 4], [9, 4], [6, 2], [6, 7]]) {
  put(x, B + 11, z, "iron_block");
}
{
  const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
  const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);
  if (has(cx, cz)) {
    put(cx, B + 11, cz, "lightning_rod");
    put(cx, B + 12, cz, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
