// streets: A* route -> simplified -> smoothed centreline -> ground-hugging profile with a max grade -> raster
import { planRoads } from "./road.mjs";
const dp = (pts, eps) => { if (pts.length < 3) return pts; const [a, b] = [pts[0], pts.at(-1)]; let md = -1, mi = 0;
  for (let i = 1; i < pts.length - 1; i++) { const p = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, d = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L; if (d > md) { md = d; mi = i; } }
  return md > eps ? [...dp(pts.slice(0, mi + 1), eps).slice(0, -1), ...dp(pts.slice(mi), eps)] : [a, b]; };
const chaikin = (pts, n) => { for (let k = 0; k < n; k++) { const o = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const [p, q] = [pts[i], pts[i + 1]]; o.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]], [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]); } o.push(pts.at(-1)); pts = o; } return pts; };
const resample = (pts, step = 0.5) => { const o = [pts[0]]; let carry = 0; for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = step - carry; while (t <= L) { o.push([a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L]); t += step; } carry = L - (t - step); } o.push(pts.at(-1)); return o; };
const y0pinned = (from, startY) => startY != null || from?.[3] != null;
export function street(site, { from, to, via = [], points = null, smooth = 4, startY = null, endY = null, level = null, eps = 2, maxGrade = 0.2, half = 2, keepOut = [], straightIn = 4, ...opts }) {
  // route each leg, join; the first `straightIn` blocks continue the lane stub straight
  const legs = [from, ...via, to]; let raw = [];
  const DIRV = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  let start = from;
  if (straightIn && from?.[2] != null) { const [dx, dz] = DIRV[from[2]]; for (let k = 0; k < straightIn; k++) raw.push([from[0] + dx * k, from[1] + dz * k]); start = [from[0] + dx * straightIn, from[1] + dz * straightIn, from[2]]; }
  let cur = start;
  if (points) { raw = points.map(([x, z]) => [x, z]); }
  else for (const nxt of legs.slice(1)) { const r = planRoads(site, { from: cur.length === 3 ? cur : [...cur, 4], to: nxt, keepOut, half, maxGrade: maxGrade + 0.05, ...opts }); if (!r) return null;
    raw.push(...(raw.length ? r.path.slice(1) : r.path)); const L = r.path.length; const [a, b] = [r.path[L - 2], r.path[L - 1]]; const d = DIRV.findIndex(([dx, dz]) => dx === Math.sign(b[0] - a[0]) && dz === Math.sign(b[1] - a[1])); cur = [b[0], b[1], d < 0 ? 4 : d]; }
  let pts = resample(chaikin(dp(raw, eps), smooth));
  // profile: mean ground across the road at each point, smoothed, clamped to the max grade (both ways), first point pinned to the lane
  const { H, X, Z } = site;
  const gnd = (x, z) => { let s = 0, n = 0; for (let dz = -half; dz <= half; dz++) for (let dx = -half; dx <= half; dx++) { const xx = Math.round(x) + dx, zz = Math.round(z) + dz; if (xx < 0 || zz < 0 || xx >= X || zz >= Z) continue; const h = H[zz][xx]; if (h < -4) continue; s += h; n++; } return n ? s / n : 0; };
  let y = pts.map(([x, z]) => gnd(x, z));
  for (let it = 0; it < 30; it++) y = y.map((v, i) => i === 0 ? v : (y[Math.max(0, i - 4)] + 2 * v + y[Math.min(y.length - 1, i + 4)]) / 4);
  if (level != null) y = y.map(() => level);
  if (from?.[3] != null) y[0] = from[3]; if (startY != null) y[0] = startY; if (endY != null) y[y.length - 1] = endY; const step = 0.5;
  // pinned ends: blend the pins in linearly before the grade clamp
  { const n = y.length - 1, a = y[0] - (y[1] ?? y[0]), b = y[n] - (y[n - 1] ?? y[n]); if (startY != null || from?.[3] != null || endY != null) y = y.map((v, i) => v + (i ? (startY != null || from?.[3] != null ? 0 : 0) : 0)); }
  for (let i = 1; i < y.length - (endY != null ? 1 : 0); i++) y[i] = Math.max(y[i - 1] - maxGrade * step, Math.min(y[i], y[i - 1] + maxGrade * step));
  for (let i = y.length - 2; i >= (y0pinned(from, startY) ? 1 : 0); i--) y[i] = Math.max(y[i + 1] - maxGrade * step, Math.min(y[i], y[i + 1] + maxGrade * step));
  // raster: each cell within half+0.5 of the centreline takes the nearest point's height
  const cells = new Map();
  pts.forEach(([px, pz], i) => { for (let dz = -half - 1; dz <= half + 1; dz++) for (let dx = -half - 1; dx <= half + 1; dx++) { const cx = Math.round(px) + dx, cz = Math.round(pz) + dz, d = Math.hypot(cx - px, cz - pz); if (d > half + 0.5) continue; const k = `${cx},${cz}`, o = cells.get(k); if (!o || o.d > d) cells.set(k, { x: cx, z: cz, y: y[i], d, i }); } });
  const list = [...cells.values()].filter((c) => c.x >= 0 && c.z >= 0 && c.x < X && c.z < Z);
  let cut = 0, fill = 0, deep = 0; for (const c of list) { const h = H[c.z][c.x]; if (h < -4) continue; const t = Math.round(c.y); if (h > t) cut += h - t; else fill += t - h; deep = Math.max(deep, Math.abs(h - t)); }
  let len = 0, maxg = 0, steep = 0; for (let i = 1; i < pts.length; i++) { len += step; const gr = Math.abs(y[i] - y[i - 1]) / step; maxg = Math.max(maxg, gr); }
  // steep = length over 1 in 6 measured over 6-block windows
  for (let i = 12; i < pts.length; i++) if (Math.abs(y[i] - y[i - 12]) / 6 > 1 / 6 + 1e-6) steep += step;
  return { pts, y, cells: list, cut, fill, deep, len: Math.round(len), maxGrade: +maxg.toFixed(2), steep: Math.round(steep), climb: +(y.at(-1) - y[0]).toFixed(1) };
}
// plots in a row along one side of a street: front parallel to the street (snapped to an axis), gate on the street
export function plotsAlong(site, st, side, { wide = 12, deep = 14, setback = 1, keepOut = [], taken, maxCut = 7, maxFill = 5, pitch = 13 } = {}) {
  const { X, Z, H, water, hole, built } = site; const out = [];
  const roadAt = new Map(st.cells.map((c) => [`${c.x},${c.z}`, c]));
  const blocked = (x, z) => x < 0 || z < 0 || x >= X || z >= Z || water[z][x] || hole(x, z) || built[z][x] || taken.has(`${x},${z}`) || keepOut.some((k) => x >= k[0] && x <= k[2] && z >= k[1] && z <= k[3]);
  const P = st.pts, rim = (st.half ?? 2) + 0.5; let i = 6; /* the road's edge from its centre line */
  while (i < P.length - 6) {
    const [ax, az] = P[i - 4], [bx, bz] = P[i + 4], tx = bx - ax, tz = bz - az;
    const alongX = Math.abs(tx) >= Math.abs(tz); const [cx, cz] = P[i];
    // normal toward the chosen side (left/right of travel)
    let nx = side === "left" ? tz : -tz, nz = side === "left" ? -tx : tx;
    let best = null;
    for (let sb = setback; sb <= setback + 5 && !best; sb++) {
    let rect, face, gate;
    if (alongX) { const s = Math.sign(nz) || 1, edge = s > 0 ? Math.ceil(cz + rim + sb) : Math.floor(cz - rim - sb); /* first cell past the road's edge */ const x0 = Math.round(cx) - (wide >> 1);
      rect = s > 0 ? [x0, edge, x0 + wide - 1, edge + deep - 1] : [x0, edge - deep + 1, x0 + wide - 1, edge]; face = s > 0 ? "north" : "south"; gate = [Math.round(cx) - 1, s > 0 ? edge - 1 : edge + 1]; }
    else { const s = Math.sign(nx) || 1, edge = s > 0 ? Math.ceil(cx + rim + sb) : Math.floor(cx - rim - sb); const z0 = Math.round(cz) - (wide >> 1);
      rect = s > 0 ? [edge, z0, edge + deep - 1, z0 + wide - 1] : [edge - deep + 1, z0, edge, z0 + wide - 1]; face = s > 0 ? "west" : "east"; gate = [s > 0 ? edge - 1 : edge + 1, Math.round(cz) - 1]; }
    const [x0, z0, x1, z1] = rect; const road = Math.round(st.y[i]);
    let ok = true; const hs = [];
    for (let z = z0; z <= z1 && ok; z++) for (let x = x0; x <= x1; x++) { if (blocked(x, z) || roadAt.has(`${x},${z}`)) { ok = false; break; } hs.push(H[z][x]); }
    if (!ok) continue;
    // the pad may sit up to 3 above or 2 below the road (steps at the gate): pick the level with the least earth moved
    let pick = null;
    for (let off = -2; off <= 3; off++) { const pad = road + off; let cut = 0, fill = 0, dc = 0, df = 0;
      for (const h of hs) { if (h > pad) { cut += h - pad; dc = Math.max(dc, h - pad); } else { fill += pad - h; df = Math.max(df, pad - h); } }
      const cost = cut + fill + 15 * Math.abs(off); if (dc <= maxCut && df <= maxFill && (!pick || cost < pick.cost)) pick = { pad, cut, fill, dc, df, cost }; }
    if (pick) { const { pad, cut, fill, dc, df } = pick; let wall = 0;
      for (let x = x0; x <= x1; x++) for (const z of [z0, z1]) { const e = Math.abs(H[z][x] - pad); if (e >= 2) wall += e; }
      for (let z = z0 + 1; z < z1; z++) for (const x of [x0, x1]) { const e = Math.abs(H[z][x] - pad); if (e >= 2) wall += e; }
      best = { x0, z0, x1, z1, face, pad, road, cut, fill, dc, df, wall, gate, setback: sb };
    }
    }
    if (best) { out.push(best); for (let z = best.z0 - 1; z <= best.z1 + 1; z++) for (let x = best.x0 - 1; x <= best.x1 + 1; x++) taken.add(`${x},${z}`);
      i += pitch * 2; } else i += 2;
  }
  return out;
}
