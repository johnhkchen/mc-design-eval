import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752124";
const W = 22, H = 23, D = 15;

// Record-derived massing: roof parapet ~11 blocks above lowest ground,
// two storeys of ~5 blocks, 1990s commercial/office block with white
// tiled concrete, stone storey lines, tinted glazing and a flat roof.
const FLOOR = 5;    // floor slab / storey line
const ROOF = 10;    // roof slab level (cornice course on the edge)
const PARAPET = 11; // top of parapet

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) =>
  isEdge(x, z) && (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

let minZ = Infinity, maxZ = -Infinity;
for (const [, z] of cells) { minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }

// Entrance on the minZ (front) facade, near its middle.
const frontCells = cells.filter(([x, z]) => z === minZ && isEdge(x, z) && !isCorner(x, z));
const avgX = frontCells.reduce((s, [x]) => s + x, 0) / Math.max(1, frontCells.length);
const doorX = frontCells.length
  ? frontCells.reduce((best, [x]) => (Math.abs(x - avgX) < Math.abs(best - avgX) ? x : best), frontCells[0][0])
  : -1;

const DOOR_BASE = { open: "false", powered: "false" };

function inward(x, z) {
  if (!has(x, z - 1)) return [x, z + 1];
  if (!has(x, z + 1)) return [x, z - 1];
  if (!has(x - 1, z)) return [x + 1, z];
  if (!has(x + 1, z)) return [x - 1, z];
  return null;
}

// Foundations, floors and roof for every footprint cell.
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(9, Math.round(gr0)));
  const edge = isEdge(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  if (!edge) {
    // interior: floor slabs, roof slab, air between (no interiors)
    g.set(x, gr, z, "light_gray_concrete");
    if (gr <= FLOOR) g.set(x, FLOOR, z, "light_gray_concrete");
    g.set(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  const corner = isCorner(x, z);
  const alongFront = z === minZ || z === maxZ;
  const along = alongFront ? x : z;

  for (let y = gr; y <= PARAPET; y++) {
    if (y === PARAPET) {
      g.set(x, y, z, corner ? "light_gray_concrete" : "white_concrete");
      continue;
    }
    if (y === ROOF) { g.set(x, y, z, "smooth_stone"); continue; }     // cornice
    if (y === FLOOR) { g.set(x, y, z, "smooth_stone"); continue; }    // storey line
    if (y === gr) { g.set(x, y, z, "polished_granite"); continue; }   // base course

    const groundWin = y > gr && y <= 3;
    const upperWin = y >= 6 && y <= 8;
    if ((groundWin || upperWin) && !corner && along % 3 !== 0) {
      if (alongFront) {
        g.set(x, y, z, "gray_stained_glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      } else {
        g.set(x, y, z, "gray_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      }
      continue;
    }
    if (groundWin || upperWin) { g.set(x, y, z, "white_concrete"); continue; } // mullions / corners
    if (y === 4 || y === 9) { g.set(x, y, z, "smooth_stone"); continue; }     // lintels / sills
    g.set(x, y, z, "white_concrete");
  }

  // Entrance: glass door on the front facade, lower and upper halves.
  if (z === minZ && x === doorX) {
    const base = Math.max(gr, 1);
    g.set(x, base + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", ...DOOR_BASE });
    g.set(x, base + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", ...DOOR_BASE });
    g.set(x, base + 3, z, "smooth_stone");
  }

  // Warm lights in some windows, placed in the air gap behind the glass.
  const inn = inward(x, z);
  if (inn && !corner) {
    const [ix, iz] = inn;
    if (has(ix, iz) && !isEdge(ix, iz)) {
      if (along % 6 === 1) g.set(ix, 7, iz, "lantern", { hanging: "false", waterlogged: "false" });
      if (along % 6 === 4) g.set(ix, 2, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Roof plant: a few low AC/mechanical units on the roof slab, centre of the plan.
for (const [x, z, gr0] of cells) {
  if (isEdge(x, z)) continue;
  const cx = (W - 1) / 2, cz = (D - 1) / 2;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 2 && (x + z) % 2 === 0) {
    g.set(x, PARAPET, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
