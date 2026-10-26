// FR245184603: a 4-storey Haussmann-type commercial block, 14 x 44 cells, on the Île de la Cité's Seine-side blocks.
// Lidar roof heights are smoothed and quantised to storey tiers (5 / 10 / 15 / 19: the top tier is an attic under a
// slate mansard). Perimeter cells carry the facades (pale calcite pilasters, grey storey bands, glass in the window
// bays, shroomlight behind some panes); interior cells are air except one floor slab per storey, so each pane has an
// air gap behind it. A dark oak door sits on the north front, a shopfront runs along the ground storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184603.cells.json", "utf8"));

const W = 14, D = 44, Y = 35;
const R = Array.from({ length: D }, () => Array(W).fill(-1));   // lidar roof height above y 0, -1 off the footprint
const G = Array.from({ length: D }, () => Array(W).fill(0));    // each cell's own ground
for (const [x, z, g, r] of cells) { R[z][x] = r; G[z][x] = g; }
const inF = (x, z) => x >= 0 && x < W && z >= 0 && z < D && R[z][x] >= 0;

// smooth the lidar noise: mean over the footprint cells of each 3 x 3 patch
const S = Array.from({ length: D }, () => Array(W).fill(-1));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) { sum += R[z + dz][x + dx]; n++; }
  S[z][x] = sum / n;
}
// clean storey tiers: 1, 2, 3 storeys, and a 4-storey block whose top 4 blocks are the mansard attic
const tier = (s) => (s <= 7 ? 5 : s <= 12 ? 10 : s <= 17 ? 15 : 19);
const H = S.map((row) => row.map((s) => (s < 0 ? -1 : tier(s))));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const hash = (x, y, z) => ((Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0);

const g = new Voxels([W, Y, D]);
const lamps = [];

// the front: the north edge (z = 0), where the shopfront and the entrance are
const DOOR = [7, 0];

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const h = H[z][x]; if (h < 0) continue;
  const gr = G[z][x];
  // the sides that face outside the footprint (the perimeter), and the lower neighbours' roofs a wall rises above
  const outside = DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
  const perimeter = outside.length > 0;

  for (let y = 0; y < h; y++) {
    if (y < gr) { g.set(x, y, z, "stone"); continue; }                                    // foundation under the ground
    if (y === 0) { g.set(x, y, z, perimeter ? "stone_bricks" : "stone"); continue; }     // plinth / ground floor slab
    if (y === h - 1) { g.set(x, y, z, h === 19 ? "deepslate_tiles" : "stone"); continue; }  // roof or mansard

    // a wall where the cell faces outside, or a neighbour's roof is below this height (a setback's upper wall)
    const faces = DIRS.filter(([dx, dz]) => {
      const nx = x + dx, nz = z + dz;
      return !inF(nx, nz) || H[nz][nx] <= y;
    });
    if (!faces.length) {                                                                  // interior: a floor slab per storey, air between
      if (y % 5 === 0) g.set(x, y, z, "stone");
      continue;
    }
    const [dx, dz] = faces[0];
    const along = dx !== 0 ? z : x;                                                      // bay index along this wall
    const k = y % 5, pier = along % 3 === 0;

    // the entrance: a dark oak door on the north front, lintel above
    if (x === DOOR[0] && z === DOOR[1] && dz === -1 && y >= 1 && y <= 3) {
      if (y === 1) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === 2) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (k === 0 || k === 4) g.set(x, y, z, "smooth_stone");                              // storey line and cornice
    else if (k === 1) g.set(x, y, z, "calcite");                                         // sill / shop base course
    else if (pier) g.set(x, y, z, "calcite");                                            // pilaster between the bays
    else {
      g.set(x, y, z, "glass");
      // a warm light behind some panes, in the air gap on the inside
      const ix = x - dx, iz = z - dz;
      if (inF(ix, iz) && H[iz][ix] > y && hash(x, y, z) % 5 === 0) lamps.push([ix, y, iz]);
    }
  }

  // the parapet, on the roof edge of a perimeter cell
  if (perimeter && h < Y - 1) g.set(x, h, z, "stone_brick_wall");
  // chimney stacks on some interior roofs
  if (!perimeter && (h === 10 || h === 15 || h === 19) && (x * 7 + z * 3) % 11 === 0 && h + 1 < Y) {
    g.set(x, h, z, "bricks"); g.set(x, h + 1, z, "bricks");
  }
}

for (const [x, y, z] of lamps) if (g.get(x, y, z) === null) g.set(x, y, z, "shroomlight");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184603.nbt";
const info = g.save(out);
console.log(JSON.stringify(info));
