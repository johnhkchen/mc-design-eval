import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1920s brick apartment house with limestone bands, the lidar's two tiers: wings and podium at 12 blocks, a tower
// at 15 (roof 14-15 smoothed to one tier). Storeys are 3 blocks: a floor slab (the stringcourse) and two rows of window.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC67836.cells.json`, "utf8"));
const top = new Map();                       // "x,z" -> roof deck height (top surface)
for (const [x, z, , roof] of cells) top.set(`${x},${z}`, roof >= 14 ? 15 : 12);
const T = (x, z) => top.get(`${x},${z}`) ?? -1;   // -1 outside the footprint
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the neighbours that open onto a cell at this level: outside the footprint, or a column whose roof is below lim
const opens = (x, z, lim) => DIRS.filter(([dx, dz]) => T(x + dx, z + dz) < lim);
const PANE_X = { east: "true", west: "true", north: "false", south: "false" };   // a pane in a wall running along x
const PANE_Z = { east: "false", west: "false", north: "true", south: "true" };   // a pane in a wall running along z

const g = new Voxels([19, 27, 13]);
const windows = [];
for (const [key, R] of top) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < R; y++) {
    const ex = opens(x, z, y + 1);
    if (y % 3 === 0) {                       // base course and floor slabs; the outer edge is the stringcourse
      if (x === 14 && z === 0 && y === 3) { g.set(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" }); continue; }  // entrance hood
      g.set(x, y, z, ex.length ? (y === 0 ? "stone_bricks" : "calcite") : (y === 0 ? "stone" : "smooth_stone"));
      continue;
    }
    if (!ex.length) continue;                // interior air behind the envelope
    const xFace = ex.some(([dx]) => dx), zFace = ex.some(([, dz]) => dz);
    if (xFace && zFace) { g.set(x, y, z, "calcite"); continue; }    // quoins
    if (zFace && x === 14 && z === 0 && y < 3) {                    // the front door, in the stub's middle bay
      const half = y === 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const along = zFace ? x : z;
    if (along % 3 === 0) { g.set(x, y, z, "bricks"); continue; }     // piers between bays
    g.set(x, y, z, "glass_pane", zFace ? PANE_X : PANE_Z);
    const [dx, dz] = ex[0];
    windows.push({ x, y, z, dx, dz });
  }
  // roof deck with a calcite cornice on its edge; a single brick parapet course above the edge
  g.set(x, R, z, opens(x, z, R).length ? "calcite" : "smooth_stone");
  if (opens(x, z, R + 1).length) g.set(x, R + 1, z, "bricks");
}

// warm light behind some of the glass: two cells in from the face, so the air gap stays
for (const { x, y, z, dx, dz } of windows) {
  if (y < 4 || (x * 3 + y * 5) % 4 !== 0) continue;
  const tx = x - 2 * dx, tz = z - 2 * dz;
  if (T(tx, tz) < y || opens(tx, tz, y + 1).length) continue;
  g.set(tx, y, tz, "glowstone");
}

// roof plant on the podium deck
for (const [x, z] of [[3, 3], [4, 3], [15, 2], [16, 2]]) g.set(x, 13, z, "light_gray_concrete");

const out = g.save(`${DIR}/DC67836.nbt`);
console.log(out);
