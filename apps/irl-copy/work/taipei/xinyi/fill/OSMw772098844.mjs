import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098844";
const W = 21, H = 23, D = 24;

// Record: roof ~11 blocks above lowest ground. Reads as a 2-storey mid-century
// commercial block: white concrete frame, stone base, glazed bays, parapet cap.
const ROOF = 11;   // roof slab top for the lowest ground
const FLOOR = 5;   // floor/belt level between storeys (absolute y)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

function S(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function isEdge(x, z) {
  return !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
}

function info(x, z) {
  const edge = isEdge(x, z);
  const alongX = !has(x, z - 1) || !has(x, z + 1);
  const alongZ = !has(x - 1, z) || !has(x + 1, z);
  const corner = alongX && alongZ;
  const idx = alongX ? x : z;
  const pier = corner || idx % 3 === 0;
  return { edge, alongX, alongZ, corner, idx, pier };
}

const groundOf = (x, z) => Math.min(gnd(x, z), H - 9);
const roofOf = (gr) => Math.max(ROOF, gr + 1);

// Pass 1: foundations, floors, roofs, walls, parapets
for (const [x, z] of cells) {
  const gr = groundOf(x, z);
  const roofY = roofOf(gr);
  const f = info(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone");

  if (!f.edge) {
    // interior: floor slab at storey line (if at/above ground), roof slab, air between
    if (gr <= FLOOR) S(x, FLOOR, z, "smooth_stone");
    S(x, roofY, z, "smooth_stone");
    continue;
  }

  // exterior shell
  for (let y = gr; y < roofY; y++) {
    let id = "white_concrete", p;
    if (f.pier) {
      id = "white_concrete";
    } else if (y === gr) {
      id = "stone_bricks";                       // plinth / base course
    } else if (y < FLOOR) {
      if (y <= gr + 2) id = "glass";             // shopfront glazing
      else id = "white_concrete";                // ground-floor spandrel
    } else if (y === FLOOR) {
      id = "smooth_stone";                       // storey belt course
    } else if (y === FLOOR + 1) {
      id = "stone_brick_slab";                   // window sill
      p = { type: "bottom", waterlogged: "false" };
    } else if (y < 10) {
      id = "light_blue_stained_glass_pane";      // upper glazing
      p = f.alongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    } else {
      id = "white_concrete";                     // lintel band
    }
    S(x, y, z, id, p);
  }

  // roof edge: slab top, parapet, cap
  S(x, roofY, z, "smooth_stone");
  S(x, roofY + 1, z, "white_concrete");
  S(x, roofY + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

// Pass 2: rooftop equipment (small AC plant boxes on interior cells)
for (const [x, z, gr0] of cells) {
  const gr = groundOf(x, z);
  const roofY = roofOf(gr);
  const f = info(x, z);
  if (f.edge) continue;
  if (x >= 4 && x <= 16 && z >= 4 && z <= 19 && (x + z) % 7 === 0) {
    S(x, roofY + 1, z, "light_gray_concrete");
  }
}

// Pass 3: entrance door on the north (minimum z) street frontage, and lanterns behind windows
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const northRow = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
if (northRow.length) {
  const dx = northRow[Math.floor(northRow.length / 2)];
  const dz = minZ;
  const gr = groundOf(dx, dz);
  if (gr + 2 < FLOOR) {
    S(dx, gr + 1, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    S(dx, gr + 2, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

for (const [x, z] of cells) {
  const f = info(x, z);
  if (!f.edge || f.pier || f.corner) continue;
  if (f.idx % 6 !== 1) continue;
  const gr = groundOf(x, z);
  if (gr > FLOOR) continue;
  // inward neighbour (interior cell behind this window)
  let ix = x, iz = z;
  if (!has(x, z - 1)) iz = z + 1;
  else if (!has(x, z + 1)) iz = z - 1;
  else if (!has(x - 1, z)) ix = x + 1;
  else if (!has(x + 1, z)) ix = x - 1;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  S(ix, FLOOR + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
