import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw587169555";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 50, H = 41, D = 40;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground index
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inFp = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

const L = Math.min(...cells.map((c) => Math.round(c[2])));
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Vertical datum rows (absolute y), 5-block storeys, 6-block ground storey
const FLOORS = [L + 6, L + 11, L + 16, L + 21]; // slab rows
const CORN = L + 25;   // cornice course
const ROOF = L + 26;   // roof slab / parapet base
const PAR_TOP = L + 28; // parapet top
const RODY = L + 29;   // lightning rod / plant top

function set(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Classify perimeter cells: outward direction, pier/window pattern
function outwardDirs(x, z) {
  const d = [];
  if (!inFp(x, z - 1)) d.push({ facing: "north", dx: 0, dz: -1, axis: "x" });
  if (!inFp(x, z + 1)) d.push({ facing: "south", dx: 0, dz: 1, axis: "x" });
  if (!inFp(x - 1, z)) d.push({ facing: "west", dx: -1, dz: 0, axis: "z" });
  if (!inFp(x + 1, z)) d.push({ facing: "east", dx: 1, dz: 0, axis: "z" });
  return d;
}

// 1. Foundations: solid from y 0 up to each cell's ground
for (const [x, z, graw] of cells) {
  const gg = Math.round(graw);
  for (let y = 0; y < gg; y++) set(x, y, z, "stone");
}

// 2. Interior: floor slabs per storey, ground floor slab, roof slab
for (const [x, z] of cells) {
  const gg = gr(x, z);
  if (outwardDirs(x, z).length > 0) continue;
  set(x, gg, z, "smooth_stone");
  for (const fr of FLOORS) if (fr > gg) set(x, fr, z, "smooth_stone");
  if (ROOF > gg) set(x, ROOF, z, "gray_concrete");
}

// 3. Perimeter facade
const doorX = Math.floor((minX + maxX) / 2);
const doorZ = minZ;
const doorCell = inFp(doorX, doorZ) ? { x: doorX, z: doorZ } : null;

for (const [x, z] of cells) {
  const dirs = outwardDirs(x, z);
  if (dirs.length === 0) continue;
  const gg = gr(x, z);
  const prim = dirs[0];
  const along = prim.axis === "x" ? x : z;
  const corner = dirs.length >= 2;
  const pier = corner || along % 3 === 0;
  const inwardX = x - prim.dx, inwardZ = z - prim.dz;

  for (let y = gg; y <= PAR_TOP; y++) {
    let block = null;
    if (y <= gg + 1) block = "polished_granite";              // base course
    else if (y === CORN) block = "stone_bricks";              // cornice
    else if (y === ROOF) block = "white_concrete";            // roof edge
    else if (y > ROOF) block = "white_concrete";              // parapet
    else if (FLOORS.includes(y)) block = "light_gray_concrete"; // spandrel
    else block = pier ? "white_concrete" : "light_blue_stained_glass";
    if (block) set(x, y, z, block);
  }

  // Warm light behind selected windows (glowstone in the air gap)
  for (const fr of [...FLOORS, L + 0]) {
    const mid = fr + 2;
    if (mid < gg + 2 || mid > CORN - 1) continue;
    if (mid < L + 6 && fr !== L) continue; // ground storey uses the same mid row
    const isWindow = !pier;
    if (isWindow && along % 6 === 2 && inFp(inwardX, inwardZ) && outwardDirs(inwardX, inwardZ).length === 0) {
      set(inwardX, mid, inwardZ, "glowstone");
    }
  }
}

// Ground-floor glow for the first storey (mid of ground storey)
for (const [x, z] of cells) {
  const dirs = outwardDirs(x, z);
  if (dirs.length === 0) continue;
  const gg = gr(x, z);
  const prim = dirs[0];
  const along = prim.axis === "x" ? x : z;
  const pier = dirs.length >= 2 || along % 3 === 0;
  const ix = x - prim.dx, iz = z - prim.dz;
  if (!pier && along % 6 === 2 && inFp(ix, iz) && outwardDirs(ix, iz).length === 0) {
    set(ix, gg + 3, iz, "glowstone");
  }
}

// 4. Entrance on the north face at the midpoint
if (doorCell) {
  const { x, z } = doorCell;
  const gg = gr(x, z);
  const dirs = outwardDirs(x, z);
  if (dirs.some((d) => d.facing === "north")) {
    set(x, gg, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, gg + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Flanking piers and a glass transom above the door
    set(x - 1, gg + 2, z, "white_concrete");
    set(x + 1, gg + 2, z, "white_concrete");
    set(x, gg + 2, z, "light_blue_stained_glass");
    // Hanging lantern in the lobby above the door
    if (inFp(x, z + 1)) set(x, gg + 4, z + 1, "chain");
    set(x, gg + 4, z + 1, "lantern", { hanging: "true" });
  }
}

// 5. Roof plant: mechanical penthouse, rod, and rooftop units
const pxA = minX + 12, pxB = maxX - 12, pzA = minZ + 10, pzB = maxZ - 10;
for (let x = pxA; x <= pxB; x++) {
  for (let z = pzA; z <= pzB; z++) {
    if (!inFp(x, z)) continue;
    const ring = x === pxA || x === pxB || z === pzA || z === pzB;
    if (ring) {
      set(x, ROOF + 1, z, "light_gray_concrete");
      set(x, PAR_TOP, z, "light_gray_concrete");
    }
    set(x, PAR_TOP, z, "gray_concrete");
  }
}
// Small rooftop units on the leftover roof
for (let x = minX + 4; x <= minX + 8; x++) {
  for (let z = minZ + 4; z <= minZ + 7; z++) {
    if (inFp(x, z)) set(x, ROOF + 1, z, "iron_block");
  }
}
// Lightning rod at the centre of the penthouse
const cx = Math.floor((minX + maxX) / 2), cz = Math.floor((minZ + maxZ) / 2);
if (inFp(cx, cz)) set(cx, RODY, cz, "lightning_rod", { facing: "up" });

g.save(`${dir}/${id}.nbt`);
