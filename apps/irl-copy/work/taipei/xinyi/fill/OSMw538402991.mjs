import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century Xinyi-style commercial block: two storeys of 5 blocks on a stone base,
// white concrete frame with tinted glazing, shopfront at street level, cornice and parapet.
// Roof deck at y=10, parapet to y=10 (roof surface reads ~11 above lowest ground).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538402991";
const W = 12, H = 23, D = 37;
const ROOF = 10;          // roof deck / parapet top layer
const CORNICE = 9;        // top of second storey window band
const STOREY_LINE = 5;    // second-floor spandrel and slab
const GF_FASCIA = 4;      // ground-floor fascia band

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Footprint extents for entrance placement
let minZ = Infinity, maxZ = -Infinity;
for (const [, z] of cells) { minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const entranceX = frontXs[Math.floor(frontXs.length / 2)];

const isPerimeter = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

// 1. Foundations, floor slabs, interiors (air), roof deck
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // ground-floor slab
  put(x, gr, z, "smooth_stone");
  // second-floor slab (interior); perimeter gets spandrel below
  if (STOREY_LINE > gr) put(x, STOREY_LINE, z, "light_gray_concrete");
  // roof deck
  if (ROOF > gr) put(x, ROOF, z, "light_gray_concrete");
}

// 2. Perimeter walls: base course, storey bands, pilasters, glazing, entrance
for (const [x, z, gr] of cells) {
  if (!isPerimeter(x, z)) continue;

  const missing = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const corner = missing.length > 1;
  const [odx, odz] = missing[0];                 // outward normal of primary face
  const zFace = odz !== 0;
  const along = zFace ? x : z;
  const pilaster = corner || along % 3 === 0;
  const isEntrance = odz === -1 && z === minZ && along === entranceX;
  const inward = [x - odx, z - odz];
  const inwardOk = has(inward[0], inward[1]) && !isPerimeter(inward[0], inward[1]);

  for (let y = gr; y <= ROOF; y++) {
    // base course
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }
    // roof parapet
    if (y === ROOF) { put(x, y, z, "white_concrete"); continue; }
    // ground-floor fascia and second-floor spandrel
    if (y === GF_FASCIA) { put(x, y, z, "smooth_stone"); continue; }
    if (y === STOREY_LINE) { put(x, y, z, "white_concrete"); continue; }
    // cornice above second storey
    if (y === CORNICE) { put(x, y, z, "smooth_stone"); continue; }

    const inGF = y > gr && y < GF_FASCIA;
    const inSF = y > STOREY_LINE && y < CORNICE;
    if (!inGF && !inSF) continue;

    if (isEntrance && inGF) {
      if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === gr + 2) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "white_concrete"); // lintel over door
      continue;
    }

    if (pilaster) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass");
  }

  // Warm light behind some second-floor glazing
  if (inwardOk && !pilaster && along % 6 === 1) {
    put(inward[0], 7, inward[1], "glowstone");
  }
  // Warm light behind some shopfront glazing
  if (inwardOk && !pilaster && along % 4 === 2 && !isEntrance) {
    put(inward[0], gr + 2, inward[1], "glowstone");
  }
}

// 3. Rooftop equipment on the roof deck
const roofBox = (x0, x1, z0, z1, y0, y1, id) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!has(x, z) || isPerimeter(x, z)) continue;
    for (let y = y0; y <= y1; y++) put(x, y, z, id);
  }
};
// condenser units
roofBox(2, 4, 10, 11, ROOF + 1, ROOF + 1, "light_gray_concrete");
roofBox(7, 9, 10, 11, ROOF + 1, ROOF + 1, "iron_block");
// stair / service housing: shell with solid top
for (let x = 6; x <= 9; x++) for (let z = 24; z <= 27; z++) {
  if (!has(x, z) || isPerimeter(x, z)) continue;
  const edge = x === 6 || x === 9 || z === 24 || z === 27;
  for (let y = ROOF + 1; y <= ROOF + 3; y++) {
    if (y === ROOF + 3) put(x, y, z, "light_gray_concrete");
    else if (edge) put(x, y, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
