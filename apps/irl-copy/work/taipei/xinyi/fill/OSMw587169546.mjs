import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169546";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 41, D = 31;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// Materials: 1990s Taipei office block, pale grey concrete, blue-tinted glazing, white piers
const FOUND = "stone_bricks";
const WALL = "light_gray_concrete";
const PIER = "white_concrete";
const GLASS = "light_blue_stained_glass";
const LINE = "smooth_stone";
const ROOF = "gray_concrete";
const CANOPY = "light_gray_concrete";

const ROOF_Y = 29;      // roof slab level (about 29 above lowest ground)
const CORNICE_Y = 28;
const PENT_BASE = 30;
const PENT_TOP = 34;

const put = (x, y, z, id, props) => g.set(x, y, z, id, props);

// Perimeter: any side with no neighbouring footprint cell
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Penthouse core: a central block of the roof, interior of the footprint
const CORE = (x, z) => x >= 3 && x <= 9 && z >= 6 && z <= 24 && has(x, z);
const corePerim = (x, z) => CORE(x, z) && (!CORE(x - 1, z) || !CORE(x + 1, z) || !CORE(x, z - 1) || !CORE(x, z + 1));

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const per = isPerim(x, z);

  // Facade index along the face: pier rhythm runs along the wall
  const onXFace = !has(x - 1, z) || !has(x + 1, z);
  const idx = onXFace ? z : x;

  // Inward direction (for placing light behind a window)
  let inX = 0, inZ = 0;
  if (!has(x - 1, z)) inX = 1;
  else if (!has(x + 1, z)) inX = -1;
  else if (!has(x, z - 1)) inZ = 1;
  else if (!has(x, z + 1)) inZ = -1;

  const frontEntrance = z === 0 && x >= 5 && x <= 7 && !has(x, -1) === true;
  const isDoorCol = z === 0 && x === 6;

  // Body from ground to the roof slab
  for (let y = gr; y <= ROOF_Y; y++) {
    if (y === ROOF_Y) {
      put(x, y, z, per ? WALL : ROOF);
      continue;
    }

    if (y === CORNICE_Y) {
      if (per) put(x, y, z, LINE);
      continue;
    }

    // Storey lines (floor slabs) at 5, 10, 15, 20, 25 — interior and exterior
    if (y > 0 && y % 5 === 0 && y < CORNICE_Y) {
      put(x, y, z, LINE);
      continue;
    }

    if (!per) continue; // interior: air gap, no interiors

    const sf = y < gr + 3; // shopfront band: 3 blocks above ground

    if (sf) {
      // Ground-floor shopfront
      if (isDoorCol && y === gr) { put(x, y, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (isDoorCol && y === gr + 1) { put(x, y, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (isDoorCol && y === gr + 2) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      if (z === 0 && x >= 5 && x <= 7) { put(x, y, z, GLASS); continue; }
      put(x, y, z, idx % 3 === 0 ? PIER : GLASS);
      continue;
    }

    // Canopy over the entrance
    if (z === 0 && x >= 5 && x <= 7 && y === gr + 3) { put(x, y, z, CANOPY); continue; }

    const r = y % 5;
    if (r === 1 || r === 2 || r === 3) {
      // Window band
      if (idx % 3 === 0) { put(x, y, z, PIER); continue; }
      put(x, y, z, GLASS);
      // Warm light behind some windows (in the interior cell, if it exists)
      if (idx % 6 === 1 && r === 2) {
        const ix = x + inX, iz = z + inZ;
        if (has(ix, iz) && !isPerim(ix, iz)) put(ix, y, iz, "glowstone");
      }
      continue;
    }

    // Spandrel
    put(x, y, z, WALL);
  }
}

// Penthouse / mechanical core on the roof
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (!CORE(x, z)) continue;
  const edge = corePerim(x, z);
  for (let y = PENT_BASE; y <= PENT_TOP; y++) {
    if (y === PENT_TOP) { put(x, y, z, ROOF); continue; }
    if (!edge) continue;
    if (y === 31 || y === 32) {
      put(x, y, z, (x + z) % 3 === 0 ? PIER : GLASS);
    } else {
      put(x, y, z, WALL);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
