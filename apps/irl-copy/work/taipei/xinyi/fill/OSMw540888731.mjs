import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record for this building. Read from the lidar roof height (~11 blocks above the
// lowest ground) and the footprint: a two-storey post-war Taipei mid-rise (about 1960s-80s)
// with a white-tiled concrete frame, a ground-floor shopfront on the street face, a
// stone-base course, a projecting band between storeys, a cornice, a parapet, and
// rooftop water tank and condenser units.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888731.cells.json", "utf8"));

const W = 9, H = 23, D = 17;
const ROOF = 11;      // roof surface y (about 11 blocks above lowest ground)
const SLAB = 5;       // storey floor line between ground and upper storey
const SILL = 6;       // upper storey sill band
const LINTEL = 9;     // upper storey lintel
const SHOP_TOP = 4;   // ground storey fascia

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!has(x, z)) return;                 // build only on footprint cells
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }; // on a west/east face
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }; // on a north/south face

// Pass 1: foundations and footprint-wide floors/roof.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// Pass 2: body, per cell.
for (const [x, z, gr] of cells) {
  if (gr >= ROOF) continue;
  const exN = !has(x, z - 1), exS = !has(x, z + 1), exW = !has(x - 1, z), exE = !has(x + 1, z);
  const faces = [exN, exS, exW, exE].filter(Boolean).length;
  const perim = faces > 0;
  const corner = faces >= 2;
  const street = exS;   // south (z max) faces the street

  // index along the exposed face and its length, to place pillars every 3 blocks
  let i = 0, L = 1, onXFace = false;
  if (exS || exN) { i = x; L = W; } else if (exW || exE) { i = z; L = D; onXFace = true; }
  const pillar = corner || i % 3 === 0 || i === L - 1;

  // base course at ground
  put(x, gr, z, perim ? "smooth_stone" : "smooth_stone");

  // ground storey (gr+1 .. 4)
  for (let y = gr + 1; y <= SHOP_TOP; y++) {
    if (!perim) break;
    if (y === SHOP_TOP) { put(x, y, z, pillar ? "white_concrete" : "light_gray_concrete"); continue; }
    if (street) {
      put(x, y, z, pillar ? "white_concrete" : "glass");
    } else {
      put(x, y, z, pillar ? "white_concrete" : "glass_pane", pillar ? undefined : (onXFace ? paneNS : paneEW));
    }
  }

  // storey line
  put(x, SLAB, z, "light_gray_concrete");

  // upper storey (6 .. 10)
  if (perim) {
    put(x, SILL, z, "light_gray_concrete");
    for (const y of [7, 8]) {
      put(x, y, z, pillar ? "white_concrete" : "glass_pane", pillar ? undefined : (onXFace ? paneNS : paneEW));
    }
    put(x, LINTEL, z, "white_concrete");
    put(x, 10, z, "white_concrete");
  }

  // cornice, parapet, cap
  put(x, ROOF, z, perim ? "stone_bricks" : "gray_concrete");
  if (perim) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Warm lights behind upper windows (glowstone on the inward cell) and a lantern in the shopfront.
for (const [x, z, gr] of cells) {
  if (gr >= ROOF) continue;
  const exN = !has(x, z - 1), exS = !has(x, z + 1), exW = !has(x - 1, z), exE = !has(x + 1, z);
  if (!(exN || exS || exW || exE)) continue;
  let i = (exN || exS) ? x : z;
  const isWin = !(corner(x, z)) && i % 3 !== 0 && i !== ((exN || exS) ? W - 1 : D - 1);
  if (!isWin || i % 6 !== 1) continue;
  let dx = 0, dz = 0;
  if (exN) dz = 1; else if (exS) dz = -1; else if (exW) dx = 1; else if (exE) dx = -1;
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz) && !has(ix - dx, iz - dz) === false) {
    put(ix, 7, iz, "glowstone");
  }
}
function corner(x, z) {
  const n = [!has(x, z - 1), !has(x, z + 1), !has(x - 1, z), !has(x + 1, z)].filter(Boolean).length;
  return n >= 2;
}

// Street-face entrance: door at the centre bay, with a warm lantern just inside.
const doorX = 4, doorZ = D - 1;
if (has(doorX, doorZ)) {
  const dg = gnd(doorX, doorZ);
  if (dg + 1 < ROOF) {
    put(doorX, dg + 1, doorZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(doorX, dg + 2, doorZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(doorX, dg + 1, doorZ - 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof equipment: water tank, condenser units, lightning rod.
for (let y = ROOF + 1; y <= ROOF + 3; y++) {
  put(2, y, 3, "iron_block"); put(3, y, 3, "iron_block");
  put(2, y, 4, "iron_block"); put(3, y, 4, "iron_block");
}
put(2, ROOF + 4, 3, "smooth_stone"); put(3, ROOF + 4, 3, "smooth_stone");
put(2, ROOF + 4, 4, "smooth_stone"); put(3, ROOF + 4, 4, "smooth_stone");
put(6, ROOF + 1, 10, "iron_block"); put(6, ROOF + 1, 11, "iron_block");
put(6, ROOF + 2, 10, "light_gray_concrete"); put(6, ROOF + 2, 11, "light_gray_concrete");
put(4, ROOF + 1, 13, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888731.nbt");
