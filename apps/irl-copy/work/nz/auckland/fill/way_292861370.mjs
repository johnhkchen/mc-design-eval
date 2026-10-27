// Columbia Apartments, Auckland (way 292861370): a 1970s reinforced-concrete apartment block on a basalt plinth, thirteen
// storeys over a stepped lower wing. Lidar roofs are 3x3-median-smoothed and snapped to storey tiers (60 tower, 48 and 36
// wings, 24 low edge), so every tier stands on the solid below it. The ground floor sits on one datum (y 8, the high side
// of the lot); the basalt plinth fills from y 0 under it, so the downhill side shows the extra base. Facade per storey: a
// light-grey spandrel at the floor line, two rows of bronze-tinted glass set in a recess (air in the outer skin, glass in
// the second) between white concrete piers every three blocks, a white lintel. Interiors are air with a floor slab per
// storey; a few windows have glowstone behind the glass. North entrance: a double dark-oak door under a grey canopy with
// a lantern, and a roof plant box on the tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861370.cells.json", "utf8"));
const W = 24, D = 21, DATUM = 8, TIERS = [24, 36, 48, 60];
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// tier top (absolute y, the roof cover's row + 1): the 3x3 median of the lidar, snapped to the nearest tier
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const m = median(x, z);
  T[x][z] = TIERS.reduce((best, t) => (Math.abs(t - m) < Math.abs(best - m) ? t : best), TIERS[0]);
}

const solid = (x, z, y) => inside(x, z) && T[x][z] > y;
// depth of each solid cell at height y: 0 = on the outside skin (a neighbour is open air), 1 = behind it, 2+ = interior
const depthCache = new Map();
const depthAt = (y) => {
  if (depthCache.has(y)) return depthCache.get(y);
  const d = Array.from({ length: W }, () => Array(D).fill(-1)), q = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (solid(x, z, y) && DIRS.some(([dx, dz]) => !solid(x + dx, z + dz, y))) { d[x][z] = 0; q.push([x, z]); }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    for (const [dx, dz] of DIRS) if (solid(x + dx, z + dz, y) && d[x + dx][z + dz] < 0) { d[x + dx][z + dz] = d[x][z] + 1; q.push([x + dx, z + dz]); }
  }
  depthCache.set(y, d); return d;
};
const depth = (x, z, y) => { const v = depthAt(y)[x][z]; return v < 0 ? 99 : v; };

// a pier (true) or a window bay (false) on the outer skin: piers every 3 blocks along each face; the second skin copies its outer neighbour
const isPier = (x, z, y) => {
  const ns = !solid(x, z - 1, y) || !solid(x, z + 1, y), ew = !solid(x - 1, z, y) || !solid(x + 1, z, y);
  if (ns && ew) return true;
  if (ns) return x % 3 === 0;
  if (ew) return z % 3 === 0;
  const d = depth(x, z, y);
  for (const [dx, dz] of DIRS) if (solid(x + dx, z + dz, y) && depth(x + dx, z + dz, y) === d - 1) return isPier(x + dx, z + dz, y);
  return true;
};

const g = new Voxels([W, 73, D]);
const glass = new Set(), key = (x, y, z) => `${x},${y},${z}`;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const t = T[x][z];
  for (let y = 0; y < DATUM; y++) g.set(x, y, z, "basalt");                    // plinth: solid from y 0 up to the datum
  for (let y0 = DATUM; y0 < t; y0 += 4) {
    g.set(x, y0, z, "light_gray_concrete");                                    // floor slab / spandrel line
    const d = depth(x, z, y0 + 1), pier = d <= 1 && isPier(x, z, y0 + 1);
    for (const y of [y0 + 1, y0 + 2]) {
      if (d === 0) { if (pier) g.set(x, y, z, "white_concrete"); }             // outer skin: piers, else open recess
      else if (d === 1) {
        if (pier) g.set(x, y, z, "white_concrete");
        else { g.set(x, y, z, "gray_stained_glass_pane"); glass.add(key(x, y, z)); }
      }
    }
    if (d <= 1) g.set(x, y0 + 3, z, "white_concrete");                         // lintel
    if (y0 + 4 === t) g.set(x, y0 + 3, z, "light_gray_concrete");              // roof cover over the tier
    if (y0 + 4 < t && d === 2 && ((x * 31 + z * 17 + y0 * 7) % 9 === 0)) {    // a lit room behind a window bay
      const lit = DIRS.some(([dx, dz]) => depth(x + dx, z + dz, y0 + 1) === 1 && !isPier(x + dx, z + dz, y0 + 1));
      if (lit) g.set(x, y0 + 1, z, "glowstone");
    }
  }
  if (depth(x, z, t - 1) === 0) g.set(x, t, z, "white_concrete");              // parapet on the tier's rim
}

// the tower's plant box on the roof, away from the rim
for (let x = 8; x <= 15; x++) for (let z = 6; z <= 12; z++) if (inside(x, z) && T[x][z] === 60 && depth(x, z, 59) >= 2)
  for (let y = 60; y <= 62; y++) g.set(x, y, z, "smooth_stone");

// north entrance: a double dark-oak door on the datum, a grey canopy, a lantern under it
for (const x of [1, 2]) {
  g.set(x, 8, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: x === 1 ? "left" : "right", open: "false", powered: "false" });
  g.set(x, 9, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: x === 1 ? "left" : "right", open: "false", powered: "false" });
  g.set(x, 10, 0, "lantern", { hanging: "true", waterlogged: "false" });
}
for (let x = 0; x <= 3; x++) g.set(x, 11, 0, "light_gray_concrete");

// glass panes join their neighbours in the wall plane, as a pane does in the world
const joins = (x, y, z) => { const b = g.get(x, y, z); return !!b && !/door|lantern|air/.test(b.block); };
for (const k of glass) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, "gray_stained_glass_pane", {
    east: String(joins(x + 1, y, z)), west: String(joins(x - 1, y, z)),
    north: String(joins(x, y, z - 1)), south: String(joins(x, y, z + 1)), waterlogged: "false",
  });
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861370.nbt");
console.log(JSON.stringify(stats));
