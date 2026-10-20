import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE98-0052-4F: 2009 Xinyi mid-rise commercial/office block, 6 storeys of 5 blocks,
// flat roof at y=30 with a white concrete parapet to y=32. Vertical rhythm from
// white pilaster bays every 12 blocks, dark concrete mullions between glass bays,
// a polished granite base, and a framed entrance on the south face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE98-0052-4F";
const W = 62, H = 43, D = 106;
const ROOF = 30;      // roof deck top level (storey lines at 0,5,...,30)
const PARAPET_TOP = 32;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => x + "," + z;
const GR = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  GR.set(key(x, z), Math.max(0, Math.min(ROOF, Math.round(gr))));
}
const has = (x, z) => GR.has(key(x, z));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Perimeter = footprint cell with at least one missing 4-neighbour.
function edgeInfo(x, z) {
  const miss = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (miss.length === 0) return null;
  let nx = 0, nz = 0;
  for (const [dx, dz] of miss) { nx += dx; nz += dz; }
  return { nx: Math.sign(nx), nz: Math.sign(nz), corner: miss.length > 1 };
}

const g = new Voxels([W, H, D]);

// Framed entrance on the south face (+z), centred on x=31, three blocks high.
// Returns a block spec for entrance cells, or null if not an entrance cell.
function entranceBlock(x, y, z, gr, e) {
  if (!e || e.corner || e.nz <= 0 || e.nx !== 0) return null;
  if (x < 28 || x > 34) return null;
  const dy = y - gr;
  if (dy < 0 || dy > 2) return null;
  if (dy === 2) return { id: "polished_andesite" };           // lintel
  if (x === 31) {
    return { door: true, half: dy === 0 ? "lower" : "upper" };
  }
  if (x === 28 || x === 34) return { id: "polished_andesite" }; // piers
  return { id: "light_blue_stained_glass" };                  // shopfront glass
}

// Facade block for a perimeter cell at height y (not an entrance cell).
function facadeBlock(x, y, z, gr, e) {
  const u = e.nz !== 0 ? x : z;            // position along the wall
  const bay = u % 12;
  const isMullion = e.corner || (u % 3 === 0);

  // Base course at the bottom of the visible wall.
  if (y === gr) return { id: "polished_granite" };

  // Ground storey: shopfront glass with dark frames, spandrel at top.
  if (y < 5) {
    if (y === 4) return { id: "white_concrete" };
    if (isMullion) return { id: "gray_concrete" };
    return { id: "light_blue_stained_glass" };
  }

  const r = y % 5;
  if (r === 0) return { id: "light_gray_concrete" };   // storey line
  if (r === 4) return { id: "white_concrete" };        // spandrel
  // Full-height white pilaster bays give vertical rhythm.
  if (e.corner || bay === 0 || bay === 1) return { id: "white_concrete" };
  if (isMullion) return { id: "gray_concrete" };       // dark mullion
  const storey = Math.floor(y / 5);
  return { id: storey % 2 === 0 ? "light_blue_stained_glass" : "cyan_stained_glass" };
}

for (const [k, gr] of GR) {
  const [x, z] = k.split(",").map(Number);
  const e = edgeInfo(x, z);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Storeys: walls on perimeter, floor slabs on interior at each storey line.
  for (let y = gr; y <= ROOF; y++) {
    if (e) {
      const ent = entranceBlock(x, y, z, gr, e);
      if (ent) {
        if (ent.door) {
          const facing = e.nz > 0 ? "north" : "south";
          g.set(x, y, z, "iron_door", {
            facing, half: ent.half, hinge: "left", open: "false", powered: "false",
          });
        } else {
          g.set(x, y, z, ent.id);
        }
        continue;
      }

      const fb = facadeBlock(x, y, z, gr, e);
      g.set(x, y, z, fb.id);

      // Warm lights behind some windows (interior cell one step inward).
      const r = y % 5;
      const storeyIdx = Math.floor(y / 5);
      const u = e.nz !== 0 ? x : z;
      if (!e.corner && r === 2 && u % 9 === 4 && storeyIdx % 2 === 1 && y >= 5) {
        const ix = x - e.nx, iz = z - e.nz;
        if (has(ix, iz)) {
          g.set(ix, y, iz, y % 10 === 2 ? "shroomlight" : "glowstone");
        }
      }
    } else {
      // Interior: floor slab at each storey line; air elsewhere.
      if (y % 5 === 0 && y >= gr) g.set(x, y, z, "light_gray_concrete");
    }
  }

  // Parapet on the perimeter with a stone cap.
  if (e) {
    for (let y = ROOF + 1; y <= PARAPET_TOP; y++) {
      g.set(x, y, z, y === PARAPET_TOP ? "smooth_stone" : "white_concrete");
    }
  }
}

// Roof plant: a central mechanical enclosure set back from the parapet.
for (const [k] of GR) {
  const [x, z] = k.split(",").map(Number);
  if (edgeInfo(x, z)) continue;
  const plant = x >= 22 && x <= 38 && z >= 40 && z <= 62;
  if (plant) {
    g.set(x, ROOF + 1, z, "stone_bricks");
    g.set(x, ROOF + 2, z, "stone_bricks");
    g.set(x, ROOF + 3, z, "light_gray_concrete");
  } else if (x % 10 === 4 && z % 12 === 6) {
    // Small AC units spaced along the roof.
    g.set(x, ROOF + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
