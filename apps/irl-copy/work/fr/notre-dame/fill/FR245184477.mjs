// A Haussmann block of flats (1868): seven storeys of cream stone on a rusticated plinth, glazed bays in the walls with
// a balcony rail on the first floor, a zinc mansard to the lidar's roof (28 blocks: every cell's 3x3 median reads 27 or
// 28, one tier). Walls are one stone thick with air behind the glass; a floor slab per storey; the street door with its
// lintel; glowstone behind some windows; chimneys on the zinc.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184477.cells.json", "utf8"));
const W = 25, D = 20, H = 44;
const ROOF = 28;                                    // the lidar's roof on every cell after a 3x3 median (27 and 28 are one tier)
const idx = (x, z) => z * W + x;
const foot = new Map(cells.map(([x, z, g, r]) => [idx(x, z), { g, r }]));
const fp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && foot.has(idx(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outs = (x, z) => DIRS.filter(([dx, dz]) => !fp(x + dx, z + dz));      // the outward normals of a wall cell
const ring = (x, z) => outs(x, z).length > 0;
const deep = (x, z) => [-1, 0, 1].every((dz) => [-1, 0, 1].every((dx) => fp(x + dx, z + dz)));

// the massing: every cell's roof, its 3x3 median, snapped to the one tier; the build assumes it (asserted)
for (const [k, { r }] of foot) {
  const x = k % W, z = (k - x) / W, v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (fp(x + dx, z + dz)) v.push(foot.get(idx(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  if (v[v.length >> 1] < 27) throw new Error(`cell ${x},${z} is a lower wing (roof ${v[v.length >> 1]}): not in this massing`);
}
if (cells.some(([, , g]) => g !== 0)) throw new Error("the site is not flat: a foundation per cell is not built here");

// y bands: plinth 0; ground floor windows 1-2 with the lintel band at 3; floors above at 4 + 3n: a band, then windows 2 high;
// the cornice band at 22; zinc mansard 23-27 (windows as dormers on 24-25, a band at 26)
const FLOORS = new Set([0, 4, 7, 10, 13, 16, 19, 22]);     // a floor slab under each storey (interior cells only)
const bandRow = (y) => y === 3 || (y >= 4 && y <= 22 && (y - 4) % 3 === 0);

const WALL = "calcite", QUOIN = "stone_bricks", BAND = "smooth_stone", FLOOR = "stone";
const ZINC = "deepslate_tiles", ATTIC = "deepslate", GLASS = "light_blue_stained_glass_pane", RAIL = "iron_bars";
const bridge = (nx, nz, axisX) => ({ east: axisX ? "false" : "true", west: axisX ? "false" : "true", north: axisX ? "true" : "false", south: axisX ? "true" : "false", waterlogged: "false" });
const bayOn = (x, z, nx) => { const a = nx ? z : x; return a % 4 === 1 || a % 4 === 2; };   // two glazed cells, then a pier

const g = new Voxels([W, H, D]);
let glows = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!fp(x, z)) continue;
  const ns = outs(x, z), isRing = ns.length > 0, corner = ns.length > 1;
  const [nx, nz] = ns[0] ?? [0, 0], axisX = nx !== 0;      // the wall's axis: a z-normal face runs along x
  for (let y = 0; y < ROOF; y++) {
    if (!isRing) {                                          // interior: floor slabs only, air between them
      if (FLOORS.has(y)) g.set(x, y, z, FLOOR);
      else if (y >= 23 && y <= 26) g.set(x, y, z, ATTIC);  // the attic is solid under the zinc (nothing hangs)
      else if (y === 27) g.set(x, y, z, ZINC);
      continue;
    }
    // the street door: on the z=0 face, x 7-9, its lower and upper halves at x 8
    if (y >= 1 && y <= 2 && z === 0 && nz === -1 && x >= 7 && x <= 9) {
      if (x === 8) g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, WALL);
      continue;
    }
    if (y === 0 || corner) { g.set(x, y, z, QUOIN); continue; }   // plinth and quoins
    if (y >= 23) {                                          // the zinc mansard: dormers on 24-25, a band at 26
      if ((y === 24 || y === 25) && bayOn(x, z, axisX)) g.set(x, y, z, GLASS, bridge(nx, nz, axisX));
      else if (y === 26) g.set(x, y, z, BAND);
      else g.set(x, y, z, ZINC);
      continue;
    }
    if (bandRow(y)) { g.set(x, y, z, BAND); continue; }
    if (!bayOn(x, z, axisX)) { g.set(x, y, z, WALL); continue; }
    const rail = y === 8;                                  // first-floor balcony rail across the glazed bays
    if (rail) { g.set(x, y, z, RAIL, bridge(nx, nz, axisX)); continue; }
    g.set(x, y, z, GLASS, bridge(nx, nz, axisX));
    // a warm light behind some panes, in the air just inside the wall
    const ix = x - nx, iz = z - nz;
    if ((y === 1 || y === 5 || y === 11 || y === 17) && (x * 5 + z * 3 + y) % 4 === 0 && fp(ix, iz) && !ring(ix, iz)) {
      g.set(ix, y, iz, "glowstone"); glows++;
    }
  }
}

// the chimneys, rising from the zinc: brick stacks with a slab cap
for (const [x, z] of [[4, 5], [11, 5], [18, 5], [4, 12], [11, 12], [17, 12]]) {
  if (!deep(x, z)) continue;
  for (let y = ROOF; y <= 30; y++) g.set(x, y, z, "bricks");
  g.set(x, 31, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184477.nbt";
const info = g.save(out);
console.log(JSON.stringify({ cells: cells.length, glows, ...info }));
