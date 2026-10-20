// Walks (plan.md part 2): central walk, the north and south Olmsted arcs, cross walks, pool walks.
import { readFileSync } from "node:fs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// The ground height map (heights.txt, the ground part's copy): one base-36 digit per cell, rows z, columns x.
const ROWS = readFileSync(new URL("./heights.txt", import.meta.url), "utf8").trim().split("\n");
const heightAt = (x, z) => parseInt(ROWS[z][x], 36);

// Olmsted arcs (plan 5a, 5b). The south arc is the north one mirrored about z 61.5 (z' = 124 - z). Both stop at x 154,
// one cell short of the side stairs at x 156, so the 3-wide disc of the last sample stays off the stair cells.
const NORTH_ARC = [[72, 30], [85, 24], [100, 21], [120, 21], [138, 25], [150, 31], [154, 36]];
const SOUTH_ARC = NORTH_ARC.map(([x, z]) => [x, 124 - z]);

// The ground part owns the lawn cell at H in every column and runParts locks it, so a walk cannot take the surface at H.
// The walk lies one block up instead: a bottom smooth_sandstone_slab at H+1, on the lawn, a half block above it.
const WALK = B.slab("smooth_sandstone", "bottom");
// Cells under something that stands on the walk: the platform's west ring and steps (x 59, z 66..90) and the statue
// plinths P/p (x 83..85, z 21..24) and J (x 84..85, z 99..100). A bottom slab there leaves half a block of air under
// the block above, so these cells take a full block instead.
const UNDER_MONUMENT = (x, z) =>
  (x === 59 && z >= 66 && z <= 90) ||
  (x >= 83 && x <= 85 && z >= 21 && z <= 24) ||
  (x >= 84 && x <= 85 && z >= 99 && z <= 100);
function walkCell(g, x, z) {
  const H = heightAt(x, z);
  if (H < 1) return;
  g.set(x, H + 1, z, ...(UNDER_MONUMENT(x, z) ? ["smooth_sandstone"] : WALK));
}

// A rectangle of walk, x0..x1 by z0..z1.
function strip(g, x0, z0, x1, z1) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) walkCell(g, x, z);
}

// Catmull-Rom through the plan points, sampled every half cell; the same curve as the vocabulary's curvedWalk.
function catmull([x0, y0], [x1, y1], [x2, y2], [x3, y3], t) {
  const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  return [f(x0, x1, x2, x3), f(y0, y1, y2, y3)];
}
function samples(pts) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
    const n = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 0.5));
    for (let k = 0; k < n; k++) out.push(catmull(p0, p1, p2, p3, k / n));
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// A 3-wide arc: a 3x3 square at every sample, clipped to region = [x0, z0, x1, z1].
function arc(g, pts, [x0, z0, x1, z1]) {
  const done = new Set();
  for (const [sx, sz] of samples(pts)) {
    const cx = Math.round(sx), cz = Math.round(sz);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const x = cx + dx, z = cz + dz, key = `${x},${z}`;
      if (done.has(key) || x < x0 || x > x1 || z < z0 || z > z1) continue;
      done.add(key);
      walkCell(g, x, z);
    }
  }
}

export function build(g) {
  strip(g, 16, 12, 17, 113);                           // pool walk, west side (plan 1c, 2b)
  strip(g, 58, 12, 59, 113);                           // pool walk, east side
  strip(g, 71, 58, 154, 64);                           // central axial walk (plan 5); x 155 belongs to the fountain basin
  strip(g, 71, 10, 73, 114);                           // cross walk on Union Square's east edge (x 70 is the paving)
  strip(g, 152, 18, 154, 106);                         // cross walk at the terrace foot, linking the arcs (clear of the grove trunks at z 15 and 109)
  arc(g, NORTH_ARC, [70, 18, 155, 38]);                // Pennsylvania Avenue walk (plan 5a)
  arc(g, SOUTH_ARC, [70, 86, 155, 106]);               // Maryland Avenue walk (plan 5b)
}
