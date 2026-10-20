import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397480";
const W = 21, H = 38, D = 18;
const ROOF = 25;      // roof slab top course (5 storeys of 5 blocks)
const PARAPET = 26;   // first course above the roof slab
const TOP_MAX = 30;   // highest block placed (lightning rod)

const GLASS = "light_blue_stained_glass";
const PIER = "white_concrete";
const SLAB = "light_gray_concrete";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const KEY = (x, z) => x * 1000 + z;
const G = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(KEY(x, z), Math.max(0, Math.min(H - 8, Math.round(gr))));
}

const has = (x, z) => G.has(KEY(x, z));
const gOf = (x, z) => G.get(KEY(x, z));
const edge = (x, z) =>
  has(x, z) && (!has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1));
const corner = (x, z) =>
  (!has(x + 1, z) || !has(x - 1, z)) && (!has(x, z + 1) || !has(x, z - 1));
const zEdge = (x, z) => !has(x, z + 1) || !has(x, z - 1);
const frontZ = (x, z) => !has(x, z - 1);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Facade pattern for an edge cell (no storefront): piers every 3 columns, spandrel at storey top.
function facade(x, y, z) {
  if (corner(x, z)) return PIER;
  if (y % 5 === 4) return PIER;
  const u = zEdge(x, z) ? x : z;
  if (u % 3 === 0) return PIER;
  return GLASS;
}

// Warm light behind a window: interior cell next to a glass facade cell in a window band.
function glowAt(x, z, y) {
  if (y % 5 < 1 || y % 5 > 3) return false;
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && edge(nx, nz) && facade(nx, y, nz) === GLASS) {
      return (x + 2 * z + y) % 4 === 0;
    }
  }
  return false;
}

// Returns [id, props?] for a footprint cell at height y, or null for air.
function blockAt(x, z, y) {
  const g = gOf(x, z);
  const isE = edge(x, z);
  const inPH = x >= 6 && x <= 14 && z >= 5 && z <= 12;
  const inMech = x >= 2 && x <= 4 && z >= 2 && z <= 4;

  // Ground level: base course on the edge, floor slab inside.
  if (y === g) return isE ? [BASE] : [FLOOR];

  // Penthouse and roof plant above the roof slab.
  if (y >= PARAPET) {
    if (inPH) {
      const rim = x === 6 || x === 14 || z === 5 || z === 12;
      if (y <= 28) {
        if (!rim) return null;
        if (y === 27 && !((x === 6 || x === 14) && (z === 5 || z === 12))) return [GLASS];
        return [PIER];
      }
      if (y === 29) return [SLAB];
      if (y === 30 && x === 10 && z === 8) {
        return ["lightning_rod", { facing: "up", powered: "false" }];
      }
      return null;
    }
    if (y === PARAPET && isE) return [PIER];
    if (y === 27 && corner(x, z)) return [PIER];
    if (inMech && y === 26) return [SLAB];
    if (inMech && y === 27) return ["iron_block"];
    return null;
  }

  // Roof slab.
  if (y === ROOF) return [SLAB];

  // Storey floor lines.
  if (y % 5 === 0) return [SLAB];

  if (isE) {
    // Shopfront on the street (front) face, between g+1 and g+3.
    if (frontZ(x, z) && y >= g + 1 && y <= g + 3) {
      if (x === 10 && y <= g + 2) {
        return ["dark_oak_door", {
          facing: "north",
          half: y === g + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        }];
      }
      if (corner(x, z)) return [PIER];
      const u = zEdge(x, z) ? x : z;
      if (u % 3 === 0) return [PIER];
      return [GLASS];
    }
    return [facade(x, y, z)];
  }

  // Interior: air, except lanterns at the entrance and glow behind windows.
  if ((x === 9 || x === 11) && z === 1 && y === g + 1) {
    return ["lantern", { hanging: "false", waterlogged: "false" }];
  }
  if (glowAt(x, z, y)) return ["glowstone"];
  return null;
}

const g = new Voxels([W, H, D]);

for (const key of G.keys()) {
  const x = Math.floor(key / 1000);
  const z = key % 1000;
  const gr = gOf(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  for (let y = gr; y <= TOP_MAX; y++) {
    const r = blockAt(x, z, y);
    if (!r) continue;
    if (r[1]) g.set(x, y, z, r[0], r[1]);
    else g.set(x, y, z, r[0]);
  }
}

g.save(`${DIR}/${ID}.nbt`);
