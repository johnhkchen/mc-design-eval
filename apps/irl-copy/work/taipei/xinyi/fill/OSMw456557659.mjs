import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw456557659.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw456557659.nbt";

const W = 20, H = 33, D = 13;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Footprint lookup and ground heights
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Base level: highest footprint ground, so every storey stands on a common floor
const G = Math.max(...cells.map(c => c[2]));
const minX = Math.min(...cells.map(c => c[0])), maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1])), maxZ = Math.max(...cells.map(c => c[1]));

const STOREYS = 4;
const ROOF = G + 5 * STOREYS; // roof slab level (G+20)

// Door: north-facing perimeter cell nearest the middle of the front
let doorCell = null;
for (const [x, z] of cells) {
  if (has(x, z - 1)) continue;
  const a = x - minX;
  if (a % 3 === 0 || x === maxX) continue; // not a pier
  if (!doorCell || Math.abs(x - 10) < Math.abs(doorCell[0] - 10)) doorCell = [x, z];
}

// Foundation and plinth: solid from y 0 up to the common base level
for (const [x, z] of cells) {
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
}

for (const [x, z] of cells) {
  const faces = [];
  if (!has(x, z - 1)) faces.push("north");
  if (!has(x, z + 1)) faces.push("south");
  if (!has(x - 1, z)) faces.push("west");
  if (!has(x + 1, z)) faces.push("east");

  if (faces.length === 0) {
    // Interior: floor slabs for storeys 2-4 and the roof slab
    for (let s = 1; s < STOREYS; s++) put(x, G + 5 * s, z, "light_gray_concrete");
    put(x, ROOF, z, "smooth_quartz");
    continue;
  }

  // Perimeter: facade
  const corner = faces.length >= 2;
  let pier = corner;
  if (!corner) {
    const f = faces[0];
    if (f === "north" || f === "south") {
      const a = x - minX;
      pier = a % 3 === 0 || x === maxX;
    } else {
      const a = z - minZ;
      pier = a % 3 === 0 || z === maxZ;
    }
  }

  for (let s = 0; s < STOREYS; s++) {
    const yb = G + 5 * s;
    put(x, yb, z, s === 0 ? "polished_granite" : "light_gray_concrete");
    for (let dy = 1; dy <= 3; dy++) {
      put(x, yb + dy, z, pier ? "white_concrete" : (s === 0 ? "cyan_stained_glass" : "light_blue_stained_glass"));
    }
    put(x, yb + 4, z, "smooth_quartz"); // storey line / cornice band
  }

  // Parapet and cap
  put(x, ROOF, z, "white_concrete");
  put(x, ROOF + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance door on the north front
if (doorCell) {
  const [dx, dz] = doorCell;
  put(dx, G, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, G + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm lights behind the glass on the north and south rows of interior cells
for (let s = 0; s < STOREYS; s++) {
  const y = G + 5 * s + 2;
  const id = s === 0 ? "glowstone" : "shroomlight";
  for (const [x, z] of cells) {
    if (x % 6 !== 1) continue;
    const interiorRow = (z === 1 || z === maxZ - 1);
    if (!interiorRow) continue;
    if (has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z)) {
      put(x, y, z, id);
    }
  }
}

// Roof penthouse on interior cells, if the height allows
const topPH = ROOF + 4; // G+24
if (topPH <= H - 1) {
  for (const [x, z] of cells) {
    const interior = has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z);
    if (!interior) continue;
    if (x < 6 || x > 13 || z < 4 || z > 8) continue;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "light_gray_concrete");
    put(x, topPH, z, "smooth_quartz");
  }
}

g.save(OUT);
