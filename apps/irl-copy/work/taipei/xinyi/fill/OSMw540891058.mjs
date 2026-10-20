import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540891058";
const W = 34, D = 33, H = 23;
const ROOF = 11;          // roof deck level above y 0 (lidar: ~11 blocks above lowest ground)
const FLOOR = 5;          // storey line between the two storeys (~5 blocks per storey)
const CORNICE = 10;       // cornice band under the parapet

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const gmap = new Map();
for (const [x, z, gy] of cells) {
  gmap.set(`${x},${z}`, Math.max(0, Math.min(H - 1, gy)));
}
const has = (x, z) => gmap.has(`${x},${z}`);

// Exterior faces of a footprint cell: n = -z, s = +z, w = -x, e = +x
function exteriorFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
}

// Main entrance: centred on the middle of the north-facing street frontage
const northXs = cells.filter(([x, z]) => !has(x, z - 1)).map(([x]) => x);
const entMid = northXs.length
  ? (Math.min(...northXs) + Math.max(...northXs)) / 2
  : null;

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Facade block for a perimeter cell at height y. u = coordinate along the wall.
function facadeAt(y, u, gy, face, ent) {
  // Entrance door (dark oak, two blocks high) on the north frontage
  if (ent && face === "n" && y < FLOOR && Math.abs(u - entMid) < 1) {
    if (y === gy)
      return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (y === gy + 1)
      return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (y === ROOF) return ["smooth_stone"];                 // parapet cap
  if (y === CORNICE) return ["quartz_block"];              // cornice
  if (y === gy) return ["polished_granite"];               // base course

  if (y < FLOOR) {
    // Ground storey: shopfront with pillars, glass and a signage band
    if (y === 4) {
      if (ent && face === "n" && Math.abs(u - entMid) <= 2.5)
        return ["dark_oak_slab", { type: "top", waterlogged: "false" }]; // entrance canopy
      return ["light_gray_concrete"];
    }
    if (u % 3 === 0) return ["white_concrete"];
    return ["light_blue_stained_glass"];
  }

  if (y === FLOOR) return ["smooth_quartz"];               // storey line

  // Upper storey
  if (u % 3 === 0) return ["white_concrete"];              // pillars
  if (y === 6 || y === 9) return ["light_gray_concrete"];  // spandrels
  // Warm lights in some windows at dusk
  const warm = ((u + (face === "n" || face === "s" ? 0 : 5)) % 4 === 0) && y === 7;
  if (warm) return ["glowstone"];
  return ["light_blue_stained_glass_pane"];
}

// 1. Foundation: solid from y 0 up to each cell's ground
for (const [x, z, gy0] of cells) {
  const gy = Math.max(0, Math.min(H - 1, gy0));
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
}

// 2. Walls, floors and roof for each footprint cell
for (const [x, z, gy0] of cells) {
  const gy = Math.max(0, Math.min(H - 1, gy0));
  const faces = exteriorFaces(x, z);
  const ext = faces.length > 0;
  const face = faces[0];
  const u = face === "n" || face === "s" ? x : z;

  if (!ext) {
    // Interior: no rooms, just air with a floor slab per storey and a roof deck
    put(x, gy, z, "smooth_stone");                  // ground storey floor
    if (FLOOR > gy) put(x, FLOOR, z, "smooth_stone"); // upper floor slab
    put(x, ROOF, z, "gray_concrete");               // roof deck
    continue;
  }

  // Exterior: facade column from the ground up to the parapet
  for (let y = gy; y <= ROOF; y++) {
    const [id, props] = facadeAt(y, u, gy, face, entMid !== null);
    put(x, y, z, id, props);
  }
}

// 3. Rooftop plant: 3x3 mechanical boxes standing on the roof deck
for (const [x, z] of cells) {
  if (x % 8 !== 4 || z % 8 !== 4) continue;
  let full = true;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (!has(x + dx, z + dz)) full = false;
  if (!full) continue;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      put(x + dx, ROOF + 1, z + dz, "light_gray_concrete");
      put(x + dx, ROOF + 2, z + dz, "light_gray_concrete");
    }
  put(x, ROOF + 3, z, "chain");
}

g.save(`${DIR}/${ID}.nbt`);
