import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 信義之星 (Xinyi Star): a late-1990s/2000s Taipei office tower in reinforced concrete
// with a tinted glass curtain wall, a granite base course, storey bands every 5 blocks,
// and a rooftop plant penthouse with a short mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453477001";
const W = 55, H = 81, D = 34;
const ROOF = 69;      // roof slab top, blocks above lowest ground (lidar)
const STOREY = 5;     // blocks per storey

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(key(x, z), Math.round(gr));
const has = (x, z) => groundAt.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

// Bounds-checked setter
function put(x, y, z, id, props = {}) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  g.set(x, y, z, id, props);
}

// Centroid of the footprint (used for the crown and mast)
let sx = 0, sz = 0;
for (const [x, z] of cells) { sx += x; sz += z; }
const cx = Math.round(sx / cells.length);
const cz = Math.round(sz / cells.length);
const minZ = Math.min(...cells.map(([, z]) => z));

// Direction from an edge cell toward the interior (first footprint neighbour)
function inwardOf(x, z) {
  for (const [dx, dz] of DIRS) {
    if (has(x + dx, z + dz)) return [x + dx, z + dz];
  }
  return null;
}

// Penthouse zone (plant room on the roof, centred on the footprint)
const inZone = (x, z) =>
  has(x, z) && Math.abs(x - cx) <= W * 0.16 && Math.abs(z - cz) <= D * 0.16;
const zoneEdge = (x, z) => DIRS.some(([dx, dz]) => !inZone(x + dx, z + dz));

// Mast cell: footprint cell nearest the centroid
let mastX = cx, mastZ = cz, best = Infinity;
for (const [x, z] of cells) {
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < best) { best = d; mastX = x; mastZ = z; }
}

// ---- 1. Foundation, shaft, floors, lights, entrance ----
for (const [x, z, gr0] of cells) {
  const g0 = groundAt.get(key(x, z));

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < g0; y++) put(x, y, z, "stone");

  const edge = isEdge(x, z);
  const entrance = edge && z === minZ && Math.abs(x - cx) <= 2;

  for (let y = g0; y < ROOF; y++) {
    const rel = y - g0;
    const o = rel % STOREY;

    if (edge) {
      if (entrance && rel === 1) {
        put(x, y, z, "iron_door", {
          facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (entrance && rel === 2) {
        put(x, y, z, "iron_door", {
          facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (entrance && rel === 3 && x === cx) {
        put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
        continue;
      }

      if (o === 0) {
        put(x, y, z, rel === 0 ? "polished_granite" : "light_gray_concrete");
      } else if (o === 4) {
        put(x, y, z, "white_concrete");
      } else {
        // Glass curtain wall with a mullion every third column
        const mullion = (x + z) % 3 === 0;
        put(x, y, z, mullion ? "white_concrete" : "light_blue_stained_glass");
      }
    } else {
      // Interior: only the floor slabs; the rest is air
      if (o === 0) put(x, y, z, "light_gray_concrete");
    }
  }

  // Warm lights set back behind some glass, inside the air gap
  if (edge) {
    for (let y = g0; y < ROOF; y++) {
      const rel = y - g0;
      if (rel % STOREY !== 2) continue;
      if (((x * 5 + z * 3 + rel) % 7) !== 0) continue;
      const inw = inwardOf(x, z);
      if (!inw) continue;
      const [ix, iz] = inw;
      if (isEdge(ix, iz)) continue;
      put(ix, y, iz, "glowstone");
    }
  }
}

// ---- 2. Roof slab, parapet, penthouse, mast ----
for (const [x, z] of cells) {
  put(x, ROOF, z, "light_gray_concrete");
  if (isEdge(x, z)) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "white_concrete");
  }
}

for (const [x, z] of cells) {
  if (!inZone(x, z)) continue;
  const edge = zoneEdge(x, z);
  for (let y = ROOF + 1; y <= ROOF + 4; y++) {
    if (!edge) {
      put(x, y, z, "gray_concrete");          // solid core, nothing hangs
    } else if (y === ROOF + 1 || y === ROOF + 4) {
      put(x, y, z, "white_concrete");
    } else {
      const mullion = (x + z) % 3 === 0;
      put(x, y, z, mullion ? "white_concrete" : "light_blue_stained_glass");
    }
  }
  put(x, ROOF + 5, z, "white_concrete");     // penthouse cap
}

for (let y = ROOF + 6; y <= ROOF + 9; y++) {
  put(mastX, y, mastZ, "iron_bars", { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
