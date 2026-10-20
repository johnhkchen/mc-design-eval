import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise office block, c. 1990s Taipei: 7 storeys of 5 blocks,
// white tiled and concrete facades, blue-tinted glazing, quartz storey lines,
// a shopfront ground storey with a lobby on the south face, and a plant
// penthouse with a mast on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw911579014";
const W = 32, H = 47, D = 52;
const ROOF = 35;          // roof slab sits 35 blocks above the lowest ground
const PARAPET_TOP = 36;   // one-block parapet above the roof slab

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  g.set(x, y, z, id);
}

// A facade cell has at least one 4-neighbour outside the footprint.
// Returns the outward normal, inward normal, and position along the face.
function faceInfo(x, z) {
  const miss = [];
  if (!has(x - 1, z)) miss.push([-1, 0]);
  if (!has(x + 1, z)) miss.push([1, 0]);
  if (!has(x, z - 1)) miss.push([0, -1]);
  if (!has(x, z + 1)) miss.push([0, 1]);
  if (!miss.length) return null;
  const [dx, dz] = miss[0];
  return {
    out: [dx, dz],
    inward: [-dx, -dz],
    along: dx !== 0 ? z : x,
  };
}

// 1. Walls, floors, foundations and roof, cell by cell.
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  if (gr > ROOF) continue;
  const fi = faceInfo(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, fi ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }

    if (!fi) {
      // Interior: floor slab at each storey line and at the ground floor.
      if (y % 5 === 0 || y === gr) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Facade rows.
    const r = y % 5;
    const k = Math.floor(y / 5);
    const a = fi.along;
    const [ndx, ndz] = fi.out;
    const entrance = ndz === 1 && ndx === 0 && a >= 13 && a <= 18;

    let id;
    if (y === 0) {
      id = "stone_bricks";                          // plinth
    } else if (r === 0) {
      id = "smooth_quartz";                         // storey line
    } else if (r === 4) {
      id = k === 0 ? "smooth_quartz" : "white_concrete"; // fascia / spandrel
    } else if (k === 0) {
      // Ground storey shopfront, rows 1..3.
      if (entrance && r <= 2) id = "glass";
      else if (entrance && r === 3) id = "smooth_quartz"; // lobby canopy
      else if (a % 4 === 0) id = "white_concrete";        // pier
      else id = "light_blue_stained_glass";
    } else {
      // Office windows, rows 1..3, with vertical mullions every 3 cells.
      id = a % 3 === 0 ? "white_concrete" : "light_blue_stained_glass";
    }
    put(x, y, z, id);

    // Warm lights in some windows, placed in the air gap behind the glass.
    if (k >= 1 && k % 2 === 1 && r === 2 && a % 6 === 1) {
      const ix = x + fi.inward[0];
      const iz = z + fi.inward[1];
      if (has(ix, iz) && !faceInfo(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }

  // Parapet course above the roof on the facade.
  if (fi) put(x, PARAPET_TOP, z, "white_concrete");
}

// 2. Roof plant penthouse and mast, only on footprint cells.
const PH = { x0: 9, x1: 22, z0: 16, z1: 35 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!has(x, z)) continue;
    const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      put(x, y, z, edge ? "light_gray_concrete" : "gray_concrete");
    }
    if (edge) put(x, ROOF + 4, z, "smooth_quartz"); // plant cap
  }
}

// Antenna mast standing on the penthouse.
if (has(15, 25)) {
  for (let y = ROOF + 4; y <= ROOF + 9; y++) put(15, y, 25, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
