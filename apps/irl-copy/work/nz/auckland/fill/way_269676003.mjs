// A 1920s-30s brick commercial block (Stripped Classical, Auckland CBD-edge): shopfronts on the ground floor, two
// storeys of brick with quartz string courses and sash-width windows, a setback tower on the highest lidar cells.
// Footprint cells are [x, z, ground, roof]; y 0 is the lowest ground. Storey slabs sit at y = 1, 5, 9, 13 (4-block
// storeys). Each cell's roof is smoothed and snapped to a tier deck: 5 (one storey), 9 (two storeys), 13 (tower).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269676003.cells.json", "utf8"));
const W = 32, D = 46;
const foot = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, g, r] of cells) foot[z][x] = { x, z, g, r };
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && !!foot[z][x];
const cell = (x, z) => (inside(x, z) ? foot[z][x] : null);

// Smooth the lidar roof with the 3x3 median, then snap each cell to a tier (the deck row of its top storey).
const TIERS = [5, 9, 13];
for (const c of cells.map(([x, z]) => foot[z][x])) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell(c.x + dx, c.z + dz); if (n) v.push(n.r); }
  v.sort((a, b) => a - b);
  c.smooth = v[(v.length - 1) >> 1];
  c.tier = c.smooth <= 8.5 ? 5 : c.smooth <= 11.5 ? 9 : 13;
}
// Majority filter on the tiers (ties keep the cell's own), so setbacks come out as clean blobs, not speckle.
const tiers = cells.map(([x, z]) => foot[z][x]).map((c) => {
  const count = {};
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell(c.x + dx, c.z + dz); if (n) count[n.tier] = (count[n.tier] || 0) + 1; }
  let best = c.tier;
  for (const t of TIERS) if ((count[t] || 0) > (count[best] || 0)) best = t;
  return [c, best];
});
for (const [c, t] of tiers) c.deck = t;
// A tower must be a mass, not a stub: a 13 cell needs at least 4 tower cells in its 3x3 (itself included), else it is body.
for (const c of cells.map(([x, z]) => foot[z][x])) {
  if (c.deck !== 13) continue;
  let n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const q = cell(c.x + dx, c.z + dz); if (q && q.deck === 13) n++; }
  if (n < 4) c.deck = 9;
}
// Every storey stands on its own slab: a tier too low for the ground under it (3 blocks of storey) rises to the body.
for (const c of cells.map(([x, z]) => foot[z][x])) {
  if (c.deck < c.g + 3) c.deck = 9;
}
// Walls: the footprint edge, or any cell whose neighbour is lower (its upper part is exposed to the sky).
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };
const nbOf = (c, d) => cell(c.x + DIRS[d][0], c.z + DIRS[d][1]);
for (const c of cells.map(([x, z]) => foot[z][x])) {
  c.wall = Object.keys(DIRS).some((d) => { const n = nbOf(c, d); return !n || n.deck < c.deck; });
}
// A face is open at row y when it looks outside, or onto a neighbour that is lower there.
const openFaces = (c, y) => Object.keys(DIRS).filter((d) => { const n = nbOf(c, d); return !n || (y > n.deck); });

const SLAB = (y) => y >= 1 && (y - 1) % 4 === 0;
const v = new Voxels([W, 27, D]);
const ground = (c) => Math.max(c.g, 0);

// 1. Foundation, floors and walls.
for (const c of cells.map(([x, z]) => foot[z][x])) {
  v.set(c.x, 0, c.z, "stone_bricks");                                          // y 0 is solid under every cell
  for (let y = 1; y < ground(c); y++) v.set(c.x, y, c.z, "stone_bricks");        // foundation up to the ground
  for (let y = Math.max(1, ground(c)); y <= c.deck; y++) {
    if (c.wall) {
      const mat = y === 1 ? "stone_bricks" : SLAB(y) ? "smooth_quartz" : "bricks";
      v.set(c.x, y, c.z, mat);
    } else if (SLAB(y)) {
      v.set(c.x, y, c.z, "smooth_stone");                                      // floor slabs, and the roof deck
    }
  }
  if (c.wall) v.set(c.x, c.deck + 1, c.z, "smooth_quartz");                  // parapet coping
}

// 2. Storey articulation: sills, glass with a pier every third bay, glowstone behind some glass.
for (const c of cells.map(([x, z]) => foot[z][x])) {
  if (!c.wall) continue;
  for (const s of [1, 5, 9, 13]) {
    if (s >= c.deck) break;
    const faces = openFaces(c, s + 2);
    if (faces.length === 0) continue;
    const corner = faces.some((d) => d === "N" || d === "S") && faces.some((d) => d === "W" || d === "E");
    const face = faces[0];
    const along = face === "N" || face === "S" ? c.x : c.z;
    if (corner || along % 3 === 0) continue;                                    // piers and corners stay brick
    const rows = s === 1 ? [3, 4] : [s + 2, s + 3];                              // ground floor glazing starts at the kickplate
    if (s === 1) { if (c.g <= 2) v.set(c.x, 2, c.z, "dark_oak_planks"); }        // timber shopfront kickplate
    else if (s + 1 >= c.g) v.set(c.x, s + 1, c.z, "smooth_quartz");              // sill
    for (const y of rows) if (y >= c.g) v.set(c.x, y, c.z, "glass");
    // Lit window: glowstone in the cell just inside the glass, in the air gap.
    if ((c.x * 7 + c.z * 3 + s) % 4 === 0) {
      const inner = nbOf(c, OPP[face]);
      const yl = s + 2;
      if (inner && !inner.wall && inner.g <= yl && yl < inner.deck) v.set(inner.x, yl, inner.z, "glowstone");
    }
  }
}

// 3. Interiors: hanging lanterns under each storey slab, in the air gap of cells that are not walls.
for (const c of cells.map(([x, z]) => foot[z][x])) {
  if (c.wall || (c.x % 4 !== 2) || (c.z % 4 !== 2)) continue;
  for (const s of [1, 5, 9]) {
    const y = s + 3;
    if (s + 4 <= c.deck && y >= c.g) v.set(c.x, y, c.z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 4. The entrance: a street-facing (south) ground-floor bay near the middle, a plank canopy over it.
let door = null;
for (const c of cells.map(([x, z]) => foot[z][x])) {
  if (!c.wall || inside(c.x, c.z + 1)) continue;
  const score = Math.abs(c.x - 15.5) + 3 * Math.max(0, c.g - 1);
  if (!door || score < door.score) door = { c, score };
}
if (door) {
  const { c } = door;
  v.set(c.x, 2, c.z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(c.x, 3, c.z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) {
    const n = cell(c.x + dx, c.z);
    if (n && n.wall) v.set(n.x, 4, n.z, "dark_oak_planks");                    // canopy fascia
  }
}

// 5. Roof: plant boxes on the tower deck and a few on the lower roof.
for (const c of cells.map(([x, z]) => foot[z][x])) {
  if (c.wall) continue;
  if (c.deck === 13 && c.x % 5 === 1 && c.z % 5 === 1) v.set(c.x, 14, c.z, "light_gray_concrete");
  if (c.deck === 9 && c.x % 7 === 3 && c.z % 7 === 3) v.set(c.x, 10, c.z, "iron_block");
}

const stats = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269676003.nbt");
console.log(JSON.stringify(stats));
