import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw455139052";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 27, H = 23, D = 52;
const g = new Voxels([W, H, D]);

// Two storeys of ~5 blocks plus a parapet: roof surface at y=10, top of parapet at 10 (11 blocks above lowest ground).
const ROOF = 10;

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Footprint bounds and centre
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

// Main entrance: centre of the street-facing row (lowest z)
const rowXs = cells.filter(([x, z]) => z === minZ).map(([x]) => x);
const doorX = rowXs.length ? Math.round(rowXs.reduce((a, b) => a + b, 0) / rowXs.length) : cx;

const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  const gy = Math.max(0, Math.min(gr, ROOF - 1));

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone");

  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  const pier = corner || (x + z) % 3 === 0;

  if (!edge) {
    // Interior: floor slabs and roof deck only; air between (no interiors)
    g.set(x, gy, z, "smooth_stone");
    if (gy < 5) g.set(x, 5, z, "smooth_stone");
    if (ROOF > gy) g.set(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // Exterior wall column from ground to roof
  for (let y = gy; y <= ROOF; y++) {
    let b = null;
    let props;

    if (y === gy) {
      b = "stone_bricks"; // base course
    } else if (y === ROOF) {
      b = "white_concrete"; // parapet
    } else if (y === 9) {
      b = "smooth_stone"; // cornice band
    } else if (y === 5) {
      b = "smooth_stone"; // storey line / floor slab
    } else if (y <= 4) {
      // Ground-floor shopfront
      if (y === 4) b = "red_terracotta"; // fascia sign band
      else if (y === 3) b = "dark_oak_planks"; // transom
      else {
        // glass at gy+1..2 (or 1..2)
        b = ((x + 2 * z) % 5 === 0) ? "yellow_stained_glass" : "light_blue_stained_glass";
      }
      if (pier && y !== 4) b = "white_concrete";
    } else {
      // Upper storey windows at y 6..8
      if (y === 6) {
        b = "smooth_stone_slab";
        props = { type: "bottom", waterlogged: "false" };
      } else {
        b = ((x * 7 + z * 3 + y) % 9 === 0) ? "yellow_stained_glass" : "light_blue_stained_glass";
      }
      if (pier) b = "white_concrete";
    }

    if (y === gy + 1 || y === gy + 2) {
      if (edge && z === minZ && x === doorX && y <= 4) {
        g.set(x, y, z, "dark_oak_door", y === gy + 1 ? DOOR_LOWER : DOOR_UPPER);
        continue;
      }
    }

    if (b) {
      if (props) g.set(x, y, z, b, props);
      else g.set(x, y, z, b);
    }
  }
}

// Roof equipment: a plant room on the interior roof, centred on the footprint
for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  if (gr >= ROOF) continue;
  if (isEdge(x, z)) continue;
  if (Math.abs(x - cx) <= 5 && Math.abs(z - cz) <= 8) {
    g.set(x, 11, z, "light_gray_concrete");
    g.set(x, 12, z, "light_gray_concrete");
    g.set(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
