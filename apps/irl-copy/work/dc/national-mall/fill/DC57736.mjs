// Armstrong (Samuel Chapman) Technical High School, 1400 1st St NW: a red-brick, stone-trimmed school block of the
// 1900s, a row of storeys with a tower-like centre pavilion and lower wings and courtyard ranges. Footprint, ground and
// roof heights come from the lidar record (DC57736.cells.json). Storeys are 2 blocks (about 4.8 m at 0.42 blocks/m).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57736.cells.json`, "utf8"));
const X = 28, Z = 20, Y = 20;

// footprint: each cell's ground (g) and the lidar roof height above y 0 (r)
const fp = Array.from({ length: Z }, () => Array(X).fill(null));
for (const [x, z, g, r] of cells) fp[z][x] = { g, r };
const inFp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && fp[z][x] !== null;

// the lidar's roof is noisy: each cell takes the median roof of its 3x3 footprint neighbourhood, so the tiers come out flat.
// top[z][x] is the top block's y (roof surface = top)
const top = Array.from({ length: Z }, () => Array(X).fill(-1));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp[z][x]) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) vals.push(fp[z + dz][x + dx].r);
  vals.sort((a, b) => a - b);
  top[z][x] = vals[vals.length >> 1] - 1;
}

// a column is solid from y 0 (foundation) up to its top; a neighbour's column is solid up to its own top
const solid = (x, y, z) => inFp(x, z) && y <= top[z][x];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposedDirs = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

const v = new Voxels([X, Y, Z]);
const ENTRANCE = [13, 14];           // the double door on the north (z 0) front, in the centre of the main range

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp[z][x]) continue;
  const gnd = fp[z][x].g, T = top[z][x];
  for (let y = 0; y <= T; y++) {
    // foundation: solid from 0 up to this cell's ground
    if (y < gnd) { v.set(x, y, z, "stone_bricks"); continue; }
    const h = y - gnd;                       // height above this cell's ground
    const ex = exposedDirs(x, y, z);

    // roof: parapet on the outside edge, flat roof deck inside
    if (y === T) { v.set(x, y, z, ex.length ? "calcite" : "smooth_stone"); continue; }

    // interior: a floor plane per storey (from the second storey up), air otherwise
    if (ex.length === 0) { if (h >= 2 && h % 2 === 0) v.set(x, y, z, "smooth_stone"); continue; }

    // exposed wall: the north (z 0) front has the entrance; the corner columns are piers
    const corner = ex.length > 1;
    const [dx, dz] = ex[0];
    const face = dz !== 0 ? x : z;           // position along the face, for the window bays
    const onFront = z === 0 && dz === -1;

    if (onFront && x >= 12 && x <= 15 && h <= 3) {
      if (h <= 1 && ENTRANCE.includes(x)) {  // door: a pair of doors, lower and upper halves
        const half = h === 0 ? "lower" : "upper";
        v.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: x === 13 ? "left" : "right", open: "false", powered: "false" });
      } else v.set(x, y, z, "calcite");      // door surround, and the lintel over the door
      continue;
    }

    if (h === 0) { v.set(x, y, z, "polished_andesite"); continue; }          // base course
    if (h % 2 === 0) { v.set(x, y, z, "calcite"); continue; }                // storey line / sill and lintel course
    // window row: piers of brick, glass panes between them
    if (corner || face % 3 === 0) { v.set(x, y, z, "bricks"); continue; }
    const alongX = dz !== 0;                  // a pane joins the panes beside it along the face
    v.set(x, y, z, "glass_pane", {
      north: alongX ? "true" : "false", south: alongX ? "true" : "false",
      east: alongX ? "false" : "true", west: alongX ? "false" : "true", waterlogged: "false",
    });
    // warm light behind some panes: glowstone in the room just inside the glass
    const ix = x - dx, iz = z - dz;
    if (face % 9 === 4 && (h % 4) === 1 && inFp(ix, iz) && y < top[iz][ix] && exposedDirs(ix, y, iz).length === 0) {
      v.set(ix, y, iz, "glowstone");
    }
  }
}

// roof equipment: a few plant boxes on the flat roof decks (the pavilion and the main roof)
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp[z][x] || (x % 6 !== 3) || (z % 5 !== 2)) continue;
  const T = top[z][x];
  if (T < 6 || exposedDirs(x, T, z).length) continue;
  v.set(x, T + 1, z, "iron_block");
}

const stats = v.save(`${DIR}/DC57736.nbt`);
console.log(JSON.stringify(stats));
