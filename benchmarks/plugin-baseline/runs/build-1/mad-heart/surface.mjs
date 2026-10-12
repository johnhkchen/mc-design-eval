// Surface relief painted onto the hull: coronary arteries, veins and fat stand PROUD of the muscle (+1 block).
import { R, NU, NY, NZ, pathPoints } from "./anat.mjs";
import { rnd, noise } from "./mats.mjs";

const BODY = new Set([R.VM, R.RA, R.LA, R.AUR]);
const TOP = new Set([R.FAT, R.ART, R.VEIN, R.RIB]);   // ridge cells already painted: a later ridge replaces them

// first solid cell scanning in from a side; returns the outer empty cell next to it or null
function skinCell(F, u, y, side) {
  if (u < 0 || u >= NU || y < 0 || y >= NY) return null;
  if (side === "front") {
    for (let z = 0; z < NZ; z++) { const v = F.get(u, y, z); if (v) return BODY.has(v) && z > 0 && !F.get(u, y, z - 1) ? [u, y, z - 1] : (TOP.has(v) ? [u, y, z] : null); }
  } else {
    for (let z = NZ - 1; z >= 0; z--) { const v = F.get(u, y, z); if (v) return BODY.has(v) && z < NZ - 1 && !F.get(u, y, z + 1) ? [u, y, z + 1] : (TOP.has(v) ? [u, y, z] : null); }
  }
  return null;
}
// side painting for curves given as (z, y): scan along u
function skinCellSide(F, z, y, side) {
  if (z < 0 || z >= NZ || y < 0 || y >= NY) return null;
  if (side === "right") {
    for (let u = NU - 1; u >= 0; u--) { const v = F.get(u, y, z); if (v) return BODY.has(v) && u < NU - 1 ? [u + 1, y, z] : null; }
  } else {
    for (let u = 0; u < NU; u++) { const v = F.get(u, y, z); if (v) return BODY.has(v) && u > 0 ? [u - 1, y, z] : null; }
  }
  return null;
}

// paint a line (width 1, 4-connected) along a curve of [a, y] control points
export function ridge(F, pts, role, { side = "front", width = 1, skip = 0 } = {}) {
  const P = pathPoints(pts.map(([a, y]) => [a, y, 0]), 0.25);
  const seen = new Set();
  const placed = [];
  let prev = null;
  const lay = (a, y) => {
    const c = side === "front" || side === "back" ? skinCell(F, a, y, side) : skinCellSide(F, a, y, side);
    if (!c) return;
    const k = c.join(",");
    if (seen.has(k)) return;
    seen.add(k); F.set(c[0], c[1], c[2], role); placed.push(c);
  };
  for (const [a, y] of P) {
    const A = Math.floor(a), Y = Math.floor(y);
    lay(A, Y);
    if (prev && prev[0] !== A && prev[1] !== Y) lay(A, prev[1]);   // keep the line 4-connected
    for (let w = 1; w < width; w++) lay(A + w, Y);
    prev = [A, Y];
  }
  return placed;
}

// fat: lumpy yellow cover along a curve, radius r(t) in blocks, gaps by noise
export function fat(F, pts, rOf, { side = "front", seed = 1, density = 0.62 } = {}) {
  const P = pathPoints(pts.map(([a, y]) => [a, y, 0]), 0.5);
  const cand = new Map();
  P.forEach(([a, y], i) => {
    const t = i / (P.length - 1);
    const r = rOf(t);
    for (let da = -Math.ceil(r); da <= Math.ceil(r); da++) for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
      const A = Math.floor(a) + da, Y = Math.floor(y) + dy;
      const d = Math.hypot(A + 0.5 - a, Y + 0.5 - y);
      if (d > r) continue;
      const k = `${A},${Y}`;
      const w = 1 - d / (r + 0.5);
      if (!cand.has(k) || cand.get(k) < w) cand.set(k, w);
    }
  });
  const placed = [];
  for (const [k, w] of cand) {
    const [A, Y] = k.split(",").map(Number);
    if (w + 0.7 * noise(A, Y, side === "front" ? 0 : 99, 2.2, seed) + 0.2 * rnd(A, Y, seed, 5) < 1.05 - density + 0.5) continue;
    const c = side === "front" || side === "back" ? skinCell(F, A, Y, side) : skinCellSide(F, A, Y, side);
    if (!c || F.get(c[0], c[1], c[2])) continue;
    F.set(c[0], c[1], c[2], R.FAT); placed.push(c);
  }
  return placed;
}
