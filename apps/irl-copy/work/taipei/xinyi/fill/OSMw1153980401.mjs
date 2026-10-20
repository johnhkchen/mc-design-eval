import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980401";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 15 x 13, roof about 11 blocks above lowest ground.
// Two storeys of about 5 blocks, stone-clad base, quartz-tile and
// light-glass facade typical of late-20th-century Taipei office blocks.
const W = 15, H = 23, D = 13;
const ROOF = 11;      // parapet cap top
const CORNICE = 10;   // cornice band and roof deck
const FLOOR = 5;      // storey line between ground and upper floor
const GF_LINTEL = 4;  // top of shopfront glazing
const UF_SILL = 6;    // upper storey sill
const UF_LINTEL = 9;  // upper storey head

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.round(gr)));
}
const has = (x, z) => ground.has(key(x, z));

// Footprint extents for pattern offsets.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = Math.floor((minX + maxX) / 2);

// Which outward faces of a cell are exposed.
function exposedFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Inner neighbour across a given exposed face.
function innerOf(x, z, face) {
  if (face === "N") return [x, z + 1];
  if (face === "S") return [x, z - 1];
  if (face === "W") return [x + 1, z];
  return [x - 1, z];
}

const PIER = { axis: "y" };
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };

// Pass 1: foundations, interior floors, and wall shells.
for (const [x, z] of cells) {
  const gz = Math.min(ground.get(key(x, z)), 10);
  const faces = exposedFaces(x, z);
  const perimeter = faces.length > 0;

  // Foundation fill from y 0 up to and including the ground cell.
  for (let y = 0; y <= gz; y++) g.set(x, y, z, "stone_bricks");

  if (!perimeter) {
    // Interior: floor slab at storey line and roof deck, air elsewhere.
    if (FLOOR > gz) g.set(x, FLOOR, z, "smooth_quartz");
    if (CORNICE > gz) g.set(x, CORNICE, z, "gray_concrete");
    continue;
  }

  // Perimeter column: walls from ground to parapet.
  const isCorner = faces.length >= 2;
  const face = faces[0];
  const pos = (face === "N" || face === "S") ? x : z;
  const min = (face === "N" || face === "S") ? minX : minZ;
  const max = (face === "N" || face === "S") ? maxX : maxZ;
  const r = pos - min;
  const isPier = isCorner || r % 3 === 0 || pos === max;
  const isDoorCell = !isCorner && face === "N" && pos === midX;

  for (let y = gz + 1; y <= ROOF; y++) {
    if (y < FLOOR) {
      // Ground storey (shopfront).
      if (isDoorCell && y <= gz + 2) {
        g.set(x, y, z, "dark_oak_door", y === gz + 1 ? DOOR_LOWER : DOOR_UPPER);
      } else if (isPier) {
        g.set(x, y, z, "quartz_pillar", PIER);
      } else {
        g.set(x, y, z, "glass");
      }
    } else if (y === FLOOR) {
      g.set(x, y, z, "smooth_quartz");
    } else if (y < CORNICE) {
      // Upper storey: piers and glazed bays.
      if (isPier) {
        g.set(x, y, z, "quartz_pillar", PIER);
      } else if (y === UF_SILL) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (y === UF_LINTEL) {
        g.set(x, y, z, "smooth_quartz");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    } else if (y === CORNICE) {
      g.set(x, y, z, "polished_andesite");
    } else {
      // Parapet cap.
      g.set(x, y, z, "stone_bricks");
    }
  }

  // Ground storey lintel course.
  if (GF_LINTEL > gz && !isDoorCell) g.set(x, GF_LINTEL, z, "smooth_stone");
}

// Pass 2: warm light behind some glazed bays, and rooftop plant.
for (const [x, z] of cells) {
  const gz = Math.min(ground.get(key(x, z)), 10);
  const faces = exposedFaces(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const pos = (face === "N" || face === "S") ? x : z;
  const min = (face === "N" || face === "S") ? minX : minZ;
  const r = pos - min;
  if (r % 3 === 0) continue;
  const [ix, iz] = innerOf(x, z, face);
  if (!has(ix, iz)) continue;
  const inner = exposedFaces(ix, iz);
  if (inner.length > 0) continue; // inner cell is itself a wall

  if (r % 2 === 0 && 7 > gz) g.set(ix, 7, iz, "shroomlight");
  if (r % 3 === 1 && 2 > gz && !(face === "N" && pos === midX)) g.set(ix, 2, iz, "glowstone");
}

// Rooftop plant room in the middle of the roof.
for (const [x, z] of cells) {
  const gz = Math.min(ground.get(key(x, z)), 10);
  if (exposedFaces(x, z).length > 0) continue;
  if (Math.abs(x - midX) <= 1 && Math.abs(z - Math.floor((minZ + maxZ) / 2)) <= 1 && gz <= CORNICE) {
    g.set(x, ROOF, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
