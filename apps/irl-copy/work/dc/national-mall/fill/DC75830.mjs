// DC75830: a limestone chancery on Massachusetts Ave NW, 21 x 17 blocks at 0.42 blocks/m. Three-storey massing from the
// lidar roof (median-smoothed into flat tiers): a west block, a lower north link with a porch and door, and an east
// wing with a taller central pavilion carrying a flagpole. Calcite walls, granite base, chiselled string courses, a
// stone-brick parapet, deepslate roof deck. Glass in every other bay of each storey, warm lights behind some of them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75830.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75830.nbt";

const W = 21, D = 17, H = 20;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// footprint: ground (g) and raw lidar roof (r, height above y 0) per cell
const G = Array.from({ length: W }, () => Array(D).fill(null));
const R = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] !== null;

// clean tiers: the median of each cell's footprint neighbourhood (3 x 3), so single-cell lidar spikes (9s among 4s and
// 8s) fall back to their surroundings; a roof is never under two blocks above its ground
const T = Array.from({ length: W }, () => Array(D).fill(null));    // absolute top (exclusive)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, z)) continue;
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) vals.push(R[x + dx][z + dz]);
  vals.sort((a, b) => a - b);
  T[x][z] = Math.max(G[x][z] + 2, vals[Math.floor(vals.length / 2)]);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];      // E, W, S (+z), N (-z)
const dirName = { "1,0": "E", "-1,0": "W", "0,1": "S", "0,-1": "N" };
const outsideDirs = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz)).map(([dx, dz]) => [dx, dz]);
// a side is exposed at absolute height y if it faces open air: outside the footprint, or a neighbour whose roof is below y
const exposedDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz) || T[x + dx][z + dz] <= y).map(([dx, dz]) => [dx, dz]);

const vox = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);

// the entrance: the north face of the porch cell at (13, 1), door facing out
const DOOR = [13, 1];

// warm lights behind some of the glass: the window cells with a light, decided by position so the pattern is stable
const litWindow = (x, y, z) => (x * 3 + z * 5 + y) % 4 === 0;
const GLASS = "light_gray_stained_glass_pane";

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, z)) continue;
  const g = G[x][z], t = T[x][z], top = t - g;

  // foundation: solid from y 0 up to the ground under this cell
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  const outs = outsideDirs(x, z);
  for (let r = 0; r < top; r++) {
    const y = g + r;
    const exp = exposedDirs(x, z, y);
    const exterior = outs.length > 0;
    const floor = r % 3 === 0;                              // storey lines: r 0 (base), 3, 6
    const isTop = r === top - 1, isCornice = r === top - 2;

    if (isTop) { put(x, y, z, exterior ? "stone_bricks" : "deepslate_tiles"); continue; }   // parapet or roof deck
    if (exp.length === 0 && !floor) {
      // interior air (the room), unless it is a deck/floor row; a warm lamp behind a window below
      continue;
    }
    if (exp.length === 0 && floor) { put(x, y, z, "smooth_stone"); continue; }             // interior floor slab
    if (isCornice) { put(x, y, z, "chiseled_stone_bricks"); continue; }

    // exposed wall
    if (x === DOOR[0] && z === DOOR[1] && outs.some(([dx, dz]) => dx === 0 && dz === -1) && r <= 1) {
      if (r === 0) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (r === 0) { put(x, y, z, exterior ? "polished_granite" : "smooth_stone"); continue; }  // base course
    if (floor) { put(x, y, z, "chiseled_stone_bricks"); continue; }                           // string course
    // a window bay: the rows above a string course, on the outside faces, every other cell along the face
    const windowRow = r % 3 === 1 || r % 3 === 2;
    if (exterior && outs.length === 1 && windowRow) {
      const [dx, dz] = outs[0];
      const along = dx === 0 ? x : z;
      if (along % 2 === 1) {
        const state = dx === 0 ? { east: "true", west: "true", north: "false", south: "false" }
                               : { north: "true", south: "true", east: "false", west: "false" };
        put(x, y, z, GLASS, state);
        // a lamp in the room just inside this bay
        const ix = x - dx, iz = z - dz;
        if (inF(ix, iz) && exposedDirs(ix, iz, y).length === 0 && litWindow(x, y, z) && (r % 3 === 1)) {
          const blk = (x + z) % 2 === 0 ? "glowstone" : "shroomlight";
          put(ix, y, iz, blk);
        }
        continue;
      }
    }
    // corners are quoins: stone bricks, so the massing turns a corner instead of a flat plane
    put(x, y, z, outs.length >= 2 ? "stone_bricks" : "calcite");
  }
}

// roof equipment: plant boxes on the upper deck of the tall cells (no flagpole: a loose flag reads as a stray block)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, z)) continue;
  const interior = outsideDirs(x, z).length === 0;
  const t = T[x][z];
  if (interior && t >= 8 && x % 4 === 1 && z % 4 === 1) {
    put(x, t, z, "light_gray_concrete"); put(x, t + 1, z, "light_gray_concrete");
  }
}

const res = vox.save(OUT);
const rows = [];
for (let z = 0; z < D; z++) {
  let s = "";
  for (let x = 0; x < W; x++) s += inF(x, z) ? String(T[x][z] - G[x][z]) : ".";
  rows.push(s);
}
console.log(`saved ${OUT}: ${res.blocks} blocks, ${res.palette} palette entries`);
console.log("storey heights above ground per cell:\n" + rows.join("\n"));
