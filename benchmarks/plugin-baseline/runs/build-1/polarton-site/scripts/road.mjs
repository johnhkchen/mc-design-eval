// least-cost road: grade, earthworks, curvature; 5 wide; ground-hugging profile with a max grade
import { readSite } from "./site.mjs";
export function planRoads(site, { from, to, maxGrade = 0.25, softGrade = 0.15, wGrade = 60, wEarth = 0.35, wTurn = 1.5, wTree = 0.5, wDiag = 0.6, half = 2, keepOut = [] }) {
  const { X, Z, H, water, hole, tree, built } = site;
  // smoothed ground (mean over the road's width) and local earthworks (sum |h - mean|) at each cell
  const S = [], E = [], bad = [];
  for (let z = 0; z < Z; z++) { S.push(new Float64Array(X)); E.push(new Float64Array(X)); bad.push(new Uint8Array(X));
    for (let x = 0; x < X; x++) { let sum = 0, n = 0, b = 0;
      for (let dz = -half; dz <= half; dz++) for (let dx = -half; dx <= half; dx++) { const xx = x + dx, zz = z + dz;
        if (xx < 0 || zz < 0 || xx >= X || zz >= Z) { b = 1; continue; }
        if (water[zz][xx] || hole(xx, zz) || built[zz][xx]) b = 1; else { sum += H[zz][xx]; n++; } }
      for (const k of keepOut) if (x >= k[0] - half && x <= k[2] + half && z >= k[1] - half && z <= k[3] + half) b = 1;
      bad[z][x] = b; S[z][x] = n ? sum / n : 0;
      let e = 0; for (let dz = -half; dz <= half; dz++) for (let dx = -half; dx <= half; dx++) { const xx = x + dx, zz = z + dz; if (xx >= 0 && zz >= 0 && xx < X && zz < Z && !hole(xx, zz)) e += Math.abs(H[zz][xx] - S[z][x]); }
      E[z][x] = e; } }
  const DIRS = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  // A* over (x, z, dir)
  const key = (x, z, d) => (z * X + x) * 8 + d;
  const dist = new Float64Array(X * Z * 8).fill(Infinity), prev = new Int32Array(X * Z * 8).fill(-1);
  const heap = []; const push = (f, k) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const hEst = (x, z) => Math.hypot(x - to[0], z - to[1]);
  const k0 = key(from[0], from[1], from[2]); dist[k0] = 0; push(hEst(from[0], from[1]), k0);
  let end = -1;
  while (heap.length) { const [, k] = pop(); const d = k % 8, c = (k - d) / 8, x = c % X, z = (c - x) / X;
    if (x === to[0] && z === to[1]) { end = k; break; }
    for (let nd = 0; nd < 8; nd++) { const turn = Math.min((nd - d + 8) % 8, (d - nd + 8) % 8); if (turn > 1) continue;
      const [dx, dz] = DIRS[nd], nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= X || nz >= Z || (bad[nz][nx] && Math.hypot(nx - from[0], nz - from[1]) > 3 && Math.hypot(nx - to[0], nz - to[1]) > 3)) continue;
      const len = Math.hypot(dx, dz), grade = Math.abs(S[nz][nx] - S[z][x]) / len; if (grade > maxGrade + 0.15) continue;
      const g = len * (1 + wGrade * Math.max(0, grade - softGrade) ** 2 + (grade > maxGrade ? 50 : 0)) + wEarth * E[nz][nx] * len + wTurn * turn + (dx && dz ? wDiag : 0) + (tree[nz][nx] ? wTree : 0);
      const nk = key(nx, nz, nd), nv = dist[k] + g; if (nv < dist[nk]) { dist[nk] = nv; prev[nk] = k; push(nv + hEst(nx, nz), nk); } } }
  if (end < 0) return null;
  const path = []; for (let k = end; k >= 0; k = prev[k]) { const d = k % 8, c = (k - d) / 8; path.push([c % X, (c - c % X) / X]); }
  path.reverse();
  // profile: smoothed ground along the path, then clamp to max grade both ways
  let y = path.map(([x, z]) => S[z][x]);
  for (let it = 0; it < 6; it++) y = y.map((v, i) => { const a = y[Math.max(0, i - 3)], b = y[Math.min(y.length - 1, i + 3)]; return (a + 2 * v + b) / 4; });
  y[0] = S[path[0][1]][path[0][0]];
  const seg = (i) => Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  for (let i = 1; i < y.length; i++) y[i] = Math.min(y[i], y[i - 1] + maxGrade * seg(i)), y[i] = Math.max(y[i], y[i - 1] - maxGrade * seg(i));
  for (let i = y.length - 2; i >= 0; i--) y[i] = Math.min(y[i], y[i + 1] + maxGrade * seg(i + 1)), y[i] = Math.max(y[i], y[i + 1] - maxGrade * seg(i + 1));
  return { path, y, S };
}
// rasterise a road: every cell within `half` of the centreline gets the height of its nearest centre point (rounded to half blocks)
export function rasterRoad(site, road, half = 2) {
  const cells = new Map();
  road.path.forEach(([x, z], i) => { for (let dz = -half; dz <= half; dz++) for (let dx = -half; dx <= half; dx++) { if (dx * dx + dz * dz > (half + 0.5) ** 2) continue; const k = `${x + dx},${z + dz}`, v = Math.round(road.y[i] * 2) / 2; const d = dx * dx + dz * dz; const o = cells.get(k); if (!o || o.d > d) cells.set(k, { x: x + dx, z: z + dz, y: v, d }); } });
  let cut = 0, fill = 0, deep = 0; for (const c of cells.values()) { const h = site.H[c.z]?.[c.x]; if (h == null || h < -4) continue; const t = Math.floor(c.y); if (h > t) cut += h - t; else fill += t - h; deep = Math.max(deep, Math.abs(h - t)); }
  return { cells: [...cells.values()], cut, fill, deep };
}
export function gradeStats(road) { let max = 0, steep = 0, len = 0; for (let i = 1; i < road.path.length; i++) { const d = Math.hypot(road.path[i][0] - road.path[i - 1][0], road.path[i][1] - road.path[i - 1][1]); len += d; const gr = Math.abs(road.y[i] - road.y[i - 1]) / d; max = Math.max(max, gr); if (gr > 0.17) steep += d; } return { len: Math.round(len), max: +max.toFixed(2), steep: Math.round(steep), climb: +(road.y.at(-1) - road.y[0]).toFixed(1) }; }
